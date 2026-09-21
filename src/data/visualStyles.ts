import type {
  CanvasElement,
  Frame,
  ImageElement,
  Presentation,
  PresentationStyle,
} from '../types/presentation'

export interface GalleryImage {
  id: string
  src: string
  alt: string
  caption: string
}

export const visualStyles: {
  id: Exclude<PresentationStyle, 'story'>
  name: string
  description: string
}[] = [
  {
    id: 'timeline',
    name: 'Flèche du temps',
    description: 'Un voyage horizontal, image après image.',
  },
  {
    id: 'orbit',
    name: 'Cercle',
    description: 'Une histoire qui tourne autour d’une idée.',
  },
  {
    id: 'grid',
    name: 'Mosaïque',
    description: 'Quatre colonnes et autant de lignes que nécessaire.',
  },
  {
    id: 'spiral',
    name: 'Spirale',
    description: 'Une exploration qui s’ouvre progressivement.',
  },
  {
    id: 'zigzag',
    name: 'Zigzag',
    description: 'Un parcours vertical dynamique.',
  },
]

const palette = [
  ['#163c59', '#53b8c2', '#e9b873'],
  ['#47406b', '#b78cc7', '#f8c4a1'],
  ['#2b5c54', '#8ebda2', '#f1d49c'],
  ['#773d48', '#da8f76', '#f1cb8a'],
  ['#224968', '#7bb2d8', '#d8ecdd'],
  ['#6d526d', '#caa5b9', '#f6dabc'],
  ['#315b48', '#92bc72', '#f2d596'],
  ['#614e74', '#a992c9', '#e5b2a7'],
]

const titles = [
  'L’étincelle',
  'Le départ',
  'Le mouvement',
  'Les rencontres',
  'Un nouveau regard',
  'L’élan',
  'L’horizon',
  'La suite',
]

function artwork(index: number): string {
  const [dark, mid, light] = palette[index % palette.length]
  const sunX = 470 - (index % 4) * 74
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520"><defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="${dark}"/><stop offset="1" stop-color="${mid}"/></linearGradient><linearGradient id="land" x2="0" y2="1"><stop stop-color="${mid}"/><stop offset="1" stop-color="${dark}"/></linearGradient></defs><rect width="800" height="520" fill="url(#sky)"/><circle cx="${sunX}" cy="155" r="72" fill="${light}" opacity=".95"/><path d="M0 340 Q180 ${170 + index * 12} 390 340 T800 300 V520 H0Z" fill="${light}" opacity=".55"/><path d="M0 400 Q220 ${260 + index * 7} 420 390 T800 365 V520 H0Z" fill="url(#land)"/><path d="M0 467 Q240 350 470 458 T800 400 V520 H0Z" fill="${dark}" opacity=".76"/><circle cx="118" cy="88" r="3" fill="#fff" opacity=".8"/><circle cx="676" cy="67" r="2" fill="#fff" opacity=".7"/></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export const demoGallery: GalleryImage[] = titles.map((caption, index) => ({
  id: `demo-${index + 1}`,
  src: artwork(index),
  alt: `Paysage illustré ${index + 1}`,
  caption,
}))

export function galleryFromPresentation(
  presentation: Presentation,
): GalleryImage[] {
  const images = presentation.elements.filter(
    (element): element is ImageElement => element.type === 'image',
  )
  return presentation.path.flatMap((frameId) => {
    const image = images.find((item) => item.id === `${frameId}-image`)
    if (!image) return []
    const caption = presentation.elements.find(
      (element) =>
        element.id === `${frameId}-caption` && element.type === 'text',
    )
    return [
      {
        id: frameId,
        src: image.src,
        alt: image.alt,
        caption: caption?.type === 'text' ? caption.text : image.alt,
      },
    ]
  })
}

function position(
  style: Exclude<PresentationStyle, 'story'>,
  index: number,
  count: number,
) {
  switch (style) {
    case 'timeline':
      return {
        x: (index - (count - 1) / 2) * 560,
        y: index % 2 ? 60 : -60,
        rotation: index % 2 ? 2 : -2,
      }
    case 'orbit': {
      const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count
      const radius = Math.max(600, count * 100)
      return {
        x: Math.cos(angle) * radius - 220,
        y: Math.sin(angle) * radius - 170,
        rotation: 0,
      }
    }
    case 'grid': {
      const row = Math.floor(index / 4)
      const column = row % 2 ? 3 - (index % 4) : index % 4
      return { x: (column - 1.5) * 510, y: row * 420 - 220, rotation: 0 }
    }
    case 'spiral': {
      const angle = index * 1.22 - Math.PI / 2
      const radius = 160 + index * 165
      return {
        x: Math.cos(angle) * radius - 220,
        y: Math.sin(angle) * radius - 170,
        rotation: index % 2 ? 3 : -3,
      }
    }
    case 'zigzag':
      return {
        x: index % 2 ? 275 : -715,
        y: (index - (count - 1) / 2) * 405,
        rotation: index % 2 ? 2 : -2,
      }
  }
}

export function buildVisualPresentation(
  style: Exclude<PresentationStyle, 'story'>,
  gallery: GalleryImage[],
  title = 'Mon histoire visuelle',
): Presentation {
  const frames: Frame[] = []
  const elements: CanvasElement[] = []
  gallery.forEach((image, index) => {
    const place = position(style, index, gallery.length)
    const id = `visual-${index + 1}`
    frames.push({
      id,
      name: `${String(index + 1).padStart(2, '0')} · ${image.caption}`,
      x: place.x,
      y: place.y,
      width: 440,
      height: 340,
      rotation: place.rotation,
      cameraZoom: 1,
      duration: 850,
      accent: palette[index % palette.length][1],
    })
    elements.push({
      id: `${id}-image`,
      type: 'image',
      src: image.src,
      alt: image.alt,
      x: place.x + 22,
      y: place.y + 22,
      width: 396,
      height: 235,
      rotation: place.rotation,
    })
    elements.push({
      id: `${id}-caption`,
      type: 'text',
      variant: 'body',
      text: image.caption,
      color: '#243e43',
      x: place.x + 25,
      y: place.y + 275,
      width: 390,
      height: 52,
      rotation: place.rotation,
    })
  })
  return {
    version: 1,
    title,
    elements,
    frames,
    path: frames.map((frame) => frame.id),
    style,
  }
}
