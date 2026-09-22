export type AppTheme = 'light' | 'dark' | 'sapphire' | 'black'

const THEME_KEY = 'kzoom.theme'
const LEGACY_THEME_KEY = 'zoomet.theme'

export function parseTheme(value: string | null): AppTheme {
  return value === 'dark' || value === 'sapphire' || value === 'black'
    ? value
    : 'light'
}

export function loadTheme(): AppTheme {
  try {
    const current = localStorage.getItem(THEME_KEY)
    const legacy =
      current === null ? localStorage.getItem(LEGACY_THEME_KEY) : null
    if (legacy !== null) {
      try {
        localStorage.setItem(THEME_KEY, legacy)
      } catch {
        // The previous preference is still usable for this visit.
      }
    }
    return parseTheme(current ?? legacy)
  } catch {
    return 'light'
  }
}

export function saveTheme(theme: AppTheme): void {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    // The selected theme still applies for the current visit.
  }
}
