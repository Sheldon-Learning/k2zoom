import type { Frame, ImageElement } from '../types/presentation'

export function frameAtPoint(
  frames: Frame[],
  point: { x: number; y: number },
  frameShape: 'rectangle' | 'circle' = 'rectangle',
): Frame | undefined {
  return [...frames].reverse().find((frame) => {
    const centerX = frame.x + frame.width / 2
    const centerY = frame.y + frame.height / 2
    const angle = (-frame.rotation * Math.PI) / 180
    const dx = point.x - centerX
    const dy = point.y - centerY
    const localX = dx * Math.cos(angle) - dy * Math.sin(angle)
    const localY = dx * Math.sin(angle) + dy * Math.cos(angle)
    if (frameShape === 'circle')
      return (
        Math.pow(localX / (frame.width / 2), 2) +
          Math.pow(localY / (frame.height / 2), 2) <=
        1
      )
    return (
      Math.abs(localX) <= frame.width / 2 &&
      Math.abs(localY) <= frame.height / 2
    )
  })
}

export function fitImageToFrame(
  image: ImageElement,
  frame: Frame,
): Partial<ImageElement> {
  return {
    frameId: frame.id,
    x: frame.x,
    y: frame.y,
    width: frame.width,
    height: frame.height,
    rotation: frame.rotation,
    fit: 'cover',
    objectPositionX: image.objectPositionX ?? 50,
    objectPositionY: image.objectPositionY ?? 50,
    cropZoom: image.cropZoom ?? 1,
  }
}

export function imageCropAfterDrag(
  image: Pick<ImageElement, 'objectPositionX' | 'objectPositionY'>,
  screenDelta: { x: number; y: number },
  frame: Pick<Frame, 'width' | 'height'>,
  cameraZoom: number,
) {
  const clamp = (value: number) => Math.min(100, Math.max(0, value))
  return {
    objectPositionX: clamp(
      (image.objectPositionX ?? 50) +
        (screenDelta.x / (frame.width * cameraZoom)) * 100,
    ),
    objectPositionY: clamp(
      (image.objectPositionY ?? 50) +
        (screenDelta.y / (frame.height * cameraZoom)) * 100,
    ),
  }
}
