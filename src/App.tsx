import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  CircleHelp,
  Clapperboard,
  Download,
  FileDown,
  LayoutTemplate,
  Maximize2,
  Images,
  Play,
  Scan,
  Sparkles,
  Trash2,
  Type,
  Upload,
  Video,
  X,
} from 'lucide-react'
import { InfiniteCanvas } from './components/canvas/InfiniteCanvas'
import { SlideNumber } from './components/ui/SlideNumber'
import {
  addNestedSlide,
  ancestorsOf,
  childrenOf,
  deleteSlide,
  duplicateSlide,
  moveSlide,
  slideNumbers,
} from './engine/slideHierarchy'
import { StylePicker } from './components/ui/StylePicker'
import { PageStylePicker } from './components/ui/PageStylePicker'
import { TextEditor } from './components/ui/TextEditor'
import { ImageEditor } from './components/ui/ImageEditor'
import { ThemeSwitcher } from './components/ui/ThemeSwitcher'
import { VideoDialog } from './components/ui/VideoDialog'
import { demoPresentation } from './data/demo'
import {
  appendMediaToStory,
  buildVisualPresentation,
  demoGallery,
  galleryFromPresentation,
} from './data/visualStyles'
import { CameraController } from './engine/CameraController'
import { workspacePresentation } from './engine/slideWorkspace'
import {
  KeyboardShortcutManager,
  isTypingTarget,
} from './engine/KeyboardShortcutManager'
import { useEditorStore } from './store/editorStore'
import { usePresentationStore } from './store/presentationStore'
import { parsePresentation } from './utils/storage'
import { prepareImages } from './utils/images'
import { createPresentationPdf } from './utils/pdfExport'
import { importDocument } from './utils/documentImport'
import type {
  CanvasElement,
  Presentation,
  PresentationStyle,
  ImageElement,
  TextElement,
} from './types/presentation'

