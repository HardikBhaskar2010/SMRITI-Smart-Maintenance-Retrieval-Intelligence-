import api from './client'

export interface GuruStartRequest {
  asset_id: string;
  expert_name: string;
}

export interface GuruRespondRequest {
  session_id: string;
  answer: string;
}

export const startGuruSession = (req: GuruStartRequest) =>
  api.post('/guru/start', req).then((r) => r.data)

export const respondToGuru = (req: GuruRespondRequest) =>
  api.post('/guru/respond', req).then((r) => r.data)

export const getGuruSession = (sessionId: string) =>
  api.get(`/guru/session/${sessionId}`).then((r) => r.data)
