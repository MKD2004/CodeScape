import { create } from 'zustand'
import type { FileNode } from '../data/tree'

export type CameraMode = 'orbit' | 'walk'

interface CityState {
  selected: FileNode | null
  cameraMode: CameraMode
  select: (file: FileNode) => void
  clearSelection: () => void
  setCameraMode: (mode: CameraMode) => void
}

export const useCityStore = create<CityState>((set) => ({
  selected: null,
  cameraMode: 'orbit',
  select: (file) => set({ selected: file }),
  clearSelection: () => set({ selected: null }),
  setCameraMode: (mode) => set({ cameraMode: mode }),
}))
