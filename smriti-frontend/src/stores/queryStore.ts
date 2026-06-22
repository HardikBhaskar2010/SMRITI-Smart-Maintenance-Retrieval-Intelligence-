import { create } from 'zustand'
import type { QueryResponse } from '@/api/types'

interface QueryState {
  query: string
  isLoading: boolean
  result: QueryResponse | null
  error: string | null
  setQuery: (q: string) => void
  setLoading: (v: boolean) => void
  setResult: (r: QueryResponse | null) => void
  setError: (e: string | null) => void
  reset: () => void
}

export const useQueryStore = create<QueryState>((set) => ({
  query: '',
  isLoading: false,
  result: null,
  error: null,
  setQuery: (q) => set({ query: q }),
  setLoading: (v) => set({ isLoading: v }),
  setResult: (r) => set({ result: r, error: null }),
  setError: (e) => set({ error: e, isLoading: false }),
  reset: () => set({ query: '', result: null, error: null, isLoading: false }),
}))
