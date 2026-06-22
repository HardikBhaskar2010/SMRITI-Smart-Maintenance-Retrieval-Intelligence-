import api from './client'
import type { GraphData } from './types'

export const fetchGraph = (): Promise<GraphData> =>
  api.get('/graph').then((r) => r.data)
