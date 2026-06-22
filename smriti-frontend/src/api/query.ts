import api from './client'
import type { QueryRequest, QueryResponse } from './types'

export const submitQuery = (req: QueryRequest): Promise<QueryResponse> =>
  api.post('/query', req).then((r) => r.data)

/** Alias for backward compat */
export const runQuery = submitQuery
