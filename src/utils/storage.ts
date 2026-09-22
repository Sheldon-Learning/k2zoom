import { demoPresentation } from '../data/demo'
import type { Presentation } from '../types/presentation'
import { normalizeNestedPresentations } from '../engine/slideHierarchy'

const KEY = 'kzoom.presentation.v1'
const LEGACY_KEY = 'zoomet.presentation.v1'

export function parsePresentation(json: string): Presentation {
  const parsed: unknown = JSON.parse(json)
  if (!parsed || typeof parsed !== 'object')
    throw new Error('Invalid presentation')
  const value = parsed as Partial<Presentation>
  if (
    value.version !== 1 ||
    typeof value.title !== 'string' ||
    !Array.isArray(value.elements) ||
    !Array.isArray(value.frames) ||
    !Array.isArray(value.path)
  ) {
    throw new Error('Unsupported presentation format')
  }
  if (
    value.style !== undefined &&
    ![
      'story',
      'timeline',
      'orbit',
      'orbit-eclipse',
      'orbit-amber',
      'orbit-azure',
      'orbit-pearl',
      'orbit-duo',
      'orbit-concentric',
      'orbit-plasma',
      'orbit-mint',
      'orbit-scarlet',
      'grid',
      'spiral',
      'zigzag',
      'chevrons',
      'medallions',
      'steps',
      'ribbons',
      'milestones',
      'spectrum',
    ].includes(value.style)
  ) {
    throw new Error('Invalid presentation style')
  }
  const isNumber = (number: unknown): number is number =>
    typeof number === 'number' && Number.isFinite(number)
  const isBox = (item: Record<string, unknown>) =>
    typeof item.id === 'string' &&
    isNumber(item.x) &&
    isNumber(item.y) &&
    isNumber(item.width) &&
    item.width > 0 &&
    isNumber(item.height) &&
    item.height > 0 &&
    isNumber(item.rotation)
  const isRecord = (item: unknown): item is Record<string, unknown> =>
    item !== null && typeof item === 'object'
  const isImageSource = (source: unknown) =>
    typeof source === 'string' &&
    (/^data:image\/(jpeg|png|webp|svg\+xml)[;,]/.test(source) ||
      /^https:\/\//.test(source) ||
      source.startsWith('./') ||
      source.startsWith('/'))
  if (
    !value.frames.every(
      (frame) =>
        isRecord(frame) &&
        isBox(frame) &&
        typeof frame.name === 'string' &&
        isNumber(frame.cameraZoom) &&
        frame.cameraZoom > 0 &&
        isNumber(frame.duration) &&
        frame.duration >= 0 &&
        typeof frame.accent === 'string' &&
        (frame.pageStyle === undefined ||
          ['paper', 'aurora', 'midnight', 'sand'].includes(frame.pageStyle)) &&
        (frame.subPresentationStyle === undefined ||
          ['paper', 'aurora', 'midnight', 'sand'].includes(
            frame.subPresentationStyle,
          )),
      // Optional hierarchy fields keep older JSON presentations valid.
    )
  ) {
    throw new Error('Invalid frames')
  }
  if (
    !value.elements.every(
      (element) =>
        isRecord(element) &&
        isBox(element) &&
        (element.type === 'text'
          ? typeof element.text === 'string' &&
            (element.frameId === undefined ||
              typeof element.frameId === 'string') &&
            ['eyebrow', 'heading', 'body', 'stat'].includes(
              String(element.variant),
            ) &&
            typeof element.color === 'string' &&
            (element.fontFamily === undefined ||
              [
                'Manrope',
                'DM Sans',
                'Georgia',
                'Arial',
                'Courier New',
                'Impact',
                'Arial Black',
              ].includes(String(element.fontFamily))) &&
            (element.fontSize === undefined ||
              (isNumber(element.fontSize) &&
                element.fontSize >= 10 &&
                element.fontSize <= 240)) &&
            (element.effect === undefined ||
              ['plain', 'video', 'shadow'].includes(String(element.effect))) &&
            (element.customColor === undefined ||
              typeof element.customColor === 'boolean')
          : element.type === 'shape'
            ? ['circle', 'rect'].includes(String(element.shape)) &&
              typeof element.fill === 'string'
            : element.type === 'image'
              ? isImageSource(element.src) && typeof element.alt === 'string'
              : element.type === 'video' &&
                (element.frameId === undefined ||
                  typeof element.frameId === 'string') &&
                typeof element.videoId === 'string' &&
                /^[A-Za-z0-9_-]{11}$/.test(element.videoId) &&
                typeof element.title === 'string'),
    )
  )
    throw new Error('Invalid elements')
  const frameIds = new Set(value.frames.map((frame) => frame.id))
  if (frameIds.size !== value.frames.length)
    throw new Error('Duplicate frame IDs')
  if (!value.path.every((id) => typeof id === 'string' && frameIds.has(id)))
    throw new Error('Invalid presentation path')
  if (new Set(value.path).size !== value.path.length)
    throw new Error('Duplicate path IDs')
  const byId = new Map(value.frames.map((frame) => [frame.id, frame]))
  for (const frame of value.frames) {
    if (
      frame.parentId !== undefined &&
      (typeof frame.parentId !== 'string' || !frameIds.has(frame.parentId))
    )
      throw new Error('Invalid parent')
    if (
      frame.children !== undefined &&
      (!Array.isArray(frame.children) ||
        frame.children.some(
          (id) =>
            typeof id !== 'string' ||
            !frameIds.has(id) ||
            byId.get(id)?.parentId !== frame.id,
        ) ||
        new Set(frame.children).size !== frame.children.length)
    )
      throw new Error('Invalid children')
    if (
      frame.hiddenFromMainPath !== undefined &&
      typeof frame.hiddenFromMainPath !== 'boolean'
    )
      throw new Error('Invalid visibility')
    if (
      frame.numberVisible !== undefined &&
      typeof frame.numberVisible !== 'boolean'
    )
      throw new Error('Invalid slide number')
    if (
      frame.numberPosition !== undefined &&
      !['top-left', 'top-right', 'bottom-left', 'bottom-right'].includes(
        frame.numberPosition,
      )
    )
      throw new Error('Invalid number position')
    if (
      frame.numberScale !== undefined &&
      (!isNumber(frame.numberScale) ||
        frame.numberScale < 0.5 ||
        frame.numberScale > 2)
    )
      throw new Error('Invalid number scale')
    if (
      frame.numberColor !== undefined &&
      (typeof frame.numberColor !== 'string' ||
        !/^#[0-9a-fA-F]{6}$/.test(frame.numberColor))
    )
      throw new Error('Invalid number color')
    if (frame.parentId && value.path.includes(frame.id))
      throw new Error('Nested frame in main path')
    const seen = new Set<string>([frame.id])
    let parent = frame.parentId
    while (parent) {
      if (seen.has(parent)) throw new Error('Cyclic slide hierarchy')
      seen.add(parent)
      parent = byId.get(parent)?.parentId
    }
  }
  return normalizeNestedPresentations(value as Presentation)
}

export function loadPresentation(): Presentation {
  try {
    const current = localStorage.getItem(KEY)
    const legacy = current ? null : localStorage.getItem(LEGACY_KEY)
    const saved = current ?? legacy
    if (!saved) return demoPresentation
    const presentation = parsePresentation(saved)
    if (legacy) {
      try {
        localStorage.setItem(KEY, legacy)
      } catch {
        // Continue using the valid legacy document if storage is full.
      }
    }
    return presentation
  } catch {
    return demoPresentation
  }
}

export function savePresentation(presentation: Presentation): void {
  localStorage.setItem(KEY, JSON.stringify(presentation))
}
