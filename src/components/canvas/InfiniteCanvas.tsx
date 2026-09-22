import { useEffect, useRef, useState } from 'react'
import type { PointerEvent, WheelEvent } from 'react'
import { Hand, Minus, Play, Plus, RotateCw, Scan, Trash2 } from 'lucide-react'
import type { CameraController } from '../../engine/CameraController'
import {
  textPositionAfterDrag,
  textRotationAfterDrag,
} from '../../engine/textGeometry'
import type {
  Camera,
  ImageElement,
  Presentation,
  TextElement,
} from '../../types/presentation'
import { useEditorStore } from '../../store/editorStore'
import { RouteOverlay } from './RouteOverlay'
import { SlideNumber } from '../ui/SlideNumber'
import { childrenOf, slideNumbers } from '../../engine/slideHierarchy'
import { youtubeEmbedUrl } from '../../utils/youtube'

interface Props {
  presentation: Presentation
  controller: CameraController
  viewportRef: React.RefObject<HTMLDivElement | null>
  selectedTextId?: string | null
  selectedImageId?: string | null
  onSelectText?: (element: TextElement) => void
  onUpdateText?: (id: string, changes: Partial<TextElement>) => void
  onDeleteText?: (id: string) => void
  onSelectImage?: (element: ImageElement) => void
  onUpdateImage?: (id: string, changes: Partial<ImageElement>) => void
  onExploreSlide?: (id: string) => void
}

