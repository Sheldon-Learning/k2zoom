import { demoPresentation } from '../data/demo'
import type { Presentation } from '../types/presentation'

const KEY = 'zoomet.presentation.v1'

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
        typeof frame.accent === 'string',
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
            ['eyebrow', 'heading', 'body', 'stat'].includes(
              String(element.variant),
            ) &&
            typeof element.color === 'string'
          : element.type === 'shape' &&
            ['circle', 'rect'].includes(String(element.shape)) &&
            typeof element.fill === 'string'),
    )
  )
    throw new Error('Invalid elements')
  const frameIds = new Set(value.frames.map((frame) => frame.id))
  if (!value.path.every((id) => typeof id === 'string' && frameIds.has(id)))
    throw new Error('Invalid presentation path')
  return value as Presentation
}

export function loadPresentation(): Presentation {
  try {
    const saved = localStorage.getItem(KEY)
    return saved ? parsePresentation(saved) : demoPresentation
  } catch {
    return demoPresentation
  }
}

export function savePresentation(presentation: Presentation): void {
  localStorage.setItem(KEY, JSON.stringify(presentation))
}
