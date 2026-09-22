import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadTheme, parseTheme } from './theme'

afterEach(() => vi.unstubAllGlobals())

describe('theme preference', () => {
  it('keeps the previous Zoomet theme when renaming to Kzoom', () => {
    const entries = new Map([['zoomet.theme', 'sapphire']])
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => entries.get(key) ?? null,
      setItem: (key: string, value: string) => entries.set(key, value),
    })
    expect(loadTheme()).toBe('sapphire')
    expect(entries.get('kzoom.theme')).toBe('sapphire')
  })
  it('recognizes all supported themes and falls back safely', () => {
    expect(parseTheme('light')).toBe('light')
    expect(parseTheme('dark')).toBe('dark')
    expect(parseTheme('sapphire')).toBe('sapphire')
    expect(parseTheme('black')).toBe('black')
    expect(parseTheme('unknown')).toBe('light')
    expect(parseTheme(null)).toBe('light')
  })
})
