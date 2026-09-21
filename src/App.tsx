import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  CircleHelp,
  Clapperboard,
  Download,
  LayoutTemplate,
  Maximize2,
  Images,
  Play,
  Sparkles,
  Upload,
  X,
} from 'lucide-react'
import { InfiniteCanvas } from './components/canvas/InfiniteCanvas'
import { StylePicker } from './components/ui/StylePicker'
import { ThemeSwitcher } from './components/ui/ThemeSwitcher'
import { demoPresentation } from './data/demo'
import {
  buildVisualPresentation,
  demoGallery,
  galleryFromPresentation,
} from './data/visualStyles'
import { CameraController } from './engine/CameraController'
import { useEditorStore } from './store/editorStore'
import { usePresentationStore } from './store/presentationStore'
import { parsePresentation } from './utils/storage'
import { prepareImages } from './utils/images'
import type { PresentationStyle } from './types/presentation'

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

  function chooseStyle(style: PresentationStyle) {
    if (
      style === 'story' &&
      gallery.some((image) => !image.alt.startsWith('Paysage illustré')) &&
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
      const existing =
        gallery.length &&
        !gallery.every((item) => item.alt.startsWith('Paysage illustré'))
          ? gallery
          : []
      const nextGallery = [...existing, ...images]
      if (nextGallery.length > 24)
        throw new Error('Limite de 24 images par présentation.')
      const style =
        presentation.style && presentation.style !== 'story'
          ? presentation.style
          : 'timeline'
      const next = buildVisualPresentation(
        style,
        nextGallery,
        presentation.title,
      )
      if (JSON.stringify(next).length > 3_500_000)
        throw new Error('Stockage local plein : utilisez moins d’images.')
      replace(next)
      setActiveFrame(0)
      controller.fitToScreen(next.frames, 650)
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

  function focus(index: number) {
    const frame = pathFrames[index]
    if (!frame) return
    setActiveFrame(index)
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
        return
      }
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      )
        return
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
      className={`app ${presenting ? 'is-presenting' : ''}`}
      data-theme={theme}
      ref={rootRef}
    >
      {!presenting && (
        <>
          <header className="topbar">
            <div className="brand">
              <span className="brand-mark">
                <span />
              </span>
              <span>
                zoomet<span className="brand-dot">.</span>
              </span>
            </div>
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
              <Images size={16} /> Images
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
                className="button button-light"
                onClick={() => setShowMenu(!showMenu)}
                aria-expanded={showMenu}
              >
                File <ChevronDown size={14} />
              </button>
              {showMenu && (
                <div className="dropdown">
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
              className="button button-primary"
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
              <LayoutTemplate size={18} /> Styles de parcours{' '}
              <ArrowRight size={14} />
            </button>
            <button
              className="sidebar-item sidebar-action"
              onClick={() => imageRef.current?.click()}
            >
              <Images size={18} /> Ajouter des images <ArrowRight size={14} />
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
        />
      </main>
      {!presenting && (
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
                  {gallery[index] ? (
                    <img src={gallery[index].src} alt="" />
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
