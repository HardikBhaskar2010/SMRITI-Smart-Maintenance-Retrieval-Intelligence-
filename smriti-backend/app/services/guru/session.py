"""Guru Mode session lifecycle management."""
import logging
import uuid
from datetime import UTC, datetime
from pathlib import Path

from app.config import settings
from app.db.chroma import get_chroma
from app.db.session_store import get_session_store
from app.models.guru import GuruMessage, GuruSession
from app.services.debt.scorer import recalculate_debt
from app.services.guru.interviewer import generate_followup, generate_opening_questions
from app.utils.hash import content_hash
from app.utils.tag_normalizer import normalize_asset_id

logger = logging.getLogger(__name__)


async def start_guru_session(asset_id: str, expert_name: str) -> GuruSession:
    store = get_session_store()
    debt = await recalculate_debt(asset_id)

    session = GuruSession(
        asset_id=asset_id,
        expert_name=expert_name,
        initial_debt_score=debt.get("score", 50),
        current_debt_score=debt.get("score", 50),
    )

    # Pre-generate opening questions
    questions = await generate_opening_questions(asset_id, expert_name)
    store.set_pending_questions(session.session_id, questions)

    first_question = questions[0] if questions else f"Please tell me about your experience with {asset_id}."
    session.messages.append(GuruMessage(
        role="interviewer",
        content=first_question,
    ))
    session.questions_asked = 1

    store.save_session(session)
    return session


async def process_expert_answer(session_id: str, answer: str) -> dict:
    store = get_session_store()
    session = store.get_session(session_id)
    if not session:
        raise ValueError(f"Session {session_id} not found")
    if session.status != "active":
        raise ValueError(f"Session {session_id} is {session.status}")

    # Append expert answer to transcript
    session.messages.append(GuruMessage(
        role="expert",
        content=answer,
    ))

    # Embed answer into asset ChromaDB thread
    chroma = get_chroma()
    col_name = normalize_asset_id(session.asset_id)
    col = chroma.get_or_create_collection(col_name, metadata={"asset_id": session.asset_id})

    chunk_hash = content_hash(answer)
    existing = col.get(where={"content_hash": chunk_hash})
    items_added = 0
    if not (existing and existing.get("ids")):
        item_id = str(uuid.uuid4())
        col.add(
            ids=[item_id],
            documents=[answer],
            metadatas=[{
                "asset_id":          session.asset_id,
                "added_by":          "guru_mode",
                "expert_name":       session.expert_name,
                "expert_attributed": True,
                "added_at":          datetime.now(UTC).isoformat(),
                "source_document":   f"guru_session_{session_id}",
                "source_page":       0,
                "content_hash":      chunk_hash,
            }],
        )
        items_added = 1
        session.knowledge_added += 1

    # Recalculate debt score
    new_debt = await recalculate_debt(session.asset_id)
    session.current_debt_score = new_debt.get("score", session.current_debt_score)

    # Get next question from pre-generated queue or generate a follow-up
    pending = store.get_pending_questions(session_id)
    if len(pending) > session.questions_asked:
        next_question = pending[session.questions_asked]
    else:
        # All pre-generated questions answered — try a follow-up
        conversation = [m.model_dump() for m in session.messages]
        next_question = await generate_followup(session.asset_id, conversation, answer)

    if next_question:
        session.messages.append(GuruMessage(
            role="interviewer",
            content=next_question,
        ))
        session.questions_asked += 1
    else:
        # No more questions — end session
        session.status = "completed"

    store.save_session(session)
    _persist_session(session)

    return {
        "session_id":       session.session_id,
        "next_question":    next_question,
        "items_added":      items_added,
        "initial_score":    session.initial_debt_score,
        "current_score":    session.current_debt_score,
        "score_delta":      session.initial_debt_score - session.current_debt_score,
        "questions_asked":  session.questions_asked,
        "session_status":   session.status,
    }


def _persist_session(session: GuruSession) -> None:
    """Save session transcript to disk for audit trail."""
    try:
        sessions_dir = Path(settings.SESSION_DIR)
        sessions_dir.mkdir(parents=True, exist_ok=True)
        path = sessions_dir / f"{session.session_id}.json"
        path.write_text(session.model_dump_json(indent=2), encoding="utf-8")
    except Exception as e:
        logger.warning("Could not persist session to disk: %s", e)
