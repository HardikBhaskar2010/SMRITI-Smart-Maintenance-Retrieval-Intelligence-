import { create } from 'zustand'

interface GuruState {
  sessionId: string | null
  assetId: string | null
  expertName: string
  currentQuestion: string
  messages: Array<{ role: string; content: string; timestamp: string }>
  initialScore: number
  currentScore: number
  questionsAsked: number
  status: 'idle' | 'active' | 'completed'
  isLoading: boolean

  startSession: (sessionId: string, assetId: string, expertName: string, firstQuestion: string, debtScore: number) => void
  addMessage: (role: string, content: string) => void
  updateScore: (score: number) => void
  setCurrentQuestion: (q: string) => void
  setLoading: (v: boolean) => void
  endSession: () => void
  reset: () => void
}

export const useGuruStore = create<GuruState>((set) => ({
  sessionId: null,
  assetId: null,
  expertName: '',
  currentQuestion: '',
  messages: [],
  initialScore: 0,
  currentScore: 0,
  questionsAsked: 0,
  status: 'idle',
  isLoading: false,

  startSession: (sessionId, assetId, expertName, firstQuestion, debtScore) =>
    set({
      sessionId,
      assetId,
      expertName,
      currentQuestion: firstQuestion,
      messages: [{ role: 'interviewer', content: firstQuestion, timestamp: new Date().toISOString() }],
      initialScore: debtScore,
      currentScore: debtScore,
      questionsAsked: 1,
      status: 'active',
    }),

  addMessage: (role, content) =>
    set((s) => ({
      messages: [...s.messages, { role, content, timestamp: new Date().toISOString() }],
    })),

  updateScore: (score) => set({ currentScore: score }),
  setCurrentQuestion: (q) => set({ currentQuestion: q, questionsAsked: (s: any) => s.questionsAsked + 1 }),
  setLoading: (v) => set({ isLoading: v }),
  endSession: () => set({ status: 'completed' }),
  reset: () =>
    set({
      sessionId: null, assetId: null, expertName: '', currentQuestion: '',
      messages: [], initialScore: 0, currentScore: 0, questionsAsked: 0,
      status: 'idle', isLoading: false,
    }),
}))
