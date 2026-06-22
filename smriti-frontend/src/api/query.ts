import api from './client'
import type { QueryResponse } from './types'

export const runQuery = (query: string, assetId?: string): Promise<QueryResponse> =>
  api.post('/query', { query, asset_id: assetId, max_results: 5 }).then((r) => r.data)
