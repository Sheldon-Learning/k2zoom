import type { GalleryImage } from '../data/visualStyles'

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

export async function prepareImages(files: File[]): Promise<GalleryImage[]> {
  const accepted = files.filter((file) =>
    ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
  )
  if (accepted.length !== files.length)
    throw new Error('Utilisez des images JPG, PNG ou WebP.')
  if (files.some((file) => file.size > MAX_UPLOAD_BYTES))
    throw new Error('Une image dépasse 10 Mo.')
  if (files.length > 24) throw new Error('Choisissez au maximum 24 images.')
  return Promise.all(
    files.map(async (file, index) => ({
      id: `upload-${Date.now()}-${index}`,
      kind: 'image' as const,
      src: await resizeImage(file),
      alt: file.name,
      caption: file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '),
    })),
  )
}

async function resizeImage(file: File): Promise<string> {
  const objectUrl = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = objectUrl
    await image.decode()
    const scale = Math.min(
      1,
      1100 / image.naturalWidth,
      750 / image.naturalHeight,
    )
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Impossible de préparer cette image.')
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.76)
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
