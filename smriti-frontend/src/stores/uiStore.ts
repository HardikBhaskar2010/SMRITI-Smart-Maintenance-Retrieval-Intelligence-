import { create } from 'zustand'

export interface Toast {
  id: string
  message: string
  variant: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

interface UIState {
  selectedAssetId: string | null
  openAssetDrawer: (assetId: string) => void
  closeAssetDrawer: () => void

  sidebarOpen: boolean
  toggleSidebar: () => void

  toasts: Toast[]
  addToast: (t: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  selectedAssetId: null,
  openAssetDrawer: (assetId) => set({ selectedAssetId: assetId }),
  closeAssetDrawer: () => set({ selectedAssetId: null }),

  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  toasts: [],
  addToast: (t) =>
    set((s) => ({
      toasts: [...s.toasts, { id: `${Date.now()}-${Math.random()}`, ...t }],
    })),
  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
