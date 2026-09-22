import type {
  CanvasElement,
  Frame,
  ImageElement,
  Presentation,
  TextElement,
  VideoElement,
} from '../types/presentation'
import type { AppTheme } from './theme'

const PAGE_WIDTH = 1600
const PAGE_HEIGHT = 900
const PAGE_MARGIN = 88
const CONTENT_TOP = 145
const CONTENT_BOTTOM = 790

type Bounds = { left: number; top: number; right: number; bottom: number }

function nearestFrame(element: CanvasElement, frames: Frame[]): Frame {
  return frames.reduce((nearest, frame) => {
    const distance = (candidate: Frame) =>
      Math.hypot(
        element.x + element.width / 2 - (candidate.x + candidate.width / 2),
        element.y + element.height / 2 - (candidate.y + candidate.height / 2),
      )
    return distance(frame) < distance(nearest) ? frame : nearest
  })
}

export function elementsForPdfFrame(
  presentation: Presentation,
  frame: Frame,
): CanvasElement[] {
  return presentation.elements.filter((element) => {
    if (
      (element.type === 'text' || element.type === 'image') &&
      element.frameId
    )
      return element.frameId === frame.id
    const namedFrame = presentation.frames.find((candidate) =>
      element.id.startsWith(`${candidate.id}-`),
    )
    if (namedFrame) return namedFrame.id === frame.id
    return nearestFrame(element, presentation.frames).id === frame.id
  })
}

function rotatedBounds(
  x: number,
  y: number,
  width: number,
  height: number,
  rotation: number,
): Bounds {
  const centerX = x + width / 2
  const centerY = y + height / 2
  const angle = (rotation * Math.PI) / 180
  const cosine = Math.abs(Math.cos(angle))
  const sine = Math.abs(Math.sin(angle))
  const halfWidth = (width * cosine + height * sine) / 2
  const halfHeight = (width * sine + height * cosine) / 2
  return {
    left: centerX - halfWidth,
    top: centerY - halfHeight,
    right: centerX + halfWidth,
    bottom: centerY + halfHeight,
  }
}

function themePalette(theme: AppTheme) {
  if (theme === 'black')
    return {
      background: '#050607',
      frame: '#111516',
      ink: '#f7f9f8',
      muted: '#aeb9b6',
    }
  if (theme === 'dark')
    return {
      background: '#15252d',
      frame: '#253a42',
      ink: '#f1f8f6',
      muted: '#b3c8c9',
    }
  if (theme === 'sapphire')
    return {
      background: '#102d53',
      frame: '#183f68',
      ink: '#f1f7ff',
      muted: '#bdd6ee',
    }
  return {
    background: '#f5f9f7',
    frame: '#ffffff',
    ink: '#22383c',
    muted: '#68817e',
  }
}

function fontSize(text: TextElement, visual: boolean) {
  if (text.fontSize) return text.fontSize
  if (text.variant === 'heading') return 57
  if (text.variant === 'eyebrow') return 15
  return visual && text.id.endsWith('-caption') ? 27 : 21
}

function fontFamily(text: TextElement, visual: boolean) {
  if (text.fontFamily === 'Impact') return 'Impact, "Arial Black", sans-serif'
  if (text.fontFamily === 'Courier New') return '"Courier New", monospace'
  if (text.fontFamily) return `"${text.fontFamily}", sans-serif`
  return text.variant === 'body' && !(visual && text.id.endsWith('-caption'))
    ? '"DM Sans", sans-serif'
    : 'Manrope, sans-serif'
}

function setTextFont(
  context: CanvasRenderingContext2D,
  text: TextElement,
  visual: boolean,
) {
  const weight =
    text.effect === 'video' ||
    text.variant === 'heading' ||
    text.variant === 'eyebrow' ||
    visual
      ? 800
      : 500
  context.font = `${weight} ${fontSize(text, visual)}px ${fontFamily(text, visual)}`
}

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const result: string[] = []
  for (const paragraph of text.split('\n')) {
    if (!paragraph) {
      result.push('')
      continue
    }
    let line = ''
    for (const word of paragraph.split(/\s+/)) {
      const candidate = line ? `${line} ${word}` : word
      if (context.measureText(candidate).width <= maxWidth) {
        line = candidate
      } else {
        if (line) result.push(line)
        line = ''
        for (const character of word) {
          if (line && context.measureText(line + character).width > maxWidth) {
            result.push(line)
            line = ''
          }
          line += character
        }
      }
    }
    result.push(line)
  }
  return result
}

function textLineHeight(text: TextElement, visual: boolean) {
  const size = fontSize(text, visual)
  if (text.effect === 'video') return size * 1.04
  if (text.variant === 'heading') return size * 1.18
  if (text.variant === 'eyebrow') return size * 1.3
  return size * (visual ? 1.25 : 1.52)
}

