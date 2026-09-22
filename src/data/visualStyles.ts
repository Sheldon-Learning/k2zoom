import type {
  CanvasElement,
  Frame,
  ImageElement,
  Presentation,
  PresentationStyle,
  TextElement,
  VideoElement,
} from '../types/presentation'

export interface GalleryImage {
  id: string
  kind: 'image'
  src: string
  alt: string
  caption: string
}

export interface GalleryVideo {
  id: string
  kind: 'video'
  videoId: string
  alt: string
  caption: string
}

export type GalleryMedia = GalleryImage | GalleryVideo

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
  {
    id: 'chevrons',
    name: 'Chevrons',
    description: 'Flèches colorées et étapes alternées.',
  },
  {
    id: 'medallions',
    name: 'Médaillons',
    description: 'Repères ronds numérotés sur une ligne.',
  },
  {
    id: 'steps',
    name: 'Étapes verticales',
    description: 'Une progression guidée de haut en bas.',
  },
  {
    id: 'ribbons',
    name: 'Rubans',
    description: 'Des bandeaux successifs pour chaque idée.',
  },
  {
    id: 'milestones',
    name: 'Jalons',
    description: 'Une frise ponctuée de grands repères.',
  },
  {
    id: 'spectrum',
    name: 'Spectre',
    description: 'Une ligne fine aux couleurs évolutives.',
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
  kind: 'image',
  src: artwork(index),
  alt: `Paysage illustré ${index + 1}`,
  caption,
}))

