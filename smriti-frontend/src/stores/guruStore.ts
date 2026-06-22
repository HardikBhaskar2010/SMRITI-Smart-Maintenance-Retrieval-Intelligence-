import { create } from 'zustand'
import type { GuruSession } from '@/api/types'

interface GuruState {
  session: GuruSession | null
  isStarting: boolean
  isSubmitting: boolean
  expertAnswer: string
  displayedDebtScore: number

  setSession: (session: GuruSession | null) => void
  updateSession: (partial: Partial<GuruSession>) => void
  setIsStarting: (v: boolean) => void
  setIsSubmitting: (v: boolean) => void
  setExpertAnswer: (a: string) => void
  clearAnswer: () => void
  setDisplayedDebtScore: (score: number) => void
}

export const useGuruStore = create<GuruState>((set) => ({
  session: null,
  isStarting: false,
  isSubmitting: false,
  expertAnswer: '',
  displayedDebtScore: 0,

  setSession: (session) => set({ session }),
  updateSession: (partial) =>
    set((s) => ({
      session: s.session ? { ...s.session, ...partial } : null,
    })),
  setIsStarting: (v) => set({ isStarting: v }),
  setIsSubmitting: (v) => set({ isSubmitting: v }),
  setExpertAnswer: (a) => set({ expertAnswer: a }),
  clearAnswer: () => set({ expertAnswer: '' }),
  setDisplayedDebtScore: (score) => set({ displayedDebtScore: score }),
}))
