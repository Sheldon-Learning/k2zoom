import { create } from 'zustand'
import type { Camera } from '../types/presentation'
import { loadTheme, saveTheme, type AppTheme } from '../utils/theme'

interface EditorState {
  camera: Camera
  presenting: boolean
  activeFrame: number
  theme: AppTheme
  setCamera: (camera: Camera) => void
  setPresenting: (presenting: boolean) => void
  setActiveFrame: (index: number) => void
  setTheme: (theme: AppTheme) => void
}

export const useEditorStore = create<EditorState>((set) => ({
  camera: { x: 25, y: 80, zoom: 0.55, rotation: 0 },
  presenting: false,
  activeFrame: 0,
  theme: loadTheme(),
  setCamera: (camera) => set({ camera }),
  setPresenting: (presenting) => set({ presenting }),
  setActiveFrame: (activeFrame) => set({ activeFrame }),
  setTheme: (theme) => {
    saveTheme(theme)
    set({ theme })
  },
}))
