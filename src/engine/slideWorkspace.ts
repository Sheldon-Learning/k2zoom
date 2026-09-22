import type { CanvasElement, Presentation } from '../types/presentation'
import { childrenOf } from './slideHierarchy'

function ownerId(element: CanvasElement, presentation: Presentation) {
  if ('frameId' in element && element.frameId) return element.frameId
  return presentation.frames.find((frame) =>
    element.id.startsWith(`${frame.id}-`),
  )?.id
}

/** A nested slide is a separate page; its siblings and parent stay in the document. */
export function workspacePresentation(
  presentation: Presentation,
  nestedId: string | null,
): Presentation {
  const nested = nestedId
    ? presentation.frames.find(
        (frame) => frame.id === nestedId && frame.parentId,
      )
    : undefined
  const parent = nested
    ? presentation.frames.find((frame) => frame.id === nested.parentId)
    : undefined
  const siblings = parent ? childrenOf(presentation, parent.id) : []
  const siblingIds = new Set(siblings.map((frame) => frame.id))
  const pageStyle =
    parent?.subPresentationStyle ?? siblings[0]?.pageStyle ?? 'paper'
  const rootIds = new Set(
    presentation.frames
      .filter((frame) => !frame.parentId)
      .map((frame) => frame.id),
  )
  return {
    ...presentation,
    frames: nested
      ? siblings.map((frame) => ({ ...frame, pageStyle }))
      : presentation.frames.filter((frame) => !frame.parentId),
    path: nested ? siblings.map((frame) => frame.id) : presentation.path,
    style: nested ? 'story' : presentation.style,
    frameShape: nested ? 'rectangle' : presentation.frameShape,
    elements: presentation.elements.filter((element) => {
      const owner = ownerId(element, presentation)
      return nested
        ? !!owner && siblingIds.has(owner)
        : !owner || rootIds.has(owner)
    }),
  }
}
