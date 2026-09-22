import { create } from 'zustand'
import { loadPresentation, savePresentation } from '../utils/storage'
import type { Presentation } from '../types/presentation'

interface PresentationState {
  presentation: Presentation
  saveStatus: 'saved' | 'saving' | 'error'
  rename: (title: string) => void
  replace: (presentation: Presentation) => void
  undo: () => void
  redo: () => void
  flush: () => void
}

let saveTimer: ReturnType<typeof setTimeout> | undefined
const undoStack: Presentation[] = []
const redoStack: Presentation[] = []

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
    if (presentation === get().presentation) return
    undoStack.push(get().presentation)
    if (undoStack.length > 100) undoStack.shift()
    redoStack.length = 0
    set({ presentation, saveStatus: 'saving' })
    scheduleSave(get, set)
  },
  undo: () => {
    const previous = undoStack.pop()
    if (!previous) return
    redoStack.push(get().presentation)
    set({ presentation: previous, saveStatus: 'saving' })
    scheduleSave(get, set)
  },
  redo: () => {
    const next = redoStack.pop()
    if (!next) return
    undoStack.push(get().presentation)
    set({ presentation: next, saveStatus: 'saving' })
    scheduleSave(get, set)
  },
  flush: () => {
    clearTimeout(saveTimer)
    try {
      savePresentation(get().presentation)
      set({ saveStatus: 'saved' })
    } catch {
      set({ saveStatus: 'error' })
    }
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
