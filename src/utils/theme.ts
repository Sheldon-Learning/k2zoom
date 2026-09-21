export type AppTheme = 'light' | 'dark' | 'sapphire' | 'black'

const THEME_KEY = 'zoomet.theme'

export function parseTheme(value: string | null): AppTheme {
  return value === 'dark' || value === 'sapphire' || value === 'black'
    ? value
    : 'light'
}

export function loadTheme(): AppTheme {
  try {
    return parseTheme(localStorage.getItem(THEME_KEY))
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
