import type { CanvasElement, Presentation } from '../types/presentation'

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
  const rootIds = new Set(
    presentation.frames
      .filter((frame) => !frame.parentId)
      .map((frame) => frame.id),
  )
  return {
    ...presentation,
    frames: nested
      ? [nested]
      : presentation.frames.filter((frame) => !frame.parentId),
    path: nested ? [nested.id] : presentation.path,
    style: nested ? 'story' : presentation.style,
    elements: presentation.elements.filter((element) => {
      const owner = ownerId(element, presentation)
      return nested ? owner === nested.id : !owner || rootIds.has(owner)
    }),
  }
}