export function galleryFromPresentation(
  presentation: Presentation,
): GalleryMedia[] {
  const images = presentation.elements.filter(
    (element): element is ImageElement => element.type === 'image',
  )
  const videos = presentation.elements.filter(
    (element): element is VideoElement => element.type === 'video',
  )
  return presentation.path.flatMap<GalleryMedia>((frameId) => {
    const image = images.find((item) => item.id === `${frameId}-image`)
    const video = videos.find((item) => item.id === `${frameId}-video`)
    if (!image && !video) return []
    const caption = presentation.elements.find(
      (element) =>
        element.id === `${frameId}-caption` && element.type === 'text',
    )
    const label =
      caption?.type === 'text'
        ? caption.text
        : (image?.alt ?? video?.title ?? 'Vidéo')
    return image
      ? [
          {
            id: frameId,
            kind: 'image' as const,
            src: image.src,
            alt: image.alt,
            caption: label,
          },
        ]
      : [
          {
            id: frameId,
            kind: 'video' as const,
            videoId: video!.videoId,
            alt: video!.title,
            caption: label,
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
    case 'chevrons':
    case 'medallions':
      return {
        x: (index - (count - 1) / 2) * 560 - 220,
        y: index % 2 ? 180 : -520,
        rotation: 0,
      }
    case 'steps':
      return {
        x: index % 2 ? 310 : -750,
        y: (index - (count - 1) / 2) * 500 - 170,
        rotation: 0,
      }
    case 'ribbons':
    case 'milestones':
    case 'spectrum':
      return {
        x: (index - (count - 1) / 2) * 560 - 220,
        y: 100,
        rotation: 0,
      }
  }
}

function mediaElements(
  id: string,
  media: GalleryMedia,
  place: { x: number; y: number; rotation: number },
): CanvasElement[] {
  const card =
    media.kind === 'image'
      ? {
          id: `${id}-image`,
          type: 'image' as const,
          src: media.src,
          alt: media.alt,
        }
      : {
          id: `${id}-video`,
          type: 'video' as const,
          videoId: media.videoId,
          title: media.alt,
        }
  return [
    {
      ...card,
      x: place.x + 22,
      y: place.y + 22,
      width: 396,
      height: 235,
      rotation: place.rotation,
    },
    {
      id: `${id}-caption`,
      type: 'text',
      variant: 'body',
      text: media.caption,
      color: '#243e43',
      x: place.x + 25,
      y: place.y + 275,
      width: 390,
      height: 52,
      rotation: place.rotation,
    },
  ]
}

export function appendMediaToStory(
  presentation: Presentation,
  media: GalleryMedia[],
): Presentation {
  if (!media.length) return presentation
  const frames = [...presentation.frames]
  const elements = [...presentation.elements]
  const path = [...presentation.path]
  const right = Math.max(0, ...frames.map((frame) => frame.x + frame.width))
  const lastY = frames.at(-1)?.y ?? 0
  media.forEach((item, index) => {
    const id = `media-${item.id}`
    const place = {
      x: right + 220 + index * 560,
      y: lastY + (index % 2 ? 60 : -60),
      rotation: index % 2 ? 2 : -2,
    }
    frames.push({
      id,
      name: `${String(path.length + 1).padStart(2, '0')} · ${item.caption}`,
      x: place.x,
      y: place.y,
      width: 440,
      height: 340,
      rotation: place.rotation,
      cameraZoom: 1,
      duration: 850,
      accent: palette[(presentation.path.length + index) % palette.length][1],
    })
    elements.push(...mediaElements(id, item, place))
    path.push(id)
  })
  return { ...presentation, frames, elements, path, style: 'story' }
}

export function buildVisualPresentation(
  style: Exclude<PresentationStyle, 'story'>,
  gallery: GalleryMedia[],
  title = 'Mon histoire visuelle',
  previous?: Presentation,
): Presentation {
  const frames: Frame[] = []
  const elements: CanvasElement[] = []
  gallery.forEach((media, index) => {
    const place = position(style, index, gallery.length)
    const id = `visual-${index + 1}`
    frames.push({
      id,
      name: `${String(index + 1).padStart(2, '0')} · ${media.caption}`,
      x: place.x,
      y: place.y,
      width: 440,
      height: 340,
      rotation: place.rotation,
      cameraZoom:
        style === 'steps'
          ? 0.5
          : [
                'chevrons',
                'medallions',
                'ribbons',
                'milestones',
                'spectrum',
              ].includes(style)
            ? 0.55
            : 1,
      duration: 850,
      accent: palette[index % palette.length][1],
    })
    elements.push(...mediaElements(id, media, place))
  })
  const next: Presentation = {
    version: 1,
    title,
    elements,
    frames,
    path: frames.map((frame) => frame.id),
    style,
  }
  if (!previous) return next

  const rootMap = new Map(
    previous.path.map((id, index) => [id, next.path[index]]),
  )
  const oldById = new Map(previous.frames.map((frame) => [frame.id, frame]))
  const nested = previous.frames.filter((frame) => !!frame.parentId)
  const frameMap = new Map(next.frames.map((frame) => [frame.id, frame]))
  previous.path.forEach((id, index) => {
    const old = oldById.get(id)
    const target = next.frames[index]
    if (old && target) {
      target.children = old.children
      target.numberVisible = old.numberVisible
    }
  })
  const pending = [...nested]
  while (pending.length) {
    const index = pending.findIndex(
      (frame) =>
        frame.parentId &&
        frameMap.has(rootMap.get(frame.parentId) ?? frame.parentId),
    )
    if (index < 0) break
    const old = pending.splice(index, 1)[0]
    const parentId = rootMap.get(old.parentId!) ?? old.parentId!
    const moved = {
      ...old,
      parentId,
    }
    next.frames.push(moved)
    frameMap.set(moved.id, moved)
  }
  const nestedIds = new Set(nested.map((frame) => frame.id))
  next.elements.push(
    ...previous.elements.filter(
      (element) =>
        'frameId' in element &&
        element.frameId &&
        nestedIds.has(element.frameId),
    ),
  )
  if (previous.style === 'story') return next

  const oldTexts = previous.elements.filter(
    (element): element is TextElement =>
      element.type === 'text' &&
      !(
        'frameId' in element &&
        element.frameId &&
        nestedIds.has(element.frameId)
      ),
  )
  const nextElementIds = new Set(next.elements.map((element) => element.id))
  const transferred = oldTexts.flatMap((text) => {
    const oldFrame =
      previous.frames.find((frame) => frame.id === text.frameId) ??
      previous.frames.find((frame) => text.id === `${frame.id}-caption`) ??
      [...previous.frames].sort(
        (a, b) =>
          Math.hypot(
            text.x - (a.x + a.width / 2),
            text.y - (a.y + a.height / 2),
          ) -
          Math.hypot(
            text.x - (b.x + b.width / 2),
            text.y - (b.y + b.height / 2),
          ),
      )[0]
    const newFrame = next.frames.find((frame) => frame.id === oldFrame?.id)
    if (!oldFrame || !newFrame) return []
    return [
      {
        ...text,
        x: text.x + newFrame.x - oldFrame.x,
        y: text.y + newFrame.y - oldFrame.y,
        rotation: text.rotation + newFrame.rotation - oldFrame.rotation,
      },
    ]
  })
  const transferredById = new Map(transferred.map((text) => [text.id, text]))
  next.elements = [
    ...next.elements.map(
      (element) => transferredById.get(element.id) ?? element,
    ),
    ...transferred.filter((text) => !nextElementIds.has(text.id)),
  ]
  return next
}
