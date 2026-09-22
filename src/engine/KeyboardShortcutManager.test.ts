import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  isTypingTarget,
  KeyboardShortcutManager,
} from './KeyboardShortcutManager'

afterEach(() => vi.unstubAllGlobals())

describe('keyboard shortcut context', () => {
  it('ignores inputs, search fields and rich text descendants', () => {
    class ElementMock extends EventTarget {
      constructor(
        public selector: string,
        public isContentEditable = false,
      ) {
        super()
      }
      closest(query: string) {
        return query.split(', ').includes(this.selector) ? this : null
      }
    }
    vi.stubGlobal('HTMLElement', ElementMock)
    expect(isTypingTarget(new ElementMock('input'))).toBe(true)
    expect(isTypingTarget(new ElementMock('[role="searchbox"]'))).toBe(true)
    expect(isTypingTarget(new ElementMock('div', true))).toBe(true)
    expect(isTypingTarget(new ElementMock('div'))).toBe(false)
  })

  it('registers one listener and removes it cleanly', () => {
    const add = vi.fn()
    const remove = vi.fn()
    vi.stubGlobal('window', {
      addEventListener: add,
      removeEventListener: remove,
    })
    const handler = vi.fn()
    const detach = new KeyboardShortcutManager(handler).attach()
    expect(add).toHaveBeenCalledWith('keydown', handler)
    detach()
    expect(remove).toHaveBeenCalledWith('keydown', handler)
  })
})
