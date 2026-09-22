import type { Frame, ImageElement, Presentation } from '../types/presentation'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import pptxWasmUrl from 'pptx-svg/wasm?url'

const MAX_FILE_BYTES = 30 * 1024 * 1024
const MAX_PAGES = 40
const MAX_PRESENTATION_CHARS = 3_500_000
const attempts = [
  { width: 1100, quality: 0.78 },
  { width: 900, quality: 0.68 },
  { width: 700, quality: 0.58 },
  { width: 520, quality: 0.48 },
]

type PageRenderer = (index: number, width: number) => Promise<HTMLCanvasElement>

function fileType(file: File): 'pdf' | 'pptx' {
  const name = file.name.toLowerCase()
  if (name.endsWith('.pdf') || file.type === 'application/pdf') return 'pdf'
  if (
    name.endsWith('.pptx') ||
    file.type ===
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  )
    return 'pptx'
  if (name.endsWith('.ppt'))
    throw new Error('Enregistrez cet ancien PowerPoint au format .pptx.')
  throw new Error('Choisissez un fichier PDF ou PowerPoint .pptx.')
}

function makePresentation(
  title: string,
  kind: 'pdf' | 'pptx',
  pages: { src: string; width: number; height: number }[],
): Presentation {
  const frames: Frame[] = []
  const elements: ImageElement[] = []
  let x = 0
  pages.forEach((page, index) => {
    const id = `import-${index + 1}`
    const frameWidth = page.width + 48
    const frameHeight = page.height + 80
    frames.push({
      id,
      name: `${String(index + 1).padStart(2, '0')} · ${kind === 'pdf' ? 'Page' : 'Diapositive'} ${index + 1}`,
      x,
      y: 0,
      width: frameWidth,
      height: frameHeight,
      rotation: 0,
      cameraZoom: 1,
      duration: 650,
      accent: '#7b62b6',
    })
    elements.push({
      id: `${id}-image`,
      type: 'image',
      frameId: id,
      src: page.src,
      alt: `${kind === 'pdf' ? 'Page' : 'Diapositive'} ${index + 1} de ${title}`,
      x: x + 24,
      y: 20,
      width: page.width,
      height: page.height,
      rotation: 0,
    })
    x += frameWidth + 150
  })
  return {
    version: 1,
    title,
    style: 'story',
    frames,
    elements,
    path: frames.map((frame) => frame.id),
  }
}

function canvasImage(canvas: HTMLCanvasElement, quality: number) {
  const src = canvas.toDataURL('image/jpeg', quality)
  if (!src.startsWith('data:image/jpeg'))
    throw new Error('Impossible de convertir une page du document en image.')
  return { src, width: canvas.width, height: canvas.height }
}

async function pdfPages(
  file: File,
): Promise<{
  count: number
  render: PageRenderer
  close: () => Promise<void>
}> {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl
  const task = pdfjs.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
  })
  const document = await task.promise
  return {
    count: document.numPages,
    close: () => task.destroy(),
    render: async (index, width) => {
      const page = await document.getPage(index + 1)
      try {
        const original = page.getViewport({ scale: 1 })
        const scale = Math.min(width / original.width, 1400 / original.height)
        const viewport = page.getViewport({ scale })
        const canvas = window.document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(viewport.width))
        canvas.height = Math.max(1, Math.round(viewport.height))
        const context = canvas.getContext('2d', { alpha: false })
        if (!context)
          throw new Error('Le navigateur ne peut pas dessiner ce PDF.')
        context.fillStyle = '#ffffff'
        context.fillRect(0, 0, canvas.width, canvas.height)
        await page.render({ canvas, canvasContext: context, viewport }).promise
        return canvas
      } finally {
        page.cleanup()
      }
    },
  }
}

async function pptxPages(
  file: File,
): Promise<{
  count: number
  render: PageRenderer
  close: () => Promise<void>
}> {
  const { PptxRenderer } = await import('pptx-svg')
  const renderer = new PptxRenderer()
  await renderer.init(pptxWasmUrl)
  await renderer.loadPptx(await file.arrayBuffer())
  return {
    count: renderer.getSlideCount(),
    close: async () => undefined,
    render: async (index, width) => {
      const svg = renderer.renderSlideSvg(index)
      if (!svg.includes('<svg'))
        throw new Error(
          `La diapositive ${index + 1} ne peut pas être affichée.`,
        )
      const url = URL.createObjectURL(
        new Blob([svg], { type: 'image/svg+xml' }),
      )
      try {
        const image = new Image()
        image.src = url
        await image.decode()
        const scale = Math.min(
          width / image.naturalWidth,
          1400 / image.naturalHeight,
        )
        const canvas = window.document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
        const context = canvas.getContext('2d', { alpha: false })
        if (!context)
          throw new Error('Le navigateur ne peut pas dessiner ce PowerPoint.')
        context.fillStyle = '#ffffff'
        context.fillRect(0, 0, canvas.width, canvas.height)
        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        return canvas
      } finally {
        URL.revokeObjectURL(url)
      }
    },
  }
}

export async function importDocument(
  file: File,
  onProgress?: (page: number, total: number) => void,
): Promise<Presentation> {
  const kind = fileType(file)
  if (file.size > MAX_FILE_BYTES)
    throw new Error('Ce fichier dépasse la limite de 30 Mo.')
  const source = kind === 'pdf' ? await pdfPages(file) : await pptxPages(file)
  try {
    if (!source.count) throw new Error('Ce document ne contient aucune page.')
    if (source.count > MAX_PAGES)
      throw new Error(
        `Ce document contient plus de ${MAX_PAGES} pages ou diapositives.`,
      )
    const title = file.name
      .replace(/\.(pdf|pptx)$/i, '')
      .replace(/[-_]+/g, ' ')
      .trim()
    for (const attempt of attempts) {
      const pages: { src: string; width: number; height: number }[] = []
      for (let index = 0; index < source.count; index++) {
        onProgress?.(index + 1, source.count)
        pages.push(
          canvasImage(
            await source.render(index, attempt.width),
            attempt.quality,
          ),
        )
        if (
          pages.reduce((length, page) => length + page.src.length, 0) >
          MAX_PRESENTATION_CHARS
        )
          break
      }
      if (pages.length === source.count) {
        const presentation = makePresentation(
          title || 'Document importé',
          kind,
          pages,
        )
        if (JSON.stringify(presentation).length <= MAX_PRESENTATION_CHARS)
          return presentation
      }
    }
    throw new Error(
      'Ce document est trop volumineux pour le stockage local. Essayez un fichier plus court.',
    )
  } finally {
    await source.close()
  }
}
