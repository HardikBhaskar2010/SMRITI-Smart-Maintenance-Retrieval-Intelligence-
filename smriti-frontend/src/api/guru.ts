import api from './client'

export const startGuruSession = (assetId: string, expertName: string) =>
  api.post('/guru/start', { asset_id: assetId, expert_name: expertName }).then((r) => r.data)

export const respondToGuru = (sessionId: string, answer: string) =>
  api.post('/guru/respond', { session_id: sessionId, answer }).then((r) => r.data)

export const getGuruSession = (sessionId: string) =>
  api.get(`/guru/session/${sessionId}`).then((r) => r.data)
