import { describe, expect, it, vi } from 'vitest'
import { demoPresentation } from '../data/demo'
import { buildVisualPresentation, demoGallery } from '../data/visualStyles'
import { parsePresentation } from '../utils/storage'
import {
  addNestedSlide,
  ancestorsOf,
  childrenOf,
  deleteSlide,
  duplicateSlide,
  moveSlide,
  presentationOrder,
  slideNumbers,
} from './slideHierarchy'

vi.stubGlobal('crypto', {
  randomUUID: (() => {
    let id = 0
    return () => String(++id)
  })(),
})

describe('nested presentation slides', () => {
  it('keeps the main route optional while exploring multiple levels', () => {
    const parent = demoPresentation.path[1]
    const first = addNestedSlide(demoPresentation, parent)
    const child = childrenOf(first, parent)[0]
    const second = addNestedSlide(first, child.id)
    const grandchild = childrenOf(second, child.id)[0]
    expect(second.path).toEqual(demoPresentation.path)
    expect(slideNumbers(second).get(child.id)).toBe('02.1')
    expect(slideNumbers(second).get(grandchild.id)).toBe('02.1.1')
    expect(presentationOrder(second).map((frame) => frame.id)).toEqual([
      demoPresentation.path[0],
      parent,
      child.id,
      grandchild.id,
    ])
    expect(ancestorsOf(second, grandchild.id).map((frame) => frame.id)).toEqual(
      [parent, child.id],
    )
    expect(parsePresentation(JSON.stringify(second))).toEqual(second)
  })

  it('reparents and renumbers slides without changing stable IDs', () => {
    const first = addNestedSlide(demoPresentation, demoPresentation.path[0])
    const child = childrenOf(first, demoPresentation.path[0])[0]
    const moved = moveSlide(first, child.id, demoPresentation.path[1])
    expect(childrenOf(moved, demoPresentation.path[0])).toHaveLength(0)
    expect(slideNumbers(moved).get(child.id)).toBe('02.1')
    expect(moveSlide(moved, demoPresentation.path[1], child.id)).toBe(moved)
  })

  it('deletes a parent and all descendants', () => {
    const parent = demoPresentation.path[1]
    const first = addNestedSlide(demoPresentation, parent)
    const child = childrenOf(first, parent)[0]
    const second = addNestedSlide(first, child.id)
    const deleted = deleteSlide(second, parent)
    expect(
      deleted.frames.some(
        (frame) => frame.id === parent || frame.id === child.id,
      ),
    ).toBe(false)
    expect(deleted.path).not.toContain(parent)
    expect(parsePresentation(JSON.stringify(deleted))).toEqual(deleted)
  })

  it('keeps nested frames when switching visual templates', () => {
    const source = addNestedSlide(demoPresentation, demoPresentation.path[0])
    const child = childrenOf(source, demoPresentation.path[0])[0]
    const styled = buildVisualPresentation(
      'grid',
      demoGallery,
      source.title,
      source,
    )
    expect(styled.frames.find((frame) => frame.id === child.id)?.parentId).toBe(
      styled.path[0],
    )
    expect(styled.frames.find((frame) => frame.id === child.id)?.width).toBe(
      child.width,
    )
    expect(
      childrenOf(styled, styled.path[0]).map((frame) => frame.id),
    ).toContain(child.id)
    expect(parsePresentation(JSON.stringify(styled))).toEqual(styled)
  })

  it('duplicates a branch and its elements with new IDs', () => {
    const first = addNestedSlide(demoPresentation, demoPresentation.path[0])
    const child = childrenOf(first, demoPresentation.path[0])[0]
    const second = addNestedSlide(first, child.id)
    const duplicate = duplicateSlide(second, child.id)
    const siblings = childrenOf(duplicate, demoPresentation.path[0])
    expect(siblings).toHaveLength(2)
    expect(siblings[1].id).not.toBe(child.id)
    expect(childrenOf(duplicate, siblings[1].id)).toHaveLength(1)
    expect(parsePresentation(JSON.stringify(duplicate))).toEqual(duplicate)
  })

  it('separates older overlapping children while keeping their content attached', () => {
    const parentId = demoPresentation.path[0]
    const first = addNestedSlide(demoPresentation, parentId, 'aurora')
    const second = addNestedSlide(first, parentId)
    const siblings = childrenOf(second, parentId)
    const legacy = {
      ...second,
      frames: second.frames.map((frame) =>
        frame.id === parentId
          ? { ...frame, subPresentationStyle: undefined }
          : frame.id === siblings[1].id
            ? { ...frame, x: 0, y: 0 }
            : frame,
      ),
      elements: second.elements.map((element) =>
        'frameId' in element && element.frameId === siblings[1].id
          ? { ...element, x: element.x - 1120 }
          : element,
      ),
    }
    const restored = parsePresentation(JSON.stringify(legacy))
    expect(childrenOf(restored, parentId).map((frame) => frame.x)).toEqual([
      0, 1120,
    ])
    expect(
      restored.frames.find((frame) => frame.id === parentId)
        ?.subPresentationStyle,
    ).toBe('aurora')
    expect(
      restored.elements.find(
        (element) => element.id === `${siblings[1].id}-caption`,
      )?.x,
    ).toBe(1200)
  })
})
