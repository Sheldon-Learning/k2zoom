import { create } from 'zustand'
import { loadPresentation, savePresentation } from '../utils/storage'
import type { Presentation } from '../types/presentation'

interface PresentationState {
  presentation: Presentation
  saveStatus: 'saved' | 'saving' | 'error'
  rename: (title: string) => void
  replace: (presentation: Presentation) => void
}

let saveTimer: ReturnType<typeof setTimeout> | undefined

export const usePresentationStore = create<PresentationState>((set, get) => ({
  presentation: loadPresentation(),
  saveStatus: 'saved',
  rename: (title) => {
    set((state) => ({
      presentation: { ...state.presentation, title },
      saveStatus: 'saving',
    }))
    scheduleSave(get, set)
  },
  replace: (presentation) => {
    set({ presentation, saveStatus: 'saving' })
    scheduleSave(get, set)
  },
}))

function scheduleSave(
  get: () => PresentationState,
  set: (state: Partial<PresentationState>) => void,
): void {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    try {
      savePresentation(get().presentation)
      set({ saveStatus: 'saved' })
    } catch {
      set({ saveStatus: 'error' })
    }
  }, 450)
}