export function InfiniteCanvas({
  presentation,
  controller,
  viewportRef,
  selectedTextId,
  selectedImageId,
  onSelectText,
  onUpdateText,
  onDeleteText,
  onSelectImage,
  onUpdateImage,
  onExploreSlide,
}: Props) {
  const numbers = slideNumbers(presentation)
  const camera = useEditorStore((state) => state.camera)
  const presenting = useEditorStore((state) => state.presenting)
  const activeFrame = useEditorStore((state) => state.activeFrame)
  const drag = useRef<{ x: number; y: number } | null>(null)
  const imageFocus = useRef<{ imageId: string; previousCamera: Camera } | null>(
    null,
  )
  const imageClickTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const textDrag = useRef<{
    id: string
    pointerId: number
    clientX: number
    clientY: number
    x: number
    y: number
    camera: Camera
    moved: boolean
  } | null>(null)
  const stopTrackingTextDrag = useRef<(() => void) | null>(null)
  const textRotation = useRef<{
    id: string
    pointerId: number
    centerX: number
    centerY: number
    startAngle: number
    startRotation: number
  } | null>(null)
  const stopTrackingRotation = useRef<(() => void) | null>(null)
  const suppressTextClick = useRef<string | null>(null)
  const imageDrag = useRef<{
    id: string
    pointerId: number
    clientX: number
    clientY: number
    x: number
    y: number
    camera: Camera
    moved: boolean
  } | null>(null)
  const stopTrackingImageDrag = useRef<(() => void) | null>(null)
  const imageRotation = useRef<{
    id: string
    pointerId: number
    centerX: number
    centerY: number
    startAngle: number
    startRotation: number
  } | null>(null)
  const stopTrackingImageRotation = useRef<(() => void) | null>(null)
  const suppressImageClick = useRef<string | null>(null)
  const [grabbing, setGrabbing] = useState(false)
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null)

  useEffect(
    () => () => {
      if (imageClickTimer.current) clearTimeout(imageClickTimer.current)
      stopTrackingTextDrag.current?.()
      stopTrackingRotation.current?.()
      stopTrackingImageDrag.current?.()
      stopTrackingImageRotation.current?.()
      controller.stop()
    },
    [controller],
  )

  useEffect(() => {
    if (imageClickTimer.current) clearTimeout(imageClickTimer.current)
    imageClickTimer.current = null
    imageFocus.current = null
    setPlayingVideoId(null)
  }, [activeFrame, presenting, presentation.frames])

  function focusImage(image: ImageElement) {
    if (imageFocus.current?.imageId === image.id) {
      restoreImageView()
      return
    }
    imageFocus.current = {
      imageId: image.id,
      previousCamera:
        imageFocus.current?.previousCamera ?? useEditorStore.getState().camera,
    }
    controller.focusOnMedia(image)
  }

  function restoreImageView() {
    if (imageClickTimer.current) clearTimeout(imageClickTimer.current)
    imageClickTimer.current = null
    if (!imageFocus.current) return
    controller.returnTo(imageFocus.current.previousCamera)
    imageFocus.current = null
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || presenting) return
    drag.current = { x: event.clientX, y: event.clientY }
    event.currentTarget.setPointerCapture(event.pointerId)
    setGrabbing(true)
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current) return
    controller.panBy({
      x: event.clientX - drag.current.x,
      y: event.clientY - drag.current.y,
    })
    drag.current = { x: event.clientX, y: event.clientY }
  }

  function endDrag() {
    drag.current = null
    setGrabbing(false)
  }

  function onWheel(event: WheelEvent<HTMLDivElement>) {
    if (presenting) return
    event.preventDefault()
    if (
      event.shiftKey ||
      (Math.abs(event.deltaX) > Math.abs(event.deltaY) && !event.ctrlKey)
    ) {
      controller.panBy({
        x: -event.deltaX || -event.deltaY,
        y: -event.deltaY * (event.shiftKey ? 0 : 1),
      })
      return
    }
    const rect = event.currentTarget.getBoundingClientRect()
    const factor = Math.exp(-event.deltaY * (event.ctrlKey ? 0.01 : 0.0015))
    controller.zoomTo(camera.zoom * factor, {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    })
  }

  function startTextDrag(
    event: PointerEvent<HTMLDivElement>,
    text: TextElement,
  ) {
    event.stopPropagation()
    if (event.button !== 0 || !onUpdateText) return
    event.preventDefault()
    onSelectText?.(text)
    event.currentTarget.setPointerCapture(event.pointerId)
    textDrag.current = {
      id: text.id,
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      x: text.x,
      y: text.y,
      camera: useEditorStore.getState().camera,
      moved: false,
    }
    stopTrackingTextDrag.current?.()
    const onMove = (moveEvent: globalThis.PointerEvent) => {
      const gesture = textDrag.current
      if (!gesture || gesture.pointerId !== moveEvent.pointerId) return
      const delta = {
        x: moveEvent.clientX - gesture.clientX,
        y: moveEvent.clientY - gesture.clientY,
      }
      if (Math.hypot(delta.x, delta.y) < 2 && !gesture.moved) return
      gesture.moved = true
      onUpdateText(
        gesture.id,
        textPositionAfterDrag(
          { x: gesture.x, y: gesture.y },
          delta,
          gesture.camera,
        ),
      )
    }
    const onEnd = (endEvent: globalThis.PointerEvent) => {
      const gesture = textDrag.current
      if (!gesture || gesture.pointerId !== endEvent.pointerId) return
      if (gesture.moved) suppressTextClick.current = gesture.id
      textDrag.current = null
      stopTrackingTextDrag.current?.()
      stopTrackingTextDrag.current = null
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onEnd)
    window.addEventListener('pointercancel', onEnd)
    stopTrackingTextDrag.current = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onEnd)
      window.removeEventListener('pointercancel', onEnd)
    }
  }

  function startTextRotation(
    event: PointerEvent<HTMLButtonElement>,
    text: TextElement,
  ) {
    event.stopPropagation()
    event.preventDefault()
    if (event.button !== 0 || !onUpdateText) return
    const bounds = event.currentTarget.parentElement?.getBoundingClientRect()
    if (!bounds) return
    const centerX = bounds.left + bounds.width / 2
    const centerY = bounds.top + bounds.height / 2
    textRotation.current = {
      id: text.id,
      pointerId: event.pointerId,
      centerX,
      centerY,
      startAngle: Math.atan2(event.clientY - centerY, event.clientX - centerX),
      startRotation: text.rotation,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    stopTrackingRotation.current?.()
    const onMove = (moveEvent: globalThis.PointerEvent) => {
      const gesture = textRotation.current
      if (!gesture || gesture.pointerId !== moveEvent.pointerId) return
      const angle = Math.atan2(
        moveEvent.clientY - gesture.centerY,
        moveEvent.clientX - gesture.centerX,
      )
      onUpdateText(gesture.id, {
        rotation: textRotationAfterDrag(
          gesture.startRotation,
          gesture.startAngle,
          angle,
        ),
      })
    }
    const onEnd = (endEvent: globalThis.PointerEvent) => {
      if (textRotation.current?.pointerId !== endEvent.pointerId) return
      textRotation.current = null
      stopTrackingRotation.current?.()
      stopTrackingRotation.current = null
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onEnd)
    window.addEventListener('pointercancel', onEnd)
    stopTrackingRotation.current = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onEnd)
      window.removeEventListener('pointercancel', onEnd)
    }
  }

  function startImageDrag(
    event: PointerEvent<HTMLDivElement>,
    image: ImageElement,
  ) {
    event.stopPropagation()
    if (event.button !== 0 || !onUpdateImage) return
    event.preventDefault()
    onSelectImage?.(image)
    if (imageClickTimer.current) clearTimeout(imageClickTimer.current)
    imageClickTimer.current = null
    event.currentTarget.setPointerCapture(event.pointerId)
    imageDrag.current = {
      id: image.id,
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      x: image.x,
      y: image.y,
      camera: useEditorStore.getState().camera,
      moved: false,
    }
    stopTrackingImageDrag.current?.()
    const onMove = (moveEvent: globalThis.PointerEvent) => {
      const gesture = imageDrag.current
      if (!gesture || gesture.pointerId !== moveEvent.pointerId) return
      const delta = {
        x: moveEvent.clientX - gesture.clientX,
        y: moveEvent.clientY - gesture.clientY,
      }
      if (Math.hypot(delta.x, delta.y) < 3 && !gesture.moved) return
      gesture.moved = true
      onUpdateImage(
        gesture.id,
        textPositionAfterDrag(
          { x: gesture.x, y: gesture.y },
          delta,
          gesture.camera,
        ),
      )
    }
    const onEnd = (endEvent: globalThis.PointerEvent) => {
      const gesture = imageDrag.current
      if (!gesture || gesture.pointerId !== endEvent.pointerId) return
      if (gesture.moved) suppressImageClick.current = gesture.id
      imageDrag.current = null
      stopTrackingImageDrag.current?.()
      stopTrackingImageDrag.current = null
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onEnd)
    window.addEventListener('pointercancel', onEnd)
    stopTrackingImageDrag.current = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onEnd)
      window.removeEventListener('pointercancel', onEnd)
    }
  }

  function startImageRotation(
    event: PointerEvent<HTMLButtonElement>,
    image: ImageElement,
  ) {
    event.stopPropagation()
    event.preventDefault()
    if (event.button !== 0 || !onUpdateImage) return
    const bounds = event.currentTarget.parentElement?.getBoundingClientRect()
    if (!bounds) return
    const centerX = bounds.left + bounds.width / 2
    const centerY = bounds.top + bounds.height / 2
    imageRotation.current = {
      id: image.id,
      pointerId: event.pointerId,
      centerX,
      centerY,
      startAngle: Math.atan2(event.clientY - centerY, event.clientX - centerX),
      startRotation: image.rotation,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    stopTrackingImageRotation.current?.()
    const onMove = (moveEvent: globalThis.PointerEvent) => {
      const gesture = imageRotation.current
      if (!gesture || gesture.pointerId !== moveEvent.pointerId) return
      const angle = Math.atan2(
        moveEvent.clientY - gesture.centerY,
        moveEvent.clientX - gesture.centerX,
      )
      onUpdateImage(gesture.id, {
        rotation: textRotationAfterDrag(
          gesture.startRotation,
          gesture.startAngle,
          angle,
        ),
      })
    }
    const onEnd = (endEvent: globalThis.PointerEvent) => {
      if (imageRotation.current?.pointerId !== endEvent.pointerId) return
      imageRotation.current = null
      stopTrackingImageRotation.current?.()
      stopTrackingImageRotation.current = null
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onEnd)
    window.addEventListener('pointercancel', onEnd)
    stopTrackingImageRotation.current = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onEnd)
      window.removeEventListener('pointercancel', onEnd)
    }
  }

  return (
    <div
      className={`canvas-viewport style-${presentation.style ?? 'story'} ${grabbing ? 'is-grabbing' : ''}`}
      ref={viewportRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onWheel={onWheel}
      aria-label="Canvas spatial. Glissez pour déplacer, utilisez la molette pour zoomer."
    >
      <div className="canvas-grid" />
      <div
        className="canvas-world"
        style={{
          transform: `translate3d(50%, 50%, 0) rotate(${camera.rotation}deg) scale(${camera.zoom}) translate3d(${-camera.x}px, ${-camera.y}px, 0)`,
        }}
      >
        {presentation.style && presentation.style !== 'story' ? (
          <RouteOverlay
            frames={presentation.frames}
            style={presentation.style}
          />
        ) : (
          <div className="world-connector" />
        )}
        {presentation.frames.map((frame, index) => (
          <div
            className="canvas-frame"
            key={frame.id}
            style={
              {
                left: frame.x,
                top: frame.y,
                width: frame.width,
                height: frame.height,
                transform: `rotate(${frame.rotation}deg)`,
                '--frame-accent': frame.accent,
              } as React.CSSProperties
            }
          >
            {frame.numberVisible !== false && numbers.has(frame.id) && (
              <SlideNumber
                className={`canvas-slide-number position-${frame.numberPosition ?? 'bottom-right'}`}
                style={{
                  transform: `scale(${frame.numberScale ?? 1})`,
                  color: frame.numberColor ?? frame.accent,
                }}
                number={numbers.get(frame.id)!}
                title={frame.name}
                childCount={childrenOf(presentation, frame.id).length}
                onExplore={() => onExploreSlide?.(frame.id)}
              />
            )}
            {!presenting && (
              <div className="frame-label">
                <span>{String(index + 1).padStart(2, '0')}</span>
                {frame.name.split('·').at(-1)?.trim()}
              </div>
            )}
          </div>
        ))}
        {presentation.elements.map((element) => (
          <div
            key={element.id}
            className={`canvas-element ${element.type === 'text' ? `text-${element.variant} text-element text-effect-${element.effect ?? 'plain'} ${element.customColor ? 'text-custom-color' : ''} ${selectedTextId === element.id && !presenting ? 'text-selected' : ''}` : element.type === 'shape' ? `shape-${element.shape}` : element.type === 'image' ? `image-element ${selectedImageId === element.id && !presenting ? 'image-selected' : ''}` : 'video-element'}`}
            role={
              element.type === 'image' ||
              (element.type === 'text' && !presenting && onSelectText)
                ? 'button'
                : undefined
            }
            tabIndex={
              element.type === 'image' ||
              (element.type === 'text' && !presenting && onSelectText)
                ? 0
                : undefined
            }
            aria-label={
              element.type === 'image'
                ? `${element.alt}. Clic pour zoomer, double clic pour revenir.`
                : element.type === 'text' && !presenting && onSelectText
                  ? `Modifier le texte : ${element.text}`
                  : undefined
            }
            onPointerDown={
              element.type === 'image'
                ? (event) => startImageDrag(event, element)
                : element.type === 'video'
                  ? (event) => event.stopPropagation()
                  : element.type === 'text' && !presenting && onSelectText
                    ? (event) => startTextDrag(event, element)
                    : undefined
            }
            onClick={
              element.type === 'image'
                ? (event) => {
                    event.stopPropagation()
                    if (suppressImageClick.current === element.id) {
                      suppressImageClick.current = null
                      return
                    }
                    if (event.detail !== 1) return
                    if (imageClickTimer.current)
                      clearTimeout(imageClickTimer.current)
                    imageClickTimer.current = setTimeout(() => {
                      focusImage(element)
                      imageClickTimer.current = null
                    }, 220)
                  }
                : element.type === 'text' && !presenting && onSelectText
                  ? (event) => {
                      event.stopPropagation()
                      if (suppressTextClick.current === element.id) {
                        suppressTextClick.current = null
                        return
                      }
                      onSelectText?.(element)
                    }
                  : undefined
            }
            onDoubleClick={
              element.type === 'image'
                ? (event) => {
                    event.stopPropagation()
                    restoreImageView()
                  }
                : undefined
            }
            onKeyDown={
              element.type === 'image'
                ? (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      event.stopPropagation()
                      focusImage(element)
                    }
                    if (event.key === 'Backspace') {
                      event.preventDefault()
                      event.stopPropagation()
                      restoreImageView()
                    }
                  }
                : element.type === 'text' && !presenting && onSelectText
                  ? (event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        event.stopPropagation()
                        onSelectText(element)
                      }
                    }
                  : undefined
            }
            style={{
              left: element.x,
              top: element.y,
              width: element.width,
              height: element.height,
              transform: `rotate(${element.rotation}deg)`,
              color: element.type === 'text' ? element.color : undefined,
              fontFamily:
                element.type === 'text' && element.fontFamily
                  ? element.fontFamily === 'Impact'
                    ? 'Impact, "Arial Black", sans-serif'
                    : element.fontFamily === 'Courier New'
                      ? '"Courier New", monospace'
                      : element.fontFamily
                  : undefined,
              fontSize: element.type === 'text' ? element.fontSize : undefined,
              background: element.type === 'shape' ? element.fill : undefined,
            }}
          >
            {element.type === 'text' ? (
              <>
                <span className="text-content">{element.text}</span>
                {selectedTextId === element.id &&
                  !presenting &&
                  onUpdateText && (
                    <>
                      <button
                        type="button"
                        className="text-rotate-handle"
                        aria-label="Tourner le texte"
                        title="Glisser pour tourner"
                        onPointerDown={(event) =>
                          startTextRotation(event, element)
                        }
                        onClick={(event) => event.stopPropagation()}
                      >
                        <RotateCw size={15} />
                      </button>
                      {onDeleteText && (
                        <button
                          type="button"
                          className="text-delete-handle"
                          aria-label={`Supprimer le texte : ${element.text}`}
                          title="Supprimer ce texte"
                          onPointerDown={(event) => event.stopPropagation()}
                          onClick={(event) => {
                            event.stopPropagation()
                            onDeleteText(element.id)
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </>
                  )}
              </>
            ) : element.type === 'image' ? (
              <>
                <img src={element.src} alt={element.alt} draggable={false} />
                {selectedImageId === element.id &&
                  !presenting &&
                  onUpdateImage && (
                    <button
                      type="button"
                      className="image-rotate-handle"
                      aria-label="Tourner l’image"
                      title="Glisser pour tourner l’image"
                      onPointerDown={(event) =>
                        startImageRotation(event, element)
                      }
                      onClick={(event) => event.stopPropagation()}
                    >
                      <RotateCw size={16} />
                    </button>
                  )}
              </>
            ) : element.type === 'video' ? (
              playingVideoId === element.id ? (
                <iframe
                  title={element.title}
                  src={youtubeEmbedUrl(element.videoId)}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              ) : (
                <button
                  className="video-poster"
                  aria-label={`Lire la vidéo ${element.title}`}
                  onClick={(event) => {
                    event.stopPropagation()
                    imageFocus.current = null
                    controller.focusOnMedia(element)
                    setPlayingVideoId(element.id)
                  }}
                >
                  <span className="video-play-circle">
                    <Play size={31} fill="currentColor" />
                  </span>
                  <span className="video-poster-title">{element.title}</span>
                  <span className="video-poster-label">YOUTUBE · LIRE</span>
                </button>
              )
            ) : null}
          </div>
        ))}
      </div>
      {!presenting && (
        <div className="canvas-hint">
          <Hand size={14} /> Drag to explore <span>·</span> Scroll to zoom
        </div>
      )}
      {!presenting && (
        <div className="zoom-controls">
          <button
            aria-label="Dézoomer"
            onClick={() => controller.zoomTo(camera.zoom / 1.25)}
          >
            <Minus size={17} />
          </button>
          <span>{Math.round(camera.zoom * 100)}%</span>
          <button
            aria-label="Zoomer"
            onClick={() => controller.zoomTo(camera.zoom * 1.25)}
          >
            <Plus size={17} />
          </button>
          <i />
          <button
            aria-label="Vue globale"
            title="Vue globale (0)"
            onClick={() => controller.fitToScreen(presentation.frames)}
          >
            <Scan size={17} />
          </button>
        </div>
      )}
    </div>
  )
}
