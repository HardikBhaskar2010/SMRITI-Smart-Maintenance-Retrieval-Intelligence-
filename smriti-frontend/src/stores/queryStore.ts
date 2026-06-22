import { create } from 'zustand'
import type { QueryResponse } from '@/api/types'

interface QueryState {
  currentQuery: string
  lastResult: QueryResponse | null
  isQuerying: boolean
  history: string[]
  setCurrentQuery: (q: string) => void
  setLastResult: (r: QueryResponse | null) => void
  setIsQuerying: (v: boolean) => void
  pushHistory: (q: string) => void
  reset: () => void
}

export const useQueryStore = create<QueryState>((set) => ({
  currentQuery: '',
  lastResult: null,
  isQuerying: false,
  history: [],
  setCurrentQuery: (q) => set({ currentQuery: q }),
  setLastResult: (r) => set({ lastResult: r, isQuerying: false }),
  setIsQuerying: (v) => set({ isQuerying: v }),
  pushHistory: (q) => set((s) => ({
    history: [q, ...s.history.filter((h) => h !== q)].slice(0, 20),
  })),
  reset: () => set({ currentQuery: '', lastResult: null, isQuerying: false }),
}))
