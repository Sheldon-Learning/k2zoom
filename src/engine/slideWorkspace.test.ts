import { describe, expect, it, vi } from 'vitest'
import { demoPresentation } from '../data/demo'
import { addNestedSlide, childrenOf } from './slideHierarchy'
import { workspacePresentation } from './slideWorkspace'

vi.stubGlobal('crypto', {
  randomUUID: (() => {
    let id = 0
    return () => `new-page-${++id}`
  })(),
})

describe('nested slide workspaces', () => {
  it('opens a full size page without showing its parent or sibling content', () => {
    const parentId = demoPresentation.path[0]
    const presentation = addNestedSlide(demoPresentation, parentId)
    const child = childrenOf(presentation, parentId)[0]
    const withContent = {
      ...presentation,
      elements: [
        ...presentation.elements,
        {
          id: 'nested-copy',
          type: 'text' as const,
          frameId: child.id,
          variant: 'body' as const,
          text: 'Only on this page',
          color: '#000000',
          x: 20,
          y: 20,
          width: 200,
          height: 50,
          rotation: 0,
        },
      ],
    }
    expect(child.width).toBe(960)
    expect(child.pageStyle).toBe('paper')
    expect(workspacePresentation(withContent, null).frames).toHaveLength(2)
    expect(
      workspacePresentation(withContent, null).elements.some(
        (element) => element.id === 'nested-copy',
      ),
    ).toBe(false)
    const page = workspacePresentation(withContent, child.id)
    expect(page.frames.map((frame) => frame.id)).toEqual([child.id])
    expect(page.path).toEqual([child.id])
    expect(page.elements.map((element) => element.id)).toContain('nested-copy')
    expect(page.elements.map((element) => element.id)).toContain(
      `${child.id}-caption`,
    )
  })

  it('opens the complete sibling presentation with one shared style', () => {
    const parentId = demoPresentation.path[0]
    const first = addNestedSlide(demoPresentation, parentId, 'midnight')
    const second = addNestedSlide(first, parentId)
    const siblings = childrenOf(second, parentId)
    const workspace = workspacePresentation(second, siblings[0].id)
    expect(workspace.frames.map((frame) => frame.id)).toEqual(
      siblings.map((frame) => frame.id),
    )
    expect(workspace.frames.map((frame) => frame.x)).toEqual([0, 1120])
    expect(
      workspace.frames.every((frame) => frame.pageStyle === 'midnight'),
    ).toBe(true)
    expect(
      workspace.elements.filter((element) => element.type === 'text'),
    ).toHaveLength(4)
  })
})
