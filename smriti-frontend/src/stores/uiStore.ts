import { create } from 'zustand'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface UIState {
  activeDrawerAssetId: string | null
  openDrawer: (assetId: string) => void
  closeDrawer: () => void

  toasts: Toast[]
  addToast: (message: string, type?: Toast['type']) => void
  removeToast: (id: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  activeDrawerAssetId: null,
  openDrawer: (assetId) => set({ activeDrawerAssetId: assetId }),
  closeDrawer: () => set({ activeDrawerAssetId: null }),

  toasts: [],
  addToast: (message, type = 'info') =>
    set((state) => ({
      toasts: [...state.toasts, { id: Date.now().toString(), message, type }],
    })),
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}))
