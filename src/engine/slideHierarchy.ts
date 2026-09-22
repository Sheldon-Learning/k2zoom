import type { Frame, Presentation } from '../types/presentation'

export function childrenOf(
  presentation: Presentation,
  parentId?: string,
): Frame[] {
  const byId = new Map(presentation.frames.map((frame) => [frame.id, frame]))
  if (parentId) {
    const parent = byId.get(parentId)
    return (
      parent?.children ??
      presentation.frames
        .filter((frame) => frame.parentId === parentId)
        .map((frame) => frame.id)
    )
      .map((id) => byId.get(id))
      .filter((frame): frame is Frame => !!frame)
  }
  return presentation.path
    .map((id) => byId.get(id))
    .filter((frame): frame is Frame => !!frame && !frame.parentId)
}

export function slideNumbers(presentation: Presentation): Map<string, string> {
  const numbers = new Map<string, string>()
  const visit = (
    parentId: string | undefined,
    prefix: string,
    ancestors: Set<string>,
  ) => {
    childrenOf(presentation, parentId).forEach((frame, index) => {
      if (ancestors.has(frame.id)) return
      const number = prefix
        ? `${prefix}.${index + 1}`
        : String(index + 1).padStart(2, '0')
      numbers.set(frame.id, number)
      visit(frame.id, number, new Set([...ancestors, frame.id]))
    })
  }
  visit(undefined, '', new Set())
  return numbers
}

export function presentationOrder(presentation: Presentation): Frame[] {
  const frames: Frame[] = []
  const seen = new Set<string>()
  const visit = (frame: Frame) => {
    if (seen.has(frame.id)) return
    seen.add(frame.id)
    frames.push(frame)
    childrenOf(presentation, frame.id).forEach(visit)
  }
  childrenOf(presentation).forEach(visit)
  return frames
}

export function ancestorsOf(presentation: Presentation, id: string): Frame[] {
  const byId = new Map(presentation.frames.map((frame) => [frame.id, frame]))
  const result: Frame[] = []
  const seen = new Set<string>([id])
  let current = byId.get(id)
  while (current?.parentId && !seen.has(current.parentId)) {
    current = byId.get(current.parentId)
    if (!current) break
    result.unshift(current)
    seen.add(current.id)
  }
  return result
}

export function addNestedSlide(
  presentation: Presentation,
  parentId: string,
): Presentation {
  const parent = presentation.frames.find((frame) => frame.id === parentId)
  if (!parent) return presentation
  const frame: Frame = {
    id: `frame-${crypto.randomUUID()}`,
    name: 'Nouvelle sous-slide',
    parentId,
    children: [],
    hiddenFromMainPath: true,
    x: 0,
    y: 0,
    width: 960,
    height: 600,
    rotation: 0,
    cameraZoom: 1,
    duration: 650,
    accent: '#aab4d2',
    pageStyle: 'paper',
  }
  return {
    ...presentation,
    frames: [
      ...presentation.frames.map((item) =>
        item.id === parentId
          ? {
              ...item,
              children: [
                ...childrenOf(presentation, parentId).map((child) => child.id),
                frame.id,
              ],
            }
          : item,
      ),
      frame,
    ],
    elements: [
      ...presentation.elements,
      {
        id: `${frame.id}-caption`,
        type: 'text',
        frameId: frame.id,
        variant: 'heading',
        text: frame.name,
        color: '#172736',
        fontFamily: 'Manrope',
        fontSize: 62,
        x: frame.x + 80,
        y: frame.y + 120,
        width: frame.width - 160,
        height: 110,
        rotation: 0,
      },
      {
        id: `${frame.id}-intro`,
        type: 'text',
        frameId: frame.id,
        variant: 'body',
        text: 'Double-cliquez pour raconter votre idée.',
        color: '#657187',
        fontFamily: 'DM Sans',
        fontSize: 23,
        x: frame.x + 82,
        y: frame.y + 245,
        width: frame.width - 164,
        height: 100,
        rotation: 0,
      },
    ],
  }
}

