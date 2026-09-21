import { useEffect, useRef, useState } from 'react'
import type { PointerEvent, WheelEvent } from 'react'
import { Hand, Minus, Plus, Scan } from 'lucide-react'
import type { CameraController } from '../../engine/CameraController'
import type {
  Camera,
  ImageElement,
  Presentation,
} from '../../types/presentation'
import { useEditorStore } from '../../store/editorStore'
import { RouteOverlay } from './RouteOverlay'

interface Props {
  presentation: Presentation
  controller: CameraController
  viewportRef: React.RefObject<HTMLDivElement | null>
}

export function InfiniteCanvas({
  presentation,
  controller,
  viewportRef,
}: Props) {
  const camera = useEditorStore((state) => state.camera)
  const presenting = useEditorStore((state) => state.presenting)
  const activeFrame = useEditorStore((state) => state.activeFrame)
  const drag = useRef<{ x: number; y: number } | null>(null)
  const imageFocus = useRef<{ imageId: string; previousCamera: Camera } | null>(
    null,
  )
  const imageClickTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [grabbing, setGrabbing] = useState(false)

  useEffect(
    () => () => {
      if (imageClickTimer.current) clearTimeout(imageClickTimer.current)
      controller.stop()
    },
    [controller],
  )

  useEffect(() => {
    if (imageClickTimer.current) clearTimeout(imageClickTimer.current)
    imageClickTimer.current = null
    imageFocus.current = null
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
    controller.focusOnImage(image)
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
            className={`canvas-element ${element.type === 'text' ? `text-${element.variant}` : element.type === 'shape' ? `shape-${element.shape}` : 'image-element'}`}
            role={element.type === 'image' ? 'button' : undefined}
            tabIndex={element.type === 'image' ? 0 : undefined}
            aria-label={
              element.type === 'image'
                ? `${element.alt}. Clic pour zoomer, double clic pour revenir.`
                : undefined
            }
            onPointerDown={
              element.type === 'image'
                ? (event) => event.stopPropagation()
                : undefined
            }
            onClick={
              element.type === 'image'
                ? (event) => {
                    event.stopPropagation()
                    if (event.detail !== 1) return
                    if (imageClickTimer.current)
                      clearTimeout(imageClickTimer.current)
                    imageClickTimer.current = setTimeout(() => {
                      focusImage(element)
                      imageClickTimer.current = null
                    }, 220)
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
                : undefined
            }
            style={{
              left: element.x,
              top: element.y,
              width: element.width,
              height: element.height,
              transform: `rotate(${element.rotation}deg)`,
              color: element.type === 'text' ? element.color : undefined,
              background: element.type === 'shape' ? element.fill : undefined,
            }}
          >
            {element.type === 'text' ? (
              element.text
            ) : element.type === 'image' ? (
              <img src={element.src} alt={element.alt} draggable={false} />
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
