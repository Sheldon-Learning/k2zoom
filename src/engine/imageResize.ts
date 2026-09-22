import type { Camera, ImageElement } from '../types/presentation'

const MIN_SIZE = 48
const MAX_SIZE = 4096

export function resizeImageByFactor(
  image: Pick<ImageElement, 'x' | 'y' | 'width' | 'height' | 'rotation'>,
  factor: number,
) {
  const limit = Math.min(MAX_SIZE / image.width, MAX_SIZE / image.height)
  const scale = Math.min(
    limit,
    Math.max(MIN_SIZE / Math.min(image.width, image.height), factor),
  )
  const width = Math.round(image.width * scale)
  const height = Math.round(image.height * scale)
  const angle = (image.rotation * Math.PI) / 180
  const cosine = Math.cos(angle)
  const sine = Math.sin(angle)
  const deltaWidth = width - image.width
  const deltaHeight = height - image.height
  return {
    x: Math.round(
      image.x - ((1 - cosine) * deltaWidth + sine * deltaHeight) / 2,
    ),
    y: Math.round(
      image.y - ((1 - cosine) * deltaHeight - sine * deltaWidth) / 2,
    ),
    width,
    height,
  }
}

export function imageSizeAfterDrag(
  image: Pick<ImageElement, 'x' | 'y' | 'width' | 'height' | 'rotation'>,
  screenDelta: { x: number; y: number },
  camera: Pick<Camera, 'zoom' | 'rotation'>,
) {
  const angle = ((camera.rotation + image.rotation) * Math.PI) / 180
  const cosine = Math.cos(angle)
  const sine = Math.sin(angle)
  const localX = (screenDelta.x * cosine + screenDelta.y * sine) / camera.zoom
  const localY = (-screenDelta.x * sine + screenDelta.y * cosine) / camera.zoom
  const widthFactor = localX / image.width
  const heightFactor = localY / image.height
  const dominant =
    Math.abs(widthFactor) >= Math.abs(heightFactor) ? widthFactor : heightFactor
  return resizeImageByFactor(image, 1 + dominant)
}
