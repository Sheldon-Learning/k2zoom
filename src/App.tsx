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
  Sparkles,
  Type,
  Upload,
  Video,
  X,
} from 'lucide-react'
import { InfiniteCanvas } from './components/canvas/InfiniteCanvas'
import { StylePicker } from './components/ui/StylePicker'
import { TextEditor } from './components/ui/TextEditor'
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
import { useEditorStore } from './store/editorStore'
import { usePresentationStore } from './store/presentationStore'
import { parsePresentation } from './utils/storage'
import { prepareImages } from './utils/images'
import { createPresentationPdf } from './utils/pdfExport'
import type {
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
  const imageRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState('')
  const [showHelp, setShowHelp] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showStyles, setShowStyles] = useState(false)
  const [showVideoDialog, setShowVideoDialog] = useState(false)
  const [cleanMode, setCleanMode] = useState(false)
  const [showTextEditor, setShowTextEditor] = useState(false)
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null)
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null)
  const [pdfBusy, setPdfBusy] = useState(false)

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
  const currentFrame = pathFrames[activeFrame]
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
    setSelectedTextId(null)
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
      color: title ? '#ffffff' : '#5e7281',
      customColor: title,
      fontFamily: title ? 'Impact' : 'DM Sans',
      fontSize: title ? 100 : 21,
      effect: title ? 'video' : 'plain',
      x: currentFrame.x + (title ? 25 : 32),
      y: title
        ? currentFrame.y + 80
        : currentFrame.y + currentFrame.height + 34,
      width: title
        ? currentFrame.width - 50
        : Math.min(currentFrame.width - 64, 480),
      height: title ? 230 : 90,
      rotation: 0,
    }
    replace({ ...presentation, elements: [...presentation.elements, element] })
    setSelectedTextId(element.id)
    setShowTextEditor(true)
  }

  function selectText(element: TextElement) {
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
    setSelectedTextId(element.id)
    setSelectedImageId(null)
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
    setSelectedImageId(image.id)
    setSelectedTextId(null)
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
      setSelectedImageId(added.at(-1)?.id ?? null)
      setSelectedTextId(null)
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
    setSelectedImageId(copy.id)
    setSelectedTextId(null)
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
      const image = usePresentationStore
        .getState()
        .presentation.elements.find(
          (element): element is ImageElement =>
            element.id === selectedImageId && element.type === 'image',
        )
      if (!image || !event.clipboardData) return
      event.clipboardData.setData(
        'application/x-zoomet-image',
        JSON.stringify(image),
      )
      event.preventDefault()
      setMessage('Image copiée : utilisez Ctrl+V pour la coller')
      window.setTimeout(() => setMessage(''), 4500)
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
        const copied = event.clipboardData?.getData(
          'application/x-zoomet-image',
        )
        if (!copied) return
        try {
          const image = JSON.parse(copied) as ImageElement
          if (image.type !== 'image' || typeof image.src !== 'string') return
          event.preventDefault()
          pasteCopiedImage(image)
        } catch {
          setMessage('Impossible de coller cette image.')
        }
        return
      }
      event.preventDefault()
      void pasteImages(files)
    }
    window.addEventListener('copy', handleCopy)
    window.addEventListener('paste', handlePaste)
    return () => {
      window.removeEventListener('copy', handleCopy)
      window.removeEventListener('paste', handlePaste)
    }
  })

  function chooseStyle(style: PresentationStyle) {
    if (
      style === 'story' &&
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
        ? { ...demoPresentation, title: presentation.title }
        : buildVisualPresentation(
            style,
            gallery.length ? gallery : demoGallery,
            presentation.title,
            presentation,
          )
    replace(next)
    setActiveFrame(0)
    controller.fitToScreen(next.frames, 650)
    setShowStyles(false)
  }

  async function addImages(files?: FileList | null) {
    if (!files?.length) return
    try {
      const images = await prepareImages(Array.from(files))
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
        )
      }
      if (JSON.stringify(next).length > 3_500_000)
        throw new Error('Stockage local plein : utilisez moins d’images.')
      replace(next)
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
    setActiveFrame(next.frames.length - 1)
    controller.focusOn(next.frames.at(-1)!, 650)
    setShowVideoDialog(false)
    setMessage('Vidéo ajoutée au parcours')
    window.setTimeout(() => setMessage(''), 4000)
  }

  function focus(index: number) {
    const frame = pathFrames[index]
    if (!frame) return
    setActiveFrame(index)
    setSelectedTextId(null)
    setSelectedImageId(null)
    controller.focusOn(frame, frame.duration)
  }

  async function startPresentation() {
    if (!pathFrames.length) return
    setPresenting(true)
    setShowMenu(false)
    try {
      await rootRef.current?.requestFullscreen?.()
    } catch {
      /* Browser may deny fullscreen. */
    }
    requestAnimationFrame(() => focus(0))
  }

  function stopPresentation() {
    setPresenting(false)
    if (document.fullscreenElement)
      void document.exitFullscreen().catch(() => undefined)
  }

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        stopPresentation()
        setShowHelp(false)
        setCleanMode(false)
        return
      }
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement ||
        (event.target instanceof HTMLElement && event.target.isContentEditable)
      )
        return
      if (
        !useEditorStore.getState().presenting &&
        !cleanMode &&
        showTextEditor &&
        selectedTextId &&
        (event.key === 'Delete' || event.key === 'Backspace')
      ) {
        event.preventDefault()
        deleteTextById(selectedTextId)
        return
      }
      if (useEditorStore.getState().presenting) {
        if (
          event.key === 'ArrowRight' ||
          event.key === ' ' ||
          event.key === 'ArrowDown'
        ) {
          event.preventDefault()
          const next = Math.min(
            useEditorStore.getState().activeFrame + 1,
            pathFrames.length - 1,
          )
          focus(next)
        }
        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
          event.preventDefault()
          focus(Math.max(0, useEditorStore.getState().activeFrame - 1))
        }
      } else {
        if (
          event.key.toLowerCase() === 'p' &&
          !event.metaKey &&
          !event.ctrlKey
        ) {
          void startPresentation()
        }
        if (event.key === '0') controller.fitToScreen(presentation.frames)
        if (event.key === '+' || event.key === '=')
          controller.zoomTo(useEditorStore.getState().camera.zoom * 1.25)
        if (event.key === '-')
          controller.zoomTo(useEditorStore.getState().camera.zoom / 1.25)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
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
      controller.fitToScreen(imported.frames, 0)
      setMessage('Présentation importée')
    } catch {
      setMessage('Fichier JSON invalide')
    }
    setShowMenu(false)
    window.setTimeout(() => setMessage(''), 3000)
  }

  return (
    <div
      className={`app ${presenting ? 'is-presenting' : cleanMode ? 'is-clean' : ''}`}
      data-theme={theme}
      ref={rootRef}
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
                setCleanMode(true)
              }}
              aria-label="Masquer les panneaux et agrandir le canvas"
              title="Masquer les panneaux"
            >
              <span className="brand-mark">
                <span />
              </span>
              <span>
                zoomet<span className="brand-dot">.</span>
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
              className="button button-light styles-top-button"
              onClick={() => setShowStyles(true)}
            >
              <LayoutTemplate size={16} /> Styles
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
                </div>
              )}
            </div>
            <button
              className="button button-primary present-top-button"
              onClick={() => void startPresentation()}
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
              onClick={() => setShowStyles(true)}
            >
              <LayoutTemplate size={18} /> Styles <ArrowRight size={14} />
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
              YOUR STORY <span>{pathFrames.length}</span>
            </div>
            <div className="sidebar-frames">
              {pathFrames.map((frame, index) => (
                <button
                  key={frame.id}
                  className={`sidebar-frame ${activeFrame === index ? 'active' : ''}`}
                  onClick={() => focus(index)}
                >
                  <span className="frame-number">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span>{frame.name.split('·').at(-1)?.trim()}</span>
                  <span
                    className="frame-dot"
                    style={{ background: frame.accent }}
                  />
                </button>
              ))}
            </div>
            <div className="sidebar-bottom">
              <div className="sidebar-tip">
                <Sparkles size={16} />
                <span>
                  Every idea has a place.
                  <br />
                  <strong>Explore the canvas.</strong>
                </span>
              </div>
              <span className="sidebar-version">ZOOMET / EARLY ACCESS</span>
            </div>
          </aside>
          <div className="canvas-top-label">
            <span className="live-dot" /> INFINITE CANVAS{' '}
            <span className="breadcrumb">/ &nbsp;Overview</span>
          </div>
        </>
      )}
      <main className="canvas-area">
        <InfiniteCanvas
          presentation={presentation}
          controller={controller}
          viewportRef={viewportRef}
          selectedTextId={showTextEditor && !cleanMode ? selectedTextId : null}
          selectedImageId={!cleanMode ? selectedImageId : null}
          onSelectText={!cleanMode ? selectText : undefined}
          onUpdateText={!cleanMode ? updateTextById : undefined}
          onDeleteText={!cleanMode ? deleteTextById : undefined}
          onSelectImage={!cleanMode ? selectImage : undefined}
          onUpdateImage={!cleanMode ? updateImageById : undefined}
        />
      </main>
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
            zoomet<span className="brand-dot">.</span>
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
              <strong>Presentation path</strong>
              <span className="timeline-sub">Your story, one space</span>
            </div>
            <span className="timeline-count">{pathFrames.length} FRAMES</span>
          </div>
          <div className="timeline-items">
            {pathFrames.map((frame, index) => (
              <button
                key={frame.id}
                onClick={() => focus(index)}
                className={`timeline-item ${activeFrame === index ? 'active' : ''}`}
              >
                <span className="timeline-index">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span
                  className="timeline-preview"
                  style={
                    { '--preview-accent': frame.accent } as React.CSSProperties
                  }
                >
                  {gallery[index]?.kind === 'image' ? (
                    <img src={gallery[index].src} alt="" />
                  ) : gallery[index]?.kind === 'video' ? (
                    <span className="timeline-video-preview">
                      <Play size={20} fill="currentColor" /> VIDÉO
                    </span>
                  ) : (
                    <span>
                      {index === 0
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
          onSelect={setSelectedTextId}
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
      {presenting && (
        <div className="presentation-controls">
          <button
            aria-label="Quitter la présentation"
            onClick={stopPresentation}
          >
            <X size={18} />
          </button>
          <span>
            {activeFrame + 1} <span>/</span> {pathFrames.length}
          </span>
          <button
            aria-label="Étape précédente"
            disabled={activeFrame === 0}
            onClick={() => focus(activeFrame - 1)}
          >
            <ArrowLeft size={18} />
          </button>
          <button
            aria-label="Étape suivante"
            disabled={activeFrame === pathFrames.length - 1}
            onClick={() => focus(activeFrame + 1)}
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
      {showStyles && !presenting && (
        <StylePicker
          selected={presentation.style ?? 'story'}
          onSelect={chooseStyle}
          onUpload={() => imageRef.current?.click()}
          onClose={() => setShowStyles(false)}
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
    </div>
  )
}