export function moveSlide(
  presentation: Presentation,
  id: string,
  parentId?: string,
  beforeId?: string,
): Presentation {
  const frame = presentation.frames.find((item) => item.id === id)
  if (
    !frame ||
    parentId === id ||
    (parentId &&
      ancestorsOf(presentation, parentId).some((item) => item.id === id))
  )
    return presentation
  if (parentId && !presentation.frames.some((item) => item.id === parentId))
    return presentation
  const oldParent = frame.parentId
  const frames = presentation.frames.map((item) => {
    if (item.id === id)
      return { ...item, parentId, hiddenFromMainPath: !!parentId }
    if (item.id === oldParent || item.id === parentId)
      return {
        ...item,
        children: childrenOf(presentation, item.id)
          .map((child) => child.id)
          .filter((childId) => childId !== id),
      }
    return item
  })
  const path = presentation.path.filter((item) => item !== id)
  if (!parentId) {
    const index = beforeId ? path.indexOf(beforeId) : -1
    path.splice(index < 0 ? path.length : index, 0, id)
  } else {
    const parent = frames.find((item) => item.id === parentId)!
    const children = [...(parent.children ?? [])]
    const index = beforeId ? children.indexOf(beforeId) : -1
    children.splice(index < 0 ? children.length : index, 0, id)
    frames[frames.indexOf(parent)] = { ...parent, children }
  }
  return { ...presentation, frames, path }
}

export function deleteSlide(
  presentation: Presentation,
  id: string,
): Presentation {
  const removed = new Set<string>()
  const visit = (slideId: string) => {
    if (removed.has(slideId)) return
    removed.add(slideId)
    childrenOf(presentation, slideId).forEach((child) => visit(child.id))
  }
  visit(id)
  return {
    ...presentation,
    frames: presentation.frames
      .filter((frame) => !removed.has(frame.id))
      .map((frame) => ({
        ...frame,
        children: frame.children?.filter((childId) => !removed.has(childId)),
      })),
    path: presentation.path.filter((slideId) => !removed.has(slideId)),
    elements: presentation.elements.filter(
      (element) =>
        !(
          'frameId' in element &&
          element.frameId &&
          removed.has(element.frameId)
        ) &&
        ![...removed].some((slideId) => element.id.startsWith(`${slideId}-`)),
    ),
  }
}

export function duplicateSlide(
  presentation: Presentation,
  id: string,
): Presentation {
  const source = presentation.frames.find((frame) => frame.id === id)
  if (!source) return presentation
  const originals: Frame[] = []
  const collect = (frame: Frame) => {
    originals.push(frame)
    childrenOf(presentation, frame.id).forEach(collect)
  }
  collect(source)
  const ids = new Map(
    originals.map((frame) => [frame.id, `frame-${crypto.randomUUID()}`]),
  )
  const clones = originals.map((frame) => ({
    ...frame,
    id: ids.get(frame.id)!,
    name: frame.id === id ? `${frame.name} copie` : frame.name,
    parentId: frame.id === id ? frame.parentId : ids.get(frame.parentId!),
    children: childrenOf(presentation, frame.id).map((child) =>
      ids.get(child.id)!,
    ),
    x: frame.x + 32,
    y: frame.y + 32,
  }))
  const frames = presentation.frames.map((frame) =>
    frame.id === source.parentId
      ? {
          ...frame,
          children: (() => {
            const children = childrenOf(presentation, frame.id).map(
              (child) => child.id,
            )
            children.splice(children.indexOf(id) + 1, 0, ids.get(id)!)
            return children
          })(),
        }
      : frame,
  )
  frames.push(...clones)
  const path = [...presentation.path]
  if (!source.parentId) path.splice(path.indexOf(id) + 1, 0, ids.get(id)!)
  const elements = [...presentation.elements]
  for (const element of presentation.elements) {
    const owner =
      'frameId' in element && element.frameId && ids.has(element.frameId)
        ? element.frameId
        : originals.find((frame) => element.id.startsWith(`${frame.id}-`))?.id
    if (!owner) continue
    const newId = element.id.startsWith(`${owner}-`)
      ? `${ids.get(owner)}${element.id.slice(owner.length)}`
      : `${element.type}-${crypto.randomUUID()}`
    elements.push({
      ...element,
      id: newId,
      x: element.x + 32,
      y: element.y + 32,
      ...('frameId' in element && element.frameId
        ? { frameId: ids.get(element.frameId) ?? element.frameId }
        : {}),
    } as typeof element)
  }
  return { ...presentation, frames, path, elements }
}