export default function App() {
  const presentation = usePresentationStore((state) => state.presentation)
  const saveStatus = usePresentationStore((state) => state.saveStatus)
  const rename = usePresentationStore((state) => state.rename)
  const replace = usePresentationStore((state) => state.replace)
  const presenting = useEditorStore((state) => state.presenting)
  const activeFrame = useEditorStore((state) => state.activeFrame)
  const theme = useEditorStore((state) => state.theme)
  const setPresenting = useEditorStore((state) => state.setPresenting)
  const setActiveFrame = useEditorStore((state) => state.setActiveFrame)
  const viewportRef = useRef<HTMLDivElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const documentRef = useRef<HTMLInputElement>(null)
  const imageRef = useRef<HTMLInputElement>(null)
  const replaceImageRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState('')
  const [showHelp, setShowHelp] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showStyles, setShowStyles] = useState(false)
  const [showPageStyles, setShowPageStyles] = useState(false)
  const [styleTargetParentId, setStyleTargetParentId] = useState<string | null>(
    null,
  )
  const [showVideoDialog, setShowVideoDialog] = useState(false)
  const [showPresentationOptions, setShowPresentationOptions] = useState(false)
  const [presentationTransition, setPresentationTransition] = useState<
    'overview' | 'direct'
  >('overview')
  const [cleanMode, setCleanMode] = useState(false)
  const [showTextEditor, setShowTextEditor] = useState(false)
  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    null,
  )
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null)
  const [pdfBusy, setPdfBusy] = useState(false)
  const [importBusy, setImportBusy] = useState(false)
  const [activeNestedId, setActiveNestedId] = useState<string | null>(null)
  const [navigationHistory, setNavigationHistory] = useState<string[]>([])
  const [showStructure, setShowStructure] = useState(false)
  const [numberMenuFrameId, setNumberMenuFrameId] = useState<string | null>(
    null,
  )
  const [draggedSlideId, setDraggedSlideId] = useState<string | null>(null)
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  const controller = useMemo(
    () =>
      new CameraController(
        () => useEditorStore.getState().camera,
        (camera) => useEditorStore.getState().setCamera(camera),
        () => ({
          width: viewportRef.current?.clientWidth ?? 1000,
          height: viewportRef.current?.clientHeight ?? 700,
        }),
      ),
    [],
  )

  const pathFrames = presentation.path
    .map((id) => presentation.frames.find((frame) => frame.id === id))
    .filter((frame) => frame !== undefined)
  const gallery = galleryFromPresentation(presentation)
  const currentFrame = activeNestedId
    ? presentation.frames.find((frame) => frame.id === activeNestedId)
    : pathFrames[activeFrame]
  const subPresentationParent = currentFrame?.parentId
    ? presentation.frames.find((frame) => frame.id === currentFrame.parentId)
    : undefined
  const styleTargetParent = presentation.frames.find(
    (frame) => frame.id === styleTargetParentId,
  )
  const visiblePresentation = workspacePresentation(
    presentation,
    activeNestedId,
  )
  const workspaceFrames =
    activeNestedId && currentFrame?.parentId
      ? childrenOf(presentation, currentFrame.parentId)
      : pathFrames
  const numbers = slideNumbers(presentation)
  const numberMenuFrame = presentation.frames.find(
    (frame) => frame.id === numberMenuFrameId,
  )
  const breadcrumbFrames = currentFrame
    ? [...ancestorsOf(presentation, currentFrame.id), currentFrame]
    : []
  const activeSiblings = currentFrame?.parentId
    ? childrenOf(presentation, currentFrame.parentId)
    : pathFrames
  const activeSiblingIndex = activeSiblings.findIndex(
    (frame) => frame.id === currentFrame?.id,
  )
  const selectedElement = presentation.elements.find(
    (element) => element.id === selectedElementId,
  )
  const selectedFrame = presentation.frames.find(
    (frame) => frame.id === selectedFrameId,
  )
  const selectedTextId =
    selectedElement?.type === 'text' ? selectedElement.id : null
  const selectedImageId =
    selectedElement?.type === 'image' ? selectedElement.id : null
  const selectedImage =
    selectedElement?.type === 'image' ? selectedElement : undefined
  const selectedText = presentation.elements.find(
    (element): element is TextElement =>
      element.type === 'text' && element.id === selectedTextId,
  )
  const frameTexts = presentation.elements.filter(
    (element): element is TextElement =>
      element.type === 'text' &&
      !!currentFrame &&
      ((element.frameId
        ? element.frameId === currentFrame.id
        : element.id === `${currentFrame.id}-caption` ||
          (element.x >= currentFrame.x - 30 &&
            element.x <= currentFrame.x + currentFrame.width + 30 &&
            element.y >= currentFrame.y - 30 &&
            element.y <= currentFrame.y + currentFrame.height + 160)) ||
        element.id === selectedTextId),
  )

  function updateFrameTitle(title: string) {
    if (!currentFrame) return
    const prefix = currentFrame.name.includes('·')
      ? `${currentFrame.name.split('·')[0].trim()} · `
      : ''
    replace({
      ...presentation,
      frames: presentation.frames.map((frame) =>
        frame.id === currentFrame.id
          ? { ...frame, name: `${prefix}${title}` }
          : frame,
      ),
      elements: presentation.elements.map((element) =>
        element.id === `${currentFrame.id}-caption` && element.type === 'text'
          ? { ...element, text: title }
          : element.id === `${currentFrame.id}-video` &&
              element.type === 'video'
            ? { ...element, title }
            : element,
      ),
    })
  }

  function updateTextById(id: string, changes: Partial<TextElement>) {
    const latest = usePresentationStore.getState().presentation
    const captionFrame = latest.frames.find(
      (frame) => id === `${frame.id}-caption`,
    )
    replace({
      ...latest,
      frames:
        captionFrame && changes.text !== undefined
          ? latest.frames.map((frame) =>
              frame.id === captionFrame.id
                ? {
                    ...frame,
                    name: `${frame.name.includes('·') ? `${frame.name.split('·')[0].trim()} · ` : ''}${changes.text}`,
                  }
                : frame,
            )
          : latest.frames,
      elements: latest.elements.map((element) =>
        element.id === id && element.type === 'text'
          ? { ...element, ...changes }
          : captionFrame &&
              changes.text !== undefined &&
              element.id === `${captionFrame.id}-video` &&
              element.type === 'video'
            ? { ...element, title: changes.text }
            : element,
      ),
    })
  }

  function updateText(changes: Partial<TextElement>) {
    if (selectedTextId) updateTextById(selectedTextId, changes)
  }

  function deleteTextById(id: string) {
    const latest = usePresentationStore.getState().presentation
    if (
      !latest.elements.some(
        (element) => element.id === id && element.type === 'text',
      )
    )
      return
    replace({
      ...latest,
      elements: latest.elements.filter((element) => element.id !== id),
    })
    setSelectedElementId(null)
  }

  function deleteSelectedItem() {
    const latest = usePresentationStore.getState().presentation
    if (selectedElementId) {
      if (
        !latest.elements.some((element) => element.id === selectedElementId)
      ) {
        setSelectedElementId(null)
        return
      }
      replace({
        ...latest,
        elements: latest.elements.filter(
          (element) => element.id !== selectedElementId,
        ),
      })
      setSelectedElementId(null)
      setShowTextEditor(false)
      setMessage('Élément supprimé')
      window.setTimeout(() => setMessage(''), 2500)
      return
    }

    if (!selectedFrameId) return
    const frame = latest.frames.find((item) => item.id === selectedFrameId)
    if (!frame) {
      setSelectedFrameId(null)
      return
    }
    const childCount = childrenOf(latest, frame.id).length
    if (
      !window.confirm(
        `Supprimer la slide « ${frame.name.split('·').at(-1)?.trim()} »${childCount ? ` et ses ${childCount} sous-slide${childCount > 1 ? 's' : ''}` : ''} ?`,
      )
    )
      return

    const siblings = childrenOf(latest, frame.parentId)
    const index = siblings.findIndex((item) => item.id === frame.id)
    const fallback =
      siblings[index + 1] ??
      siblings[index - 1] ??
      (frame.parentId
        ? latest.frames.find((item) => item.id === frame.parentId)
        : undefined)
    const next = deleteSlide(latest, frame.id)
    replace(next)
    setSelectedFrameId(null)
    setSelectedElementId(null)
    setShowTextEditor(false)
    if (fallback) {
      const root = ancestorsOf(next, fallback.id)[0] ?? fallback
      setActiveFrame(Math.max(0, next.path.indexOf(root.id)))
      setActiveNestedId(fallback.parentId ? fallback.id : null)
      controller.focusOn(fallback)
    } else {
      setActiveFrame(0)
      setActiveNestedId(null)
      controller.fitToScreen(next.frames)
    }
    setMessage('Slide supprimée')
    window.setTimeout(() => setMessage(''), 2500)
  }

  function selectCanvasElement(element: CanvasElement) {
    setSelectedElementId(element.id)
    setSelectedFrameId(null)
    if (element.type !== 'text') setShowTextEditor(false)
    if ('frameId' in element && element.frameId) {
      const owner = presentation.frames.find(
        (frame) => frame.id === element.frameId,
      )
      if (owner?.parentId) setActiveNestedId(owner.id)
    }
  }

  function addText(kind: 'body' | 'heading' = 'body') {
    if (!currentFrame) return
    const title = kind === 'heading'
    const element: TextElement = {
      id: `text-${crypto.randomUUID()}`,
      type: 'text',
      frameId: currentFrame.id,
      variant: title ? 'heading' : 'body',
      text: title ? 'VOTRE TITRE' : 'Votre texte',
      color: title ? '#172736' : '#5e7281',
      customColor: false,
      fontFamily: title
        ? currentFrame.parentId
          ? 'Manrope'
          : 'Impact'
        : 'DM Sans',
      fontSize: title ? (currentFrame.parentId ? 56 : 100) : 21,
      effect: title && !currentFrame.parentId ? 'video' : 'plain',
      x: currentFrame.x + (currentFrame.parentId ? 80 : title ? 25 : 32),
      y: currentFrame.parentId
        ? currentFrame.y + (title ? 90 : 420)
        : title
          ? currentFrame.y + 80
          : currentFrame.y + currentFrame.height + 34,
      width: title
        ? currentFrame.width - (currentFrame.parentId ? 160 : 50)
        : Math.min(currentFrame.width - 64, 480),
      height: title ? 230 : 90,
      rotation: 0,
    }
    replace({ ...presentation, elements: [...presentation.elements, element] })
    setSelectedElementId(element.id)
    setSelectedFrameId(null)
    setShowTextEditor(true)
  }

  function selectText(element: TextElement) {
    if (
      element.frameId &&
      presentation.frames.some(
        (frame) => frame.id === element.frameId && frame.parentId,
      )
    )
      setActiveNestedId(element.frameId)
    const frameIndex = pathFrames.findIndex((frame) =>
      element.frameId
        ? frame.id === element.frameId
        : element.id === `${frame.id}-caption` ||
          (element.x >= frame.x - 30 &&
            element.x <= frame.x + frame.width + 30 &&
            element.y >= frame.y - 30 &&
            element.y <= frame.y + frame.height + 160),
    )
    if (frameIndex >= 0) setActiveFrame(frameIndex)
    setSelectedElementId(element.id)
    setSelectedFrameId(null)
    setShowTextEditor(true)
  }

  function updateImageById(id: string, changes: Partial<ImageElement>) {
    const latest = usePresentationStore.getState().presentation
    replace({
      ...latest,
      elements: latest.elements.map((element) =>
        element.id === id && element.type === 'image'
          ? { ...element, ...changes }
          : element,
      ),
    })
  }

  function selectImage(image: ImageElement) {
    setSelectedElementId(image.id)
    setSelectedFrameId(null)
    setShowTextEditor(false)
  }

  async function replaceSelectedImage(file?: File) {
    if (!file || !selectedImage) return
    try {
      const [replacement] = await prepareImages([file])
      if (!replacement) return
      updateImageById(selectedImage.id, {
        src: replacement.src,
        alt: replacement.alt || selectedImage.alt,
      })
      setMessage('Image remplacée')
    } catch {
      setMessage('Impossible de remplacer cette image.')
    }
    window.setTimeout(() => setMessage(''), 3500)
  }

  async function pasteImages(files: File[]) {
    try {
      const images = await prepareImages(files)
      const latest = usePresentationStore.getState().presentation
      const pastedCount = latest.elements.filter((element) =>
        element.id.startsWith('pasted-image-'),
      ).length
      if (pastedCount + images.length > 24)
        throw new Error('Limite de 24 images collées par présentation.')
      const camera = useEditorStore.getState().camera
      const added = await Promise.all(
        images.map(async (image, index): Promise<ImageElement> => {
          const preview = new Image()
          preview.src = image.src
          await preview.decode()
          const scale = Math.min(
            1,
            480 / preview.naturalWidth,
            320 / preview.naturalHeight,
          )
          const width = Math.max(1, Math.round(preview.naturalWidth * scale))
          const height = Math.max(1, Math.round(preview.naturalHeight * scale))
          return {
            id: `pasted-image-${crypto.randomUUID()}`,
            type: 'image',
            frameId: currentFrame?.id,
            src: image.src,
            alt: image.alt || 'Image collée',
            x: Math.round(camera.x - width / 2 + index * 32),
            y: Math.round(camera.y - height / 2 + index * 32),
            width,
            height,
            rotation: 0,
          }
        }),
      )
      const next = { ...latest, elements: [...latest.elements, ...added] }
      if (JSON.stringify(next).length > 3_500_000)
        throw new Error(
          'Stockage local plein : utilisez des images plus petites.',
        )
      replace(next)
      setSelectedElementId(added.at(-1)?.id ?? null)
      setSelectedFrameId(null)
      setMessage(
        `${added.length} image${added.length > 1 ? 's' : ''} collée${added.length > 1 ? 's' : ''}`,
      )
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Impossible de coller cette image.',
      )
    }
    window.setTimeout(() => setMessage(''), 4500)
  }

  function pasteCopiedImage(image: ImageElement) {
    const latest = usePresentationStore.getState().presentation
    const pastedCount = latest.elements.filter((element) =>
      element.id.startsWith('pasted-image-'),
    ).length
    if (pastedCount >= 24) {
      setMessage('Limite de 24 images collées par présentation.')
      return
    }
    const camera = useEditorStore.getState().camera
    const copy: ImageElement = {
      ...image,
      id: `pasted-image-${crypto.randomUUID()}`,
      frameId: currentFrame?.id,
      x: Math.round(camera.x - image.width / 2 + 32),
      y: Math.round(camera.y - image.height / 2 + 32),
    }
    const next = { ...latest, elements: [...latest.elements, copy] }
    if (JSON.stringify(next).length > 3_500_000) {
      setMessage('Stockage local plein : utilisez des images plus petites.')
      return
    }
    replace(next)
    setSelectedElementId(copy.id)
    setSelectedFrameId(null)
    setMessage('Image copiée sur le canvas')
    window.setTimeout(() => setMessage(''), 4500)
  }

  useEffect(() => {
    const isEditingText = (target: EventTarget | null) =>
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement ||
      (target instanceof HTMLElement && target.isContentEditable)
    const handleCopy = (event: ClipboardEvent) => {
      if (useEditorStore.getState().presenting || isEditingText(event.target))
        return
      const element = usePresentationStore
        .getState()
        .presentation.elements.find(
          (item) =>
            item.id === (selectedImageId ?? selectedTextId) &&
            (item.type === 'image' || item.type === 'text'),
        )
      if (!element || !event.clipboardData) return
      event.clipboardData.setData(
        'application/x-kzoom-element',
        JSON.stringify(element),
      )
      if (element.type === 'text')
        event.clipboardData.setData('text/plain', element.text)
      event.preventDefault()
      setMessage('Élément copié')
      window.setTimeout(() => setMessage(''), 4500)
    }
    const handleCut = (event: ClipboardEvent) => {
      if (useEditorStore.getState().presenting || isEditingText(event.target))
        return
      const id = selectedImageId ?? selectedTextId
      if (!id) return
      handleCopy(event)
      const latest = usePresentationStore.getState().presentation
      usePresentationStore.getState().replace({
        ...latest,
        elements: latest.elements.filter((item) => item.id !== id),
      })
      setSelectedElementId(null)
      setSelectedFrameId(null)
    }
    const handlePaste = (event: ClipboardEvent) => {
      const target = event.target
      if (useEditorStore.getState().presenting || isEditingText(target)) return
      const files = Array.from(event.clipboardData?.items ?? [])
        .filter(
          (item) => item.kind === 'file' && item.type.startsWith('image/'),
        )
        .map((item) => item.getAsFile())
        .filter((file): file is File => file !== null)
      if (!files.length) {
        const copied =
          event.clipboardData?.getData('application/x-kzoom-element') ||
          event.clipboardData?.getData('application/x-zoomet-element') ||
          event.clipboardData?.getData('application/x-zoomet-image')
        if (!copied) return
        try {
          const element = JSON.parse(copied) as ImageElement | TextElement
          if (element.type !== 'image' && element.type !== 'text') return
          event.preventDefault()
          if (element.type === 'image') pasteCopiedImage(element)
          else {
            const latest = usePresentationStore.getState().presentation
            const copy = {
              ...element,
              id: `text-${crypto.randomUUID()}`,
              frameId: currentFrame?.id,
              x: element.x + 24,
              y: element.y + 24,
            }
            replace({ ...latest, elements: [...latest.elements, copy] })
            setSelectedElementId(copy.id)
            setSelectedFrameId(null)
          }
        } catch {
          setMessage('Impossible de coller cette image.')
        }
        return
      }
      event.preventDefault()
      void pasteImages(files)
    }
    window.addEventListener('copy', handleCopy)
    window.addEventListener('cut', handleCut)
    window.addEventListener('paste', handlePaste)
    return () => {
      window.removeEventListener('copy', handleCopy)
      window.removeEventListener('cut', handleCut)
      window.removeEventListener('paste', handlePaste)
    }
  })

  function chooseStyle(
    style: PresentationStyle,
    frameShape: NonNullable<
      Presentation['frameShape']
    > = presentation.frameShape ?? 'rectangle',
  ) {
    if (
      style === 'story' &&
      !presentation.frames.some((frame) => frame.parentId) &&
      gallery.some(
        (item) =>
          item.kind === 'video' || !item.alt.startsWith('Paysage illustré'),
      ) &&
      !window.confirm(
        'Revenir à la démo classique supprimera les images de cette présentation locale. Exportez le JSON pour les garder. Continuer ?',
      )
    )
      return
    if (
      presentation.style === 'story' &&
      style !== 'story' &&
      JSON.stringify(presentation.elements) !==
        JSON.stringify(demoPresentation.elements) &&
      !window.confirm(
        'Ce style remplacera le contenu actuel par une galerie d’exemple. Exportez le JSON pour le garder. Continuer ?',
      )
    )
      return
    const next =
      style === 'story'
        ? presentation.frames.some((frame) => frame.parentId)
          ? { ...presentation, style: 'story' as const }
          : { ...demoPresentation, title: presentation.title }
        : buildVisualPresentation(
            style,
            gallery.length ? gallery : demoGallery,
            presentation.title,
            presentation,
            frameShape,
          )
    replace(next)
    setActiveFrame(0)
    setActiveNestedId(null)
    setSelectedElementId(null)
    setSelectedFrameId(null)
    controller.fitToScreen(next.frames, 650)
    setShowStyles(false)
  }

  async function addImages(files?: FileList | null) {
    if (!files?.length) return
    try {
      const images = await prepareImages(Array.from(files))
      if (currentFrame?.parentId) {
        const frame = currentFrame
        const added = await Promise.all(
          images.map(async (image, index): Promise<ImageElement> => {
            const preview = new Image()
            preview.src = image.src
            await preview.decode()
            const scale = Math.min(
              1,
              500 / preview.naturalWidth,
              230 / preview.naturalHeight,
            )
            const width = Math.max(1, Math.round(preview.naturalWidth * scale))
            const height = Math.max(
              1,
              Math.round(preview.naturalHeight * scale),
            )
            return {
              id: `page-image-${crypto.randomUUID()}`,
              type: 'image',
              frameId: frame.id,
              src: image.src,
              alt: image.alt,
              x: frame.x + Math.round((frame.width - width) / 2) + index * 20,
              y: frame.y + 335 + index * 16,
              width,
              height,
              rotation: 0,
            }
          }),
        )
        const next = {
          ...presentation,
          elements: [...presentation.elements, ...added],
        }
        if (JSON.stringify(next).length > 3_500_000)
          throw new Error('Stockage local plein : utilisez moins d’images.')
        replace(next)
        setSelectedElementId(added.at(-1)?.id ?? null)
        setSelectedFrameId(null)
        setMessage(
          `${added.length} image${added.length > 1 ? 's' : ''} ajoutée${added.length > 1 ? 's' : ''} à cette page`,
        )
        window.setTimeout(() => setMessage(''), 4000)
        return
      }
      const visualStyle =
        presentation.style && presentation.style !== 'story'
          ? presentation.style
          : null
      const story = !visualStyle
      let next: Presentation
      if (story) {
        if (gallery.length + images.length > 24)
          throw new Error('Limite de 24 médias par présentation.')
        next = appendMediaToStory(presentation, images)
      } else {
        const hasCustomImage = gallery.some(
          (item) =>
            item.kind === 'image' && !item.alt.startsWith('Paysage illustré'),
        )
        const existing = hasCustomImage
          ? gallery
          : gallery.filter((item) => item.kind === 'video')
        const nextGallery = [...existing, ...images]
        if (nextGallery.length > 24)
          throw new Error('Limite de 24 médias par présentation.')
        next = buildVisualPresentation(
          visualStyle,
          nextGallery,
          presentation.title,
          hasCustomImage ? presentation : undefined,
          presentation.frameShape ?? 'rectangle',
        )
      }
      if (JSON.stringify(next).length > 3_500_000)
        throw new Error('Stockage local plein : utilisez moins d’images.')
      replace(next)
      setActiveNestedId(null)
      if (story) {
        setActiveFrame(presentation.path.length)
        controller.focusOn(next.frames[presentation.frames.length], 650)
      } else {
        setActiveFrame(0)
        controller.fitToScreen(next.frames, 650)
      }
      setMessage(
        `${images.length} image${images.length > 1 ? 's' : ''} ajoutée${images.length > 1 ? 's' : ''}`,
      )
      setShowStyles(false)
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Impossible de lire ces images.',
      )
    }
    window.setTimeout(() => setMessage(''), 4000)
  }

  function addVideo(videoId: string, caption: string) {
    if (currentFrame?.parentId) {
      const frame = currentFrame
      replace({
        ...presentation,
        elements: [
          ...presentation.elements,
          {
            id: `page-video-${crypto.randomUUID()}`,
            type: 'video',
            frameId: frame.id,
            videoId,
            title: caption,
            x: frame.x + 240,
            y: frame.y + 315,
            width: 480,
            height: 270,
            rotation: 0,
          },
        ],
      })
      setShowVideoDialog(false)
      setMessage('Vidéo ajoutée à cette page')
      window.setTimeout(() => setMessage(''), 4000)
      return
    }
    if (gallery.length + 1 > 24) {
      setMessage('Limite de 24 médias par présentation.')
      window.setTimeout(() => setMessage(''), 4000)
      return
    }
    const video = {
      id: `youtube-${Date.now()}`,
      kind: 'video' as const,
      videoId,
      alt: caption,
      caption,
    }
    const next =
      presentation.style && presentation.style !== 'story'
        ? buildVisualPresentation(
            presentation.style,
            [...gallery, video],
            presentation.title,
            presentation,
          )
        : appendMediaToStory(presentation, [video])
    replace(next)
    setActiveNestedId(null)
    setActiveFrame(next.frames.length - 1)
    controller.focusOn(next.frames.at(-1)!, 650)
    setShowVideoDialog(false)
    setMessage('Vidéo ajoutée au parcours')
    window.setTimeout(() => setMessage(''), 4000)
  }

  function focus(
    index: number,
    viaOverview = cleanMode ||
      (useEditorStore.getState().presenting &&
        presentationTransition === 'overview'),
  ) {
    const frame = pathFrames[index]
    if (!frame) return
    setActiveFrame(index)
    setActiveNestedId(null)
    setNavigationHistory((history) => [...history, frame.id])
    setSelectedElementId(null)
    setSelectedFrameId(null)
    if (viaOverview)
      controller.focusViaOverview(frame, pathFrames, frame.duration)
    else controller.focusOn(frame, frame.duration)
  }

  function focusSlide(
    id: string,
    viaOverview = cleanMode ||
      (useEditorStore.getState().presenting &&
        presentationTransition === 'overview'),
  ) {
    const frame = presentation.frames.find((item) => item.id === id)
    if (!frame) return
    const root = ancestorsOf(presentation, id)[0] ?? frame
    const rootIndex = pathFrames.findIndex((item) => item.id === root.id)
    if (rootIndex >= 0) setActiveFrame(rootIndex)
    setActiveNestedId(frame.parentId ? id : null)
    setNavigationHistory((history) => [...history, id])
    setSelectedElementId(null)
    setSelectedFrameId(null)
    setNumberMenuFrameId(null)
    const destinationFrames = frame.parentId
      ? childrenOf(presentation, frame.parentId)
      : pathFrames
    if (viaOverview)
      controller.focusViaOverview(frame, destinationFrames, frame.duration)
    else controller.focusOn(frame, frame.duration)
  }

  function exploreSlide(id: string) {
    const first = childrenOf(presentation, id)[0]
    if (first) focusSlide(first.id)
  }

  function handleSlideNumberClick(id: string) {
    if (presenting || cleanMode) exploreSlide(id)
    else setNumberMenuFrameId(id)
  }

  function handleSlideNumberDoubleClick(id: string) {
    if (childrenOf(presentation, id).length) {
      setNumberMenuFrameId(null)
      exploreSlide(id)
    } else {
      openSubPresentationStyles(id)
    }
  }

  function navigateSibling(
    delta: number,
    viaOverview = cleanMode ||
      (useEditorStore.getState().presenting &&
        presentationTransition === 'overview'),
  ) {
    const next = activeSiblings[activeSiblingIndex + delta]
    if (next) focusSlide(next.id, viaOverview)
  }

  function returnToParent() {
    if (currentFrame?.parentId) focusSlide(currentFrame.parentId)
  }

  function openSubPresentationStyles(parentId: string) {
    setStyleTargetParentId(parentId)
    setNumberMenuFrameId(null)
    setShowPageStyles(true)
  }

  function requestAddChild(parentId: string) {
    if (childrenOf(presentation, parentId).length) addChild(parentId)
    else openSubPresentationStyles(parentId)
  }

  function addChild(
    id: string,
    style?: NonNullable<NonNullable<typeof currentFrame>['pageStyle']>,
  ) {
    const next = addNestedSlide(presentation, id, style)
    replace(next)
    const child = next.frames.at(-1)
    if (child) {
      const root =
        ancestorsOf(presentation, id)[0] ??
        presentation.frames.find((frame) => frame.id === id)
      const index = pathFrames.findIndex((frame) => frame.id === root?.id)
      if (index >= 0) setActiveFrame(index)
      setActiveNestedId(child.id)
      setSelectedElementId(null)
      setSelectedFrameId(null)
      setNavigationHistory((history) => [...history, id, child.id])
      controller.focusOn(child)
    }
  }

  function choosePageStyle(
    style: NonNullable<NonNullable<typeof currentFrame>['pageStyle']>,
  ) {
    if (!styleTargetParent) return
    const children = childrenOf(presentation, styleTargetParent.id)
    if (children.length === 0) {
      addChild(styleTargetParent.id, style)
    } else {
      const childIds = new Set(children.map((child) => child.id))
      replace({
        ...presentation,
        frames: presentation.frames.map((frame) =>
          frame.id === styleTargetParent.id
            ? { ...frame, subPresentationStyle: style }
            : childIds.has(frame.id)
              ? { ...frame, pageStyle: style }
              : frame,
        ),
      })
    }
    setShowPageStyles(false)
    setStyleTargetParentId(null)
  }

  function updateCurrentFrame(
    changes: Partial<NonNullable<typeof currentFrame>>,
  ) {
    if (!currentFrame) return
    replace({
      ...presentation,
      frames: presentation.frames.map((frame) =>
        frame.id === currentFrame.id ? { ...frame, ...changes } : frame,
      ),
    })
  }

  async function startPresentation(
    transition: 'overview' | 'direct' = presentationTransition,
  ) {
    if (!pathFrames.length) return
    const startingNestedId = activeNestedId
    setPresentationTransition(transition)
    setShowPresentationOptions(false)
    setNumberMenuFrameId(null)
    setPresenting(true)
    setShowMenu(false)
    try {
      await rootRef.current?.requestFullscreen?.()
    } catch {
      /* Browser may deny fullscreen. */
    }
    requestAnimationFrame(() => {
      if (startingNestedId) focusSlide(startingNestedId, false)
      else focus(0, false)
    })
  }

  function stopPresentation() {
    setPresenting(false)
    if (document.fullscreenElement)
      void document.exitFullscreen().catch(() => undefined)
  }

  useEffect(() => {
    return new KeyboardShortcutManager((event) => {
      const key = event.key.toLowerCase()
      const mod = event.ctrlKey || event.metaKey
      if (event.key === 'Escape') {
        if (numberMenuFrameId) {
          setNumberMenuFrameId(null)
          return
        }
        if (useEditorStore.getState().presenting) stopPresentation()
        else if (
          showHelp ||
          showStyles ||
          showPageStyles ||
          showVideoDialog ||
          showPresentationOptions ||
          showTextEditor ||
          showMenu
        ) {
          setShowHelp(false)
          setShowStyles(false)
          setShowPageStyles(false)
          setShowVideoDialog(false)
          setShowPresentationOptions(false)
          setShowTextEditor(false)
          setShowMenu(false)
        } else {
          setSelectedElementId(null)
          setSelectedFrameId(null)
          setCleanMode(false)
        }
        return
      }
      if (isTypingTarget(event.target)) return
      if (
        showHelp ||
        showStyles ||
        showPageStyles ||
        showVideoDialog ||
        showPresentationOptions ||
        showMenu
      )
        return
      if (useEditorStore.getState().presenting || cleanMode) {
        if (
          (event.key === 'Enter' || event.key === ' ') &&
          event.target instanceof HTMLElement &&
          event.target.closest('button')
        )
          return
        if (['ArrowRight', 'ArrowDown', ' ', 'Enter'].includes(event.key)) {
          event.preventDefault()
          navigateSibling(1)
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
          event.preventDefault()
          navigateSibling(-1)
        } else if (event.key === 'Home') {
          event.preventDefault()
          focus(0)
        } else if (event.key === 'End') {
          event.preventDefault()
          focus(pathFrames.length - 1)
        }
      } else {
        if (mod && key === 's') {
          event.preventDefault()
          if (event.shiftKey) exportJSON()
          else usePresentationStore.getState().flush()
          return
        }
        if (mod && key === 'z') {
          event.preventDefault()
          if (event.shiftKey) usePresentationStore.getState().redo()
          else usePresentationStore.getState().undo()
          return
        }
        if (mod && key === 'y') {
          event.preventDefault()
          usePresentationStore.getState().redo()
          return
        }
        if (mod && key === 'd' && selectedElementId) {
          event.preventDefault()
          const element = presentation.elements.find(
            (item) => item.id === selectedElementId,
          )
          if (element) {
            const copy = {
              ...element,
              id: `${element.type}-${crypto.randomUUID()}`,
              x: element.x + 24,
              y: element.y + 24,
            }
            replace({
              ...presentation,
              elements: [...presentation.elements, copy],
            })
            setSelectedElementId(copy.id)
            setSelectedFrameId(null)
          }
          return
        }
        if (
          (event.key === 'Delete' || event.key === 'Backspace') &&
          (selectedElementId || selectedFrameId)
        ) {
          event.preventDefault()
          deleteSelectedItem()
          return
        }
        if (event.key.startsWith('Arrow') && selectedElementId) {
          event.preventDefault()
          const id = selectedElementId
          const amount = event.shiftKey ? 10 : 1
          replace({
            ...presentation,
            elements: presentation.elements.map((item) =>
              item.id === id
                ? {
                    ...item,
                    x:
                      item.x +
                      (event.key === 'ArrowRight'
                        ? amount
                        : event.key === 'ArrowLeft'
                          ? -amount
                          : 0),
                    y:
                      item.y +
                      (event.key === 'ArrowDown'
                        ? amount
                        : event.key === 'ArrowUp'
                          ? -amount
                          : 0),
                  }
                : item,
            ),
          })
          return
        }
        if (mod || event.altKey) return
        if (key === 'p') setShowPresentationOptions(true)
        else if (key === '0') controller.fitToScreen(visiblePresentation.frames)
        else if (event.key === '+' || event.key === '=')
          controller.zoomTo(useEditorStore.getState().camera.zoom * 1.25)
        else if (event.key === '-')
          controller.zoomTo(useEditorStore.getState().camera.zoom / 1.25)
      }
    }).attach()
  })

  function exportJSON() {
    const blob = new Blob([JSON.stringify(presentation, null, 2)], {
      type: 'application/json',
    })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${presentation.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'presentation'}.json`
    link.click()
    URL.revokeObjectURL(link.href)
    setShowMenu(false)
  }

  async function exportPDF() {
    if (pdfBusy) return
    setPdfBusy(true)
    setShowMenu(false)
    setMessage('Création du PDF…')
    try {
      const { blob, missingImages } = await createPresentationPdf(
        presentation,
        theme,
        (completed, total) =>
          setMessage(`Création du PDF… ${completed}/${total}`),
      )
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${
        presentation.title
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-') || 'presentation'
      }.pdf`
      document.body.append(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
      setMessage(
        missingImages
          ? `PDF téléchargé. ${missingImages} image${missingImages > 1 ? 's' : ''} indisponible${missingImages > 1 ? 's' : ''}.`
          : 'PDF téléchargé',
      )
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `Impossible de créer le PDF : ${error.message}`
          : 'Impossible de créer le PDF.',
      )
    } finally {
      setPdfBusy(false)
      window.setTimeout(() => setMessage(''), 6000)
    }
  }

  async function importJSON(file?: File) {
    if (!file) return
    try {
      const imported = parsePresentation(await file.text())
      replace(imported)
      setActiveFrame(0)
      setActiveNestedId(null)
      controller.fitToScreen(imported.frames, 0)
      setMessage('Présentation importée')
    } catch {
      setMessage('Fichier JSON invalide')
    }
    setShowMenu(false)
    window.setTimeout(() => setMessage(''), 3000)
  }

  async function importFile(file?: File) {
    if (!file || importBusy) return
    setImportBusy(true)
    setShowMenu(false)
    setMessage('Préparation du document…')
    try {
      const imported = await importDocument(file, (page, total) =>
        setMessage(`Import : page ${page} sur ${total}…`),
      )
      replace(imported)
      setActiveFrame(0)
      setActiveNestedId(null)
      setSelectedElementId(null)
      setSelectedFrameId(null)
      controller.focusOn(imported.frames[0], 0)
      setMessage(`${imported.frames.length} slides créées depuis ${file.name}`)
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Impossible d’importer ce document.',
      )
    } finally {
      setImportBusy(false)
      window.setTimeout(() => setMessage(''), 6000)
    }
  }

  function renderTree(parentId?: string) {
    return childrenOf(presentation, parentId).map((frame) => (
      <div key={frame.id} className="structure-node">
        <div
          className={`structure-row ${currentFrame?.id === frame.id ? 'active' : ''}`}
          draggable
          onDragStart={(event) => {
            event.stopPropagation()
            setDraggedSlideId(frame.id)
            event.dataTransfer.setData('text/plain', frame.id)
          }}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault()
            event.stopPropagation()
            const id =
              draggedSlideId || event.dataTransfer.getData('text/plain')
            if (id && id !== frame.id) {
              const bounds = event.currentTarget.getBoundingClientRect()
              const ratio = (event.clientY - bounds.top) / bounds.height
              const siblings = childrenOf(presentation, frame.parentId)
              const next =
                siblings[siblings.findIndex((item) => item.id === frame.id) + 1]
              replace(
                ratio < 0.3
                  ? moveSlide(presentation, id, frame.parentId, frame.id)
                  : ratio > 0.7
                    ? moveSlide(presentation, id, frame.parentId, next?.id)
                    : moveSlide(presentation, id, frame.id),
              )
            }
            setDraggedSlideId(null)
          }}
        >
          <button
            type="button"
            className="structure-title"
            onClick={() => focusSlide(frame.id)}
          >
            <span>{numbers.get(frame.id)}</span>{' '}
            {frame.name.split('·').at(-1)?.trim()}
          </button>
          <button
            type="button"
            title="Ajouter une slide imbriquée"
            aria-label={`Ajouter une sous-slide à ${frame.name}`}
            onClick={() => requestAddChild(frame.id)}
          >
            +
          </button>
          <button
            type="button"
            title="Dupliquer"
            aria-label={`Dupliquer ${frame.name}`}
            onClick={() => replace(duplicateSlide(presentation, frame.id))}
          >
            ⧉
          </button>
          <button
            type="button"
            title="Supprimer"
            aria-label={`Supprimer ${frame.name} et ses sous-slides`}
            onClick={() => {
              if (
                window.confirm(`Supprimer ${frame.name} et ses sous-slides ?`)
              ) {
                replace(deleteSlide(presentation, frame.id))
                focus(0)
              }
            }}
          >
            ×
          </button>
        </div>
        {childrenOf(presentation, frame.id).length > 0 && (
          <div className="structure-children">{renderTree(frame.id)}</div>
        )}
      </div>
    ))
  }

  return (
    <div
      className={`app ${presenting ? 'is-presenting' : cleanMode ? 'is-clean' : ''} ${activeNestedId ? 'is-nested-page' : ''}`}
      data-theme={theme}
      ref={rootRef}
      onTouchStart={(event) => {
        if (presenting && event.touches.length === 1)
          touchStart.current = {
            x: event.touches[0].clientX,
            y: event.touches[0].clientY,
          }
      }}
      onTouchEnd={(event) => {
        if (!presenting || !touchStart.current) return
        const dx = event.changedTouches[0].clientX - touchStart.current.x
        touchStart.current = null
        if (Math.abs(dx) > 65) navigateSibling(dx < 0 ? 1 : -1)
      }}
    >
      {!presenting && !cleanMode && (
        <>
          <header className="topbar">
            <button
              className="brand brand-button"
              type="button"
              onClick={() => {
                setShowMenu(false)
                setShowTextEditor(false)
                setSelectedElementId(null)
                setSelectedFrameId(null)
                setCleanMode(true)
              }}
              aria-label="Masquer les panneaux et agrandir le canvas"
              title="Masquer les panneaux"
            >
              <span className="brand-mark">
                <span />
              </span>
              <span>
                kzoom<span className="brand-dot">.</span>
              </span>
            </button>
            <div className="topbar-divider" />
            <div className="document-name">
              <input
                aria-label="Titre de la présentation"
                value={presentation.title}
                onChange={(event) => rename(event.target.value)}
              />
              <ChevronDown size={14} />
            </div>
            <span className={`save-state ${saveStatus}`}>
              <Check size={13} />{' '}
              {saveStatus === 'saving'
                ? 'Saving…'
                : saveStatus === 'error'
                  ? 'Save failed'
                  : 'Saved locally'}
            </span>
            <div className="topbar-spacer" />
            <button
              type="button"
              className="button topbar-delete-button"
              onClick={deleteSelectedItem}
              disabled={!selectedElement && !selectedFrame}
              aria-label={
                selectedElement
                  ? `Supprimer l’élément sélectionné (${selectedElement.type})`
                  : selectedFrame
                    ? `Supprimer la slide sélectionnée (${selectedFrame.name})`
                    : 'Sélectionnez une slide ou un élément à supprimer'
              }
              title={
                selectedElement
                  ? 'Supprimer l’élément sélectionné'
                  : selectedFrame
                    ? 'Supprimer la slide sélectionnée'
                    : 'Cliquez sur une slide ou un élément du canvas'
              }
            >
              <Trash2 size={16} /> <span>Supprimer</span>
            </button>
            <button
              className="button button-light styles-top-button"
              onClick={() =>
                subPresentationParent
                  ? openSubPresentationStyles(subPresentationParent.id)
                  : setShowStyles(true)
              }
            >
              <LayoutTemplate size={16} />{' '}
              {activeNestedId ? 'Style de présentation' : 'Styles'}
            </button>
            <button
              className="button button-light images-top-button"
              onClick={() => imageRef.current?.click()}
            >
              <Images size={16} /> Images+
            </button>
            <button
              className="button button-light text-top-button"
              onClick={() => setShowTextEditor(true)}
            >
              <Type size={16} /> Texte
            </button>
            <button
              className="button button-light video-top-button"
              aria-label="Ajouter une vidéo YouTube"
              title="Ajouter une vidéo YouTube"
              onClick={() => setShowVideoDialog(true)}
            >
              <Video size={17} /> <span>Vidéos+</span>
            </button>
            <ThemeSwitcher />
            <button
              className="icon-button help-button"
              aria-label="Aide"
              onClick={() => setShowHelp(true)}
            >
              <CircleHelp size={18} />
            </button>
            <div className="menu-wrap">
              <button
                className="button button-light file-top-button"
                onClick={() => setShowMenu(!showMenu)}
                aria-expanded={showMenu}
              >
                File <ChevronDown size={14} />
              </button>
              {showMenu && (
                <div className="dropdown">
                  <button onClick={() => void exportPDF()} disabled={pdfBusy}>
                    <FileDown size={16} /> Télécharger PDF
                  </button>
                  <button onClick={exportJSON}>
                    <Download size={16} /> Export JSON
                  </button>
                  <button onClick={() => fileRef.current?.click()}>
                    <Upload size={16} /> Import JSON
                  </button>
                  <button
                    onClick={() => documentRef.current?.click()}
                    disabled={importBusy}
                  >
                    <Upload size={16} />{' '}
                    {importBusy
                      ? 'Import en cours…'
                      : 'Importer PDF / PowerPoint'}
                  </button>
                </div>
              )}
            </div>
            <button
              className="button button-primary present-top-button"
              onClick={() => setShowPresentationOptions(true)}
            >
              <Play size={15} fill="currentColor" /> Present
            </button>
          </header>
          <aside className="sidebar">
            <div className="sidebar-section-label">WORKSPACE</div>
            <div className="sidebar-item selected">
              <LayoutTemplate size={18} /> Canvas{' '}
              <span className="sidebar-indicator" />
            </div>
            <button
              className="sidebar-item sidebar-action"
              onClick={() =>
                subPresentationParent
                  ? openSubPresentationStyles(subPresentationParent.id)
                  : setShowStyles(true)
              }
            >
              <LayoutTemplate size={18} />{' '}
              {activeNestedId ? 'Style de présentation' : 'Styles'}{' '}
              <ArrowRight size={14} />
            </button>
            <button
              className="sidebar-item sidebar-action"
              onClick={() => imageRef.current?.click()}
            >
              <Images size={18} /> Images+ <ArrowRight size={14} />
            </button>
            <button
              className="sidebar-item sidebar-action"
              onClick={() => setShowVideoDialog(true)}
            >
              <Video size={18} /> Vidéos+ <ArrowRight size={14} />
            </button>
            <button
              className="sidebar-item sidebar-action"
              onClick={() => setShowTextEditor(true)}
            >
              <Type size={18} /> Texte <ArrowRight size={14} />
            </button>
            <div className="sidebar-separator" />
            <div className="sidebar-section-label">
              {activeNestedId ? 'PAGES DE LA SECTION' : 'YOUR STORY'}{' '}
              <span>{workspaceFrames.length}</span>
            </div>
            <div className="sidebar-frames">
              {workspaceFrames.map((frame, index) => (
                <button
                  key={frame.id}
                  className={`sidebar-frame ${currentFrame?.id === frame.id ? 'active' : ''}`}
                  onClick={() => focusSlide(frame.id)}
                >
                  <span className="frame-number">
                    {activeNestedId
                      ? numbers.get(frame.id)
                      : String(index + 1).padStart(2, '0')}
                  </span>
                  <span>{frame.name.split('·').at(-1)?.trim()}</span>
                  <span
                    className="frame-dot"
                    style={{ background: frame.accent }}
                  />
                </button>
              ))}
            </div>
            <button
              type="button"
              className="sidebar-item sidebar-action"
              onClick={() => setShowStructure(!showStructure)}
            >
              Structure {showStructure ? '▴' : '▾'}
            </button>
            {showStructure && (
              <div
                className="structure-panel"
                aria-label="Structure des slides"
              >
                {renderTree()}
                <div
                  className="structure-root-drop"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault()
                    const id =
                      draggedSlideId || event.dataTransfer.getData('text/plain')
                    if (id) replace(moveSlide(presentation, id))
                    setDraggedSlideId(null)
                  }}
                >
                  Déposer ici pour le parcours principal
                </div>
                {currentFrame?.parentId && (
                  <button
                    type="button"
                    onClick={() =>
                      replace(moveSlide(presentation, currentFrame.id))
                    }
                  >
                    Afficher dans le parcours principal
                  </button>
                )}
                {currentFrame && (
                  <div className="structure-number-settings">
                    <label>
                      <input
                        type="checkbox"
                        checked={currentFrame.numberVisible !== false}
                        onChange={(event) =>
                          updateCurrentFrame({
                            numberVisible: event.target.checked,
                          })
                        }
                      />{' '}
                      Numéro visible
                    </label>
                    <label>
                      Position{' '}
                      <select
                        value={currentFrame.numberPosition ?? 'bottom-right'}
                        onChange={(event) =>
                          updateCurrentFrame({
                            numberPosition: event.target.value as NonNullable<
                              typeof currentFrame
                            >['numberPosition'],
                          })
                        }
                      >
                        <option value="bottom-right">Bas droite</option>
                        <option value="bottom-left">Bas gauche</option>
                        <option value="top-right">Haut droite</option>
                        <option value="top-left">Haut gauche</option>
                      </select>
                    </label>
                    <label>
                      Taille{' '}
                      <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={currentFrame.numberScale ?? 1}
                        onChange={(event) =>
                          updateCurrentFrame({
                            numberScale: Number(event.target.value),
                          })
                        }
                      />
                    </label>
                    <label>
                      Couleur{' '}
                      <input
                        type="color"
                        value={currentFrame.numberColor ?? currentFrame.accent}
                        onChange={(event) =>
                          updateCurrentFrame({
                            numberColor: event.target.value,
                          })
                        }
                      />
                    </label>
                  </div>
                )}
              </div>
            )}
            <div className="sidebar-bottom">
              <div className="sidebar-tip">
                <Sparkles size={16} />
                <span>
                  Every idea has a place.
                  <br />
                  <strong>Explore the canvas.</strong>
                </span>
              </div>
              <span className="sidebar-version">KZOOM / EARLY ACCESS</span>
            </div>
          </aside>
          {!activeNestedId && (
            <div className="canvas-top-label">
              <span className="live-dot" /> INFINITE CANVAS{' '}
              <span className="breadcrumb">
                / &nbsp;
                {breadcrumbFrames.length
                  ? breadcrumbFrames.map((frame, index) => (
                      <button
                        type="button"
                        key={frame.id}
                        onClick={() => focusSlide(frame.id)}
                      >
                        {index ? '› ' : ''}
                        {numbers.get(frame.id) ?? frame.name}
                      </button>
                    ))
                  : 'Overview'}
              </span>
            </div>
          )}
        </>
      )}
      <main className="canvas-area">
        {!presenting && activeNestedId && currentFrame && (
          <div className="nested-page-toolbar">
            <button
              type="button"
              className="nested-page-back"
              onClick={returnToParent}
              aria-label="Revenir à la page parente"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="nested-page-heading">
              <span>
                SOUS-PRÉSENTATION /{' '}
                {numbers.get(subPresentationParent?.id ?? '')}
              </span>
              <strong>
                {subPresentationParent?.name.split('·').at(-1)?.trim()}
              </strong>
            </div>
            <button
              type="button"
              className="nested-page-style-button nested-page-add-button"
              onClick={() =>
                subPresentationParent && addChild(subPresentationParent.id)
              }
            >
              + Ajouter une slide
            </button>
            <button
              type="button"
              className="nested-page-style-button"
              onClick={() =>
                subPresentationParent &&
                openSubPresentationStyles(subPresentationParent.id)
              }
            >
              <LayoutTemplate size={16} /> Style de présentation
            </button>
          </div>
        )}
        <InfiniteCanvas
          presentation={visiblePresentation}
          hierarchyPresentation={presentation}
          nestedPage={!!activeNestedId}
          nestedPageStyle={
            subPresentationParent?.subPresentationStyle ??
            currentFrame?.pageStyle
          }
          controller={controller}
          viewportRef={viewportRef}
          selectedTextId={showTextEditor && !cleanMode ? selectedTextId : null}
          selectedImageId={!cleanMode ? selectedImageId : null}
          selectedElementId={!cleanMode ? selectedElementId : null}
          selectedFrameId={!cleanMode ? selectedFrameId : null}
          onSelectText={!cleanMode ? selectText : undefined}
          onUpdateText={!cleanMode ? updateTextById : undefined}
          onDeleteText={!cleanMode ? deleteTextById : undefined}
          onSelectImage={!cleanMode ? selectImage : undefined}
          onUpdateImage={!cleanMode ? updateImageById : undefined}
          onSelectElement={!cleanMode ? selectCanvasElement : undefined}
          onSelectFrame={
            !cleanMode
              ? (frame) => {
                  setSelectedFrameId(frame.id)
                  setSelectedElementId(null)
                  setShowTextEditor(false)
                }
              : undefined
          }
          onClearSelection={
            !cleanMode
              ? () => {
                  setSelectedElementId(null)
                  setSelectedFrameId(null)
                }
              : undefined
          }
          onExploreSlide={handleSlideNumberClick}
          onDoubleClickSlideNumber={handleSlideNumberDoubleClick}
        />
      </main>
      {!presenting && numberMenuFrame && (
        <div
          className="slide-number-menu"
          role="dialog"
          aria-label={`Sous-slides de ${numberMenuFrame.name}`}
        >
          <div className="slide-number-menu-heading">
            <span>
              <strong>{numbers.get(numberMenuFrame.id)}</strong>{' '}
              {numberMenuFrame.name.split('·').at(-1)?.trim()}
            </span>
            <button
              type="button"
              aria-label="Fermer"
              onClick={() => setNumberMenuFrameId(null)}
            >
              ×
            </button>
          </div>
          {childrenOf(presentation, numberMenuFrame.id).length === 0 && (
            <p>Créer une sous-présentation pour cette slide ?</p>
          )}
          <button
            type="button"
            onClick={() => {
              requestAddChild(numberMenuFrame.id)
              setNumberMenuFrameId(null)
            }}
          >
            {childrenOf(presentation, numberMenuFrame.id).length
              ? '+ Ajouter une sous-slide'
              : '+ Créer une sous-présentation'}
          </button>
          {childrenOf(presentation, numberMenuFrame.id).map((child) => (
            <button
              key={child.id}
              type="button"
              onClick={() => focusSlide(child.id)}
            >
              {numbers.get(child.id)} · {child.name.split('·').at(-1)?.trim()}
            </button>
          ))}
        </div>
      )}
      {!presenting && cleanMode && (
        <button
          className="brand brand-button clean-toggle"
          type="button"
          onClick={() => setCleanMode(false)}
          aria-label="Réafficher les panneaux"
          title="Réafficher les panneaux"
        >
          <span className="brand-mark">
            <span />
          </span>
          <span>
            kzoom<span className="brand-dot">.</span>
          </span>
        </button>
      )}
      {!presenting && !cleanMode && (
        <footer className="timeline">
          <div className="timeline-heading">
            <div>
              <span className="timeline-icon">
                <Clapperboard size={17} />
              </span>
              <strong>
                {activeNestedId ? 'Pages de la section' : 'Presentation path'}
              </strong>
              <span className="timeline-sub">
                {activeNestedId
                  ? 'Un espace pour chaque idée'
                  : 'Your story, one space'}
              </span>
            </div>
            <span className="timeline-count">
              {workspaceFrames.length} {activeNestedId ? 'PAGES' : 'FRAMES'}
            </span>
          </div>
          <div className="timeline-items">
            {workspaceFrames.map((frame, index) => (
              <button
                key={frame.id}
                onClick={() => focusSlide(frame.id)}
                className={`timeline-item ${currentFrame?.id === frame.id ? 'active' : ''}`}
              >
                <span className="timeline-index">{numbers.get(frame.id)}</span>
                <span
                  className={`timeline-preview ${activeNestedId ? `page-style-${frame.pageStyle ?? 'paper'}` : ''}`}
                  style={
                    { '--preview-accent': frame.accent } as React.CSSProperties
                  }
                >
                  {!activeNestedId && gallery[index]?.kind === 'image' ? (
                    <img src={gallery[index].src} alt="" />
                  ) : !activeNestedId && gallery[index]?.kind === 'video' ? (
                    <span className="timeline-video-preview">
                      <Play size={20} fill="currentColor" /> VIDÉO
                    </span>
                  ) : (
                    <span>
                      {activeNestedId
                        ? frame.name.split('·').at(-1)?.trim()
                        : index === 0
                          ? 'Ideas deserve more space.'
                          : 'Think beyond the slide.'}
                    </span>
                  )}
                </span>
                <span className="timeline-name">
                  {frame.name.split('·').at(-1)?.trim()}
                </span>
              </button>
            ))}
          </div>
          <div className="timeline-end">
            <span>Click a frame to fly there</span>
            <ArrowRight size={16} />
          </div>
        </footer>
      )}
      {!presenting && !cleanMode && showTextEditor && (
        <TextEditor
          frame={currentFrame}
          visualStyle={!!presentation.style && presentation.style !== 'story'}
          texts={frameTexts}
          selected={selectedText}
          onSelect={(id) => {
            setSelectedElementId(id)
            setSelectedFrameId(null)
          }}
          onTitleChange={updateFrameTitle}
          onChange={updateText}
          onAdd={() => addText()}
          onAddTitle={() => addText('heading')}
          onDelete={() => {
            if (selectedTextId) deleteTextById(selectedTextId)
          }}
          onClose={() => setShowTextEditor(false)}
        />
      )}
      {!presenting && !cleanMode && selectedImage && (
        <ImageEditor
          image={selectedImage}
          onChange={(changes) => updateImageById(selectedImage.id, changes)}
          onReplace={() => replaceImageRef.current?.click()}
          onClose={() => setSelectedElementId(null)}
        />
      )}
      {(presenting || cleanMode) && (
        <div
          className={`presentation-controls ${cleanMode ? 'clean-navigation-controls' : ''}`}
        >
          <button
            aria-label={
              presenting ? 'Quitter la présentation' : 'Quitter le mode kzoom'
            }
            onClick={presenting ? stopPresentation : () => setCleanMode(false)}
          >
            <X size={18} />
          </button>
          <div
            className="presentation-breadcrumb"
            aria-label="Parcours de présentation"
          >
            {breadcrumbFrames.map((frame) => (
              <button
                type="button"
                key={frame.id}
                onClick={() => focusSlide(frame.id)}
              >
                {numbers.get(frame.id)}
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={navigationHistory.length < 2}
            aria-label="Revenir à la slide visitée précédemment"
            onClick={() => {
              const previous = navigationHistory.at(-2)
              if (previous) {
                setNavigationHistory((history) => history.slice(0, -2))
                focusSlide(previous)
              }
            }}
          >
            ↶
          </button>
          <button
            type="button"
            aria-label="Afficher l’ensemble des slides"
            title="Vue d’ensemble"
            onClick={() => controller.fitToScreen(visiblePresentation.frames)}
          >
            <Scan size={18} />
          </button>
          {currentFrame && currentFrame.numberVisible !== false && (
            <SlideNumber
              number={numbers.get(currentFrame.id) ?? ''}
              title={currentFrame.name}
              childCount={childrenOf(presentation, currentFrame.id).length}
              onExplore={
                childrenOf(presentation, currentFrame.id).length
                  ? () => exploreSlide(currentFrame.id)
                  : undefined
              }
            />
          )}
          {currentFrame?.parentId && (
            <button
              type="button"
              onClick={returnToParent}
              aria-label="Revenir à la slide parente"
            >
              ↥
            </button>
          )}
          <button
            aria-label="Étape précédente"
            disabled={activeSiblingIndex <= 0}
            onClick={() => navigateSibling(-1)}
          >
            <ArrowLeft size={18} />
          </button>
          <button
            aria-label="Étape suivante"
            disabled={activeSiblingIndex >= activeSiblings.length - 1}
            onClick={() => navigateSibling(1)}
          >
            <ArrowRight size={18} />
          </button>
        </div>
      )}
      {showHelp && (
        <div className="modal-backdrop" onClick={() => setShowHelp(false)}>
          <div
            className="help-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close"
              aria-label="Fermer"
              onClick={() => setShowHelp(false)}
            >
              <X size={18} />
            </button>
            <div className="help-icon">
              <Maximize2 size={22} />
            </div>
            <h2>Move through your ideas.</h2>
            <p>
              Drag the canvas to explore, scroll to zoom around your cursor, and
              select a frame to focus.
            </p>
            <div className="shortcuts">
              <div>
                <span>Present</span>
                <kbd>P</kbd>
              </div>
              <div>
                <span>Overview</span>
                <kbd>0</kbd>
              </div>
              <div>
                <span>Zoom</span>
                <kbd>+</kbd> <kbd>−</kbd>
              </div>
              <div>
                <span>Next / Previous</span>
                <kbd>→</kbd> <kbd>←</kbd>
              </div>
              <div>
                <span>Exit presentation</span>
                <kbd>Esc</kbd>
              </div>
            </div>
          </div>
        </div>
      )}
      {showPresentationOptions && !presenting && (
        <div
          className="modal-backdrop"
          onClick={() => setShowPresentationOptions(false)}
        >
          <div
            className="presentation-options-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="presentation-options-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="modal-close"
              aria-label="Fermer"
              onClick={() => setShowPresentationOptions(false)}
            >
              <X size={18} />
            </button>
            <span className="presentation-options-eyebrow">
              MODE DE PRÉSENTATION
            </span>
            <h2 id="presentation-options-title">
              Choisissez votre transition.
            </h2>
            <p>Ce choix s’appliquera à toutes les slides et sous-slides.</p>
            <div className="presentation-option-grid">
              <button
                type="button"
                className={
                  presentationTransition === 'overview' ? 'active' : ''
                }
                onClick={() => void startPresentation('overview')}
              >
                <span className="presentation-option-visual overview-visual">
                  <i />
                  <i />
                  <i />
                  <Scan size={25} />
                </span>
                <strong>Avec vue d’ensemble</strong>
                <small>
                  Recul rapide sur tout le parcours avant chaque slide.
                </small>
              </button>
              <button
                type="button"
                className={presentationTransition === 'direct' ? 'active' : ''}
                onClick={() => void startPresentation('direct')}
              >
                <span className="presentation-option-visual direct-visual">
                  <i />
                  <ArrowRight size={28} />
                  <i />
                </span>
                <strong>Transition directe</strong>
                <small>
                  Passe directement à la slide suivante, sans recul.
                </small>
              </button>
            </div>
          </div>
        </div>
      )}
      {showStyles && !presenting && (
        <StylePicker
          selected={presentation.style ?? 'story'}
          selectedShape={presentation.frameShape ?? 'rectangle'}
          onSelect={chooseStyle}
          onUpload={() => imageRef.current?.click()}
          onClose={() => setShowStyles(false)}
        />
      )}
      {showPageStyles && !presenting && styleTargetParent && (
        <PageStylePicker
          selected={styleTargetParent.subPresentationStyle ?? 'paper'}
          creating={childrenOf(presentation, styleTargetParent.id).length === 0}
          onSelect={choosePageStyle}
          onClose={() => {
            setShowPageStyles(false)
            setStyleTargetParentId(null)
          }}
        />
      )}
      {showVideoDialog && !presenting && (
        <VideoDialog
          onAdd={addVideo}
          onClose={() => setShowVideoDialog(false)}
        />
      )}
      {message && (
        <div className="toast" role="status">
          {message}
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(event) => {
          void importJSON(event.target.files?.[0])
          event.target.value = ''
        }}
      />
      <input
        ref={documentRef}
        type="file"
        accept=".pdf,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation"
        hidden
        onChange={(event) => {
          void importFile(event.target.files?.[0])
          event.target.value = ''
        }}
      />
      <input
        ref={imageRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        onChange={(event) => {
          void addImages(event.target.files)
          event.target.value = ''
        }}
      />
      <input
        ref={replaceImageRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(event) => {
          void replaceSelectedImage(event.target.files?.[0])
          event.target.value = ''
        }}
      />
    </div>
  )
}