function contentBounds(
  context: CanvasRenderingContext2D,
  frame: Frame,
  elements: CanvasElement[],
  visual: boolean,
): Bounds {
  const boxes = [
    rotatedBounds(frame.x, frame.y, frame.width, frame.height, frame.rotation),
    ...elements.map((element) => {
      let height = element.height
      if (element.type === 'text') {
        setTextFont(context, element, visual)
        height = Math.max(
          height,
          wrapText(context, element.text, element.width).length *
            textLineHeight(element, visual),
        )
      }
      return rotatedBounds(
        element.x,
        element.y,
        element.width,
        height,
        element.rotation,
      )
    }),
  ]
  return {
    left: Math.min(...boxes.map((box) => box.left)) - 30,
    top: Math.min(...boxes.map((box) => box.top)) - 30,
    right: Math.max(...boxes.map((box) => box.right)) + 30,
    bottom: Math.max(...boxes.map((box) => box.bottom)) + 30,
  }
}

function loadImage(source: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image()
    if (source.startsWith('https:')) image.crossOrigin = 'anonymous'
    let settled = false
    const finish = (result: HTMLImageElement | null) => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      resolve(result)
    }
    const timeout = window.setTimeout(() => finish(null), 8000)
    image.onload = () =>
      finish(image.naturalWidth && image.naturalHeight ? image : null)
    image.onerror = () => finish(null)
    image.src = source
  })
}

function drawCoverImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
) {
  const ratio = Math.max(
    width / image.naturalWidth,
    height / image.naturalHeight,
  )
  const sourceWidth = width / ratio
  const sourceHeight = height / ratio
  context.drawImage(
    image,
    (image.naturalWidth - sourceWidth) / 2,
    (image.naturalHeight - sourceHeight) / 2,
    sourceWidth,
    sourceHeight,
    0,
    0,
    width,
    height,
  )
}

function drawText(
  context: CanvasRenderingContext2D,
  element: TextElement,
  theme: AppTheme,
  visual: boolean,
) {
  const palette = themePalette(theme)
  setTextFont(context, element, visual)
  context.textBaseline = 'top'
  context.textAlign = 'left'
  context.fillStyle =
    !element.customColor && theme !== 'light'
      ? element.variant === 'eyebrow'
        ? '#b8dfff'
        : palette.ink
      : element.color
  const lines = wrapText(context, element.text, element.width)
  const lineHeight = textLineHeight(element, visual)
  if (element.effect === 'video') {
    context.lineJoin = 'round'
    context.lineWidth = Math.max(3, fontSize(element, visual) * 0.055)
    context.strokeStyle = '#13212b'
    context.shadowColor = '#0009'
    context.shadowBlur = 14
    context.shadowOffsetY = 8
  } else if (element.effect === 'shadow') {
    context.shadowColor = '#0009'
    context.shadowBlur = 16
    context.shadowOffsetY = 7
  }
  lines.forEach((line, index) => {
    const y = index * lineHeight
    if (element.effect === 'video') context.strokeText(line, 0, y)
    context.fillText(line, 0, y)
  })
}

function drawElement(
  context: CanvasRenderingContext2D,
  element: CanvasElement,
  image: HTMLImageElement | null,
  theme: AppTheme,
  visual: boolean,
) {
  context.save()
  context.translate(
    element.x + element.width / 2,
    element.y + element.height / 2,
  )
  context.rotate((element.rotation * Math.PI) / 180)
  context.translate(-element.width / 2, -element.height / 2)
  if (element.type === 'shape') {
    context.fillStyle = element.fill
    if (element.shape === 'circle') {
      context.beginPath()
      context.ellipse(
        element.width / 2,
        element.height / 2,
        element.width / 2,
        element.height / 2,
        0,
        0,
        Math.PI * 2,
      )
      context.fill()
    } else {
      context.fillRect(0, 0, element.width, element.height)
    }
  } else if (element.type === 'text') {
    drawText(context, element, theme, visual)
  } else {
    context.beginPath()
    context.roundRect(0, 0, element.width, element.height, 14)
    context.clip()
    if (element.type === 'image' && image) {
      drawCoverImage(context, image, element.width, element.height)
    } else {
      const gradient = context.createLinearGradient(
        0,
        0,
        element.width,
        element.height,
      )
      gradient.addColorStop(0, '#173e55')
      gradient.addColorStop(1, '#17273d')
      context.fillStyle = gradient
      context.fillRect(0, 0, element.width, element.height)
      context.fillStyle = '#fff'
      context.textAlign = 'center'
      context.font = '800 24px Manrope, sans-serif'
      context.fillText(
        element.type === 'video' ? '▶  VIDÉO YOUTUBE' : 'IMAGE INDISPONIBLE',
        element.width / 2,
        element.height / 2 - 8,
      )
      context.font = '500 15px "DM Sans", sans-serif'
      const label = element.type === 'video' ? element.title : element.alt
      context.fillText(
        label.slice(0, 42),
        element.width / 2,
        element.height / 2 + 27,
      )
    }
  }
  context.restore()
}

