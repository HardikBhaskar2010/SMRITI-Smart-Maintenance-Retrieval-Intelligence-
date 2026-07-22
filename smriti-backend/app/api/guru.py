"""Guru Mode API: POST /api/guru/start · POST /api/guru/respond · GET /api/guru/session/{id}"""
from fastapi import APIRouter, HTTPException

from app.db.session_store import get_session_store
from app.models.guru import GuruRespondRequest, GuruStartRequest
from app.services.guru.session import process_expert_answer, start_guru_session

router = APIRouter()


@router.post("/guru/start")
async def start_session(request: GuruStartRequest):
    session = await start_guru_session(request.asset_id, request.expert_name)
    first_question = session.messages[0].content if session.messages else ""
    return {
        "session_id":       session.session_id,
        "asset_id":         session.asset_id,
        "expert_name":      session.expert_name,
        "first_question":   first_question,
        "initial_debt_score": session.initial_debt_score,
    }


@router.post("/guru/respond")
async def respond_to_question(request: GuruRespondRequest):
    try:
        return await process_expert_answer(request.session_id, request.answer)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/guru/session/{session_id}")
def get_session(session_id: str):
    store = get_session_store()
    session = store.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
    return session.model_dump()
