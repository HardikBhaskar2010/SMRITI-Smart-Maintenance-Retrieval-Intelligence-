import api from './client'
import type { AssetSummary, AssetDetail } from './types'

export const fetchAssets = (): Promise<AssetSummary[]> =>
  api.get('/assets').then((r) => r.data)

export const fetchAsset = (assetId: string): Promise<AssetDetail> =>
  api.get(`/assets/${assetId}`).then((r) => r.data)
