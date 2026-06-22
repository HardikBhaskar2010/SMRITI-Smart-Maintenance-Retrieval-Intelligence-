import { create } from 'zustand'
import type { AssetSummary } from '@/api/types'

interface AssetState {
  assets: AssetSummary[]
  setAssets: (assets: AssetSummary[]) => void
  getCriticalCount: () => number
  getWarningCount: () => number
  getOkCount: () => number
}

export const useAssetStore = create<AssetState>((set, get) => ({
  assets: [],
  setAssets: (assets) => set({ assets }),
  getCriticalCount: () => get().assets.filter((a) => a.severity === 'CRITICAL').length,
  getWarningCount: () => get().assets.filter((a) => a.severity === 'WARNING').length,
  getOkCount: () => get().assets.filter((a) => a.severity === 'OK').length,
}))
