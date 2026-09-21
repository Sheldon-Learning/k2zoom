import type { Camera } from '../types/presentation'

export function textPositionAfterDrag(
  start: { x: number; y: number },
  screenDelta: { x: number; y: number },
  camera: Camera,
) {
  const angle = (camera.rotation * Math.PI) / 180
  const cosine = Math.cos(angle)
  const sine = Math.sin(angle)
  return {
    x: Math.round(
      start.x + (screenDelta.x * cosine + screenDelta.y * sine) / camera.zoom,
    ),
    y: Math.round(
      start.y + (-screenDelta.x * sine + screenDelta.y * cosine) / camera.zoom,
    ),
  }
}

export function textRotationAfterDrag(
  startRotation: number,
  startAngle: number,
  currentAngle: number,
) {
  const degrees = startRotation + ((currentAngle - startAngle) * 180) / Math.PI
  return Math.round(((((degrees + 180) % 360) + 360) % 360) - 180)
}
