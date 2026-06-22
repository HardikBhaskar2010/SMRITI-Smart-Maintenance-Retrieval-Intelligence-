import { create } from 'zustand'
import type { AssetSummary, AssetDetail } from '@/api/types'

interface AssetState {
  assets: AssetSummary[]
  selectedAsset: AssetDetail | null
  setAssets: (assets: AssetSummary[]) => void
  setSelectedAsset: (asset: AssetDetail | null) => void
}

export const useAssetStore = create<AssetState>((set) => ({
  assets: [],
  selectedAsset: null,
  setAssets: (assets) => set({ assets }),
  setSelectedAsset: (asset) => set({ selectedAsset: asset }),
}))
