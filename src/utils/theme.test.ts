import { describe, expect, it } from 'vitest'
import { parseTheme } from './theme'

describe('theme preference', () => {
  it('recognizes all supported themes and falls back safely', () => {
    expect(parseTheme('light')).toBe('light')
    expect(parseTheme('dark')).toBe('dark')
    expect(parseTheme('sapphire')).toBe('sapphire')
    expect(parseTheme('unknown')).toBe('light')
    expect(parseTheme(null)).toBe('light')
  })
})
