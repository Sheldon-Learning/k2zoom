import { create } from 'zustand'
import type { Camera } from '../types/presentation'

interface EditorState {
  camera: Camera
  presenting: boolean
  activeFrame: number
  setCamera: (camera: Camera) => void
  setPresenting: (presenting: boolean) => void
  setActiveFrame: (index: number) => void
}

export const useEditorStore = create<EditorState>((set) => ({
  camera: { x: 25, y: 80, zoom: 0.55, rotation: 0 },
  presenting: false,
  activeFrame: 0,
  setCamera: (camera) => set({ camera }),
  setPresenting: (presenting) => set({ presenting }),
  setActiveFrame: (activeFrame) => set({ activeFrame }),
}))
