import type {
  Camera,
  Frame,
  ImageElement,
  VideoElement,
} from '../types/presentation'

export interface Point {
  x: number
  y: number
}
export interface Size {
  width: number
  height: number
}

export const MIN_ZOOM = 0.12
export const MAX_ZOOM = 8

export function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom))
}

export function worldToScreen(
  point: Point,
  camera: Camera,
  viewport: Size,
): Point {
  const angle = (camera.rotation * Math.PI) / 180
  const dx = (point.x - camera.x) * camera.zoom
  const dy = (point.y - camera.y) * camera.zoom
  return {
    x: viewport.width / 2 + dx * Math.cos(angle) - dy * Math.sin(angle),
    y: viewport.height / 2 + dx * Math.sin(angle) + dy * Math.cos(angle),
  }
}

export function screenToWorld(
  point: Point,
  camera: Camera,
  viewport: Size,
): Point {
  const angle = (-camera.rotation * Math.PI) / 180
  const dx = (point.x - viewport.width / 2) / camera.zoom
  const dy = (point.y - viewport.height / 2) / camera.zoom
  return {
    x: camera.x + dx * Math.cos(angle) - dy * Math.sin(angle),
    y: camera.y + dx * Math.sin(angle) + dy * Math.cos(angle),
  }
}

export function panCamera(camera: Camera, delta: Point): Camera {
  const angle = (-camera.rotation * Math.PI) / 180
  return {
    ...camera,
    x:
      camera.x -
      (delta.x * Math.cos(angle) - delta.y * Math.sin(angle)) / camera.zoom,
    y:
      camera.y -
      (delta.x * Math.sin(angle) + delta.y * Math.cos(angle)) / camera.zoom,
  }
}

export function zoomAt(
  camera: Camera,
  factor: number,
  anchor: Point,
  viewport: Size,
): Camera {
  const before = screenToWorld(anchor, camera, viewport)
  const next = { ...camera, zoom: clampZoom(camera.zoom * factor) }
  const after = screenToWorld(anchor, next, viewport)
  return {
    ...next,
    x: next.x + before.x - after.x,
    y: next.y + before.y - after.y,
  }
}

export function cameraForFrame(frame: Frame, viewport: Size): Camera {
  const fit = Math.min(
    viewport.width / (frame.width + 100),
    viewport.height / (frame.height + 100),
  )
  return {
    x: frame.x + frame.width / 2,
    y: frame.y + frame.height / 2,
    zoom: clampZoom(fit * frame.cameraZoom),
    rotation: -frame.rotation,
  }
}

export function cameraForMedia(
  image: ImageElement | VideoElement,
  camera: Camera,
  viewport: Size,
): Camera {
  const fit = Math.min(
    viewport.width / (image.width + 120),
    viewport.height / (image.height + 120),
  )
  return {
    x: image.x + image.width / 2,
    y: image.y + image.height / 2,
    zoom: clampZoom(Math.max(camera.zoom * 1.25, fit * 0.92)),
    rotation: -image.rotation,
  }
}

export function fitCamera(frames: Frame[], viewport: Size): Camera {
  if (!frames.length) return { x: 0, y: 0, zoom: 1, rotation: 0 }
  const left = Math.min(...frames.map((frame) => frame.x))
  const top = Math.min(...frames.map((frame) => frame.y))
  const right = Math.max(...frames.map((frame) => frame.x + frame.width))
  const bottom = Math.max(...frames.map((frame) => frame.y + frame.height))
  return {
    x: (left + right) / 2,
    y: (top + bottom) / 2,
    zoom: clampZoom(
      Math.min(
        viewport.width / (right - left + 220),
        viewport.height / (bottom - top + 220),
      ),
    ),
    rotation: 0,
  }
}