function drawFrame(
  context: CanvasRenderingContext2D,
  frame: Frame,
  theme: AppTheme,
) {
  const palette = themePalette(theme)
  context.save()
  context.translate(frame.x + frame.width / 2, frame.y + frame.height / 2)
  context.rotate((frame.rotation * Math.PI) / 180)
  context.translate(-frame.width / 2, -frame.height / 2)
  context.shadowColor = '#081c2a45'
  context.shadowBlur = 30
  context.shadowOffsetY = 12
  context.fillStyle = palette.frame
  context.beginPath()
  context.roundRect(0, 0, frame.width, frame.height, 20)
  context.fill()
  context.shadowColor = 'transparent'
  context.strokeStyle = frame.accent
  context.lineWidth = 3
  context.stroke()
  context.restore()
}

export async function createPresentationPdf(
  presentation: Presentation,
  theme: AppTheme,
  onProgress?: (completed: number, total: number) => void,
): Promise<{ blob: Blob; missingImages: number }> {
  const { jsPDF } = await import('jspdf')
  const frames = presentation.path
    .map((id) => presentation.frames.find((frame) => frame.id === id))
    .filter((frame): frame is Frame => frame !== undefined)
  if (!frames.length)
    throw new Error('Cette présentation ne contient aucune étape.')
  await document.fonts.ready
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: [1280, 720],
    compress: true,
  })
  pdf.setProperties({
    title: presentation.title,
    subject: 'Présentation Kzoom',
    author: 'Kzoom',
  })
  const canvas = document.createElement('canvas')
  canvas.width = PAGE_WIDTH
  canvas.height = PAGE_HEIGHT
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Le navigateur ne peut pas créer le PDF.')
  const visual = !!presentation.style && presentation.style !== 'story'
  const palette = themePalette(theme)
  const imageCache = new Map<string, Promise<HTMLImageElement | null>>()
  let missingImages = 0

  for (let index = 0; index < frames.length; index++) {
    const frame = frames[index]
    const elements = elementsForPdfFrame(presentation, frame)
    const images = new Map<string, HTMLImageElement | null>()
    await Promise.all(
      elements
        .filter((element): element is ImageElement => element.type === 'image')
        .map(async (element) => {
          if (!imageCache.has(element.src))
            imageCache.set(element.src, loadImage(element.src))
          const image = await imageCache.get(element.src)!
          images.set(element.id, image)
          if (!image) missingImages++
        }),
    )
    const bounds = contentBounds(context, frame, elements, visual)
    const scale = Math.min(
      (PAGE_WIDTH - PAGE_MARGIN * 2) / (bounds.right - bounds.left),
      (CONTENT_BOTTOM - CONTENT_TOP) / (bounds.bottom - bounds.top),
    )
    const centerX = (bounds.left + bounds.right) / 2
    const centerY = (bounds.top + bounds.bottom) / 2
    context.fillStyle = palette.background
    context.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT)
    context.fillStyle = frame.accent
    context.fillRect(0, 0, PAGE_WIDTH, 9)
    context.font = '800 24px Manrope, sans-serif'
    context.fillStyle = palette.ink
    context.fillText(presentation.title.slice(0, 75), PAGE_MARGIN, 73)
    context.textAlign = 'right'
    context.font = '800 18px Manrope, sans-serif'
    context.fillStyle = palette.muted
    context.fillText(
      `${String(index + 1).padStart(2, '0')} / ${String(frames.length).padStart(2, '0')}`,
      PAGE_WIDTH - PAGE_MARGIN,
      73,
    )
    context.textAlign = 'left'
    context.fillStyle = frame.accent
    context.fillRect(
      PAGE_MARGIN,
      104,
      (PAGE_WIDTH - PAGE_MARGIN * 2) * ((index + 1) / frames.length),
      5,
    )
    context.save()
    context.translate(PAGE_WIDTH / 2, (CONTENT_TOP + CONTENT_BOTTOM) / 2)
    context.scale(scale, scale)
    context.translate(-centerX, -centerY)
    drawFrame(context, frame, theme)
    for (const element of elements) {
      drawElement(
        context,
        element,
        images.get(element.id) ?? null,
        theme,
        visual,
      )
    }
    context.restore()
    context.font = '700 17px Manrope, sans-serif'
    context.fillStyle = palette.muted
    context.fillText(
      frame.name.split('·').at(-1)?.trim() || frame.name,
      PAGE_MARGIN,
      844,
    )
    context.textAlign = 'right'
    context.fillText('KZOOM', PAGE_WIDTH - PAGE_MARGIN, 844)
    context.textAlign = 'left'
    if (index > 0) pdf.addPage([1280, 720], 'landscape')
    pdf.addImage(
      canvas.toDataURL('image/jpeg', 0.88),
      'JPEG',
      0,
      0,
      1280,
      720,
      undefined,
      'FAST',
    )
    const video = elements.find(
      (element): element is VideoElement => element.type === 'video',
    )
    if (video) {
      const left = PAGE_WIDTH / 2 + (video.x - centerX) * scale
      const top =
        (CONTENT_TOP + CONTENT_BOTTOM) / 2 + (video.y - centerY) * scale
      pdf.link(
        left * 0.8,
        top * 0.8,
        video.width * scale * 0.8,
        video.height * scale * 0.8,
        {
          url: `https://www.youtube.com/watch?v=${video.videoId}`,
        },
      )
    }
    onProgress?.(index + 1, frames.length)
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  }
  return { blob: pdf.output('blob'), missingImages }
}
