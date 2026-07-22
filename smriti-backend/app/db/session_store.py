"""
In-memory store for active Guru Mode sessions.
Sessions are lost on server restart — this is acceptable for the hackathon prototype.
Production: replace with Redis or a DB-backed store.
"""

from app.models.guru import GuruSession


class SessionStore:
    def __init__(self):
        self._sessions: dict[str, GuruSession] = {}
        self._pending_questions: dict[str, list[str]] = {}

    def save_session(self, session: GuruSession) -> None:
        self._sessions[session.session_id] = session

    def get_session(self, session_id: str) -> GuruSession | None:
        return self._sessions.get(session_id)

    def delete_session(self, session_id: str) -> None:
        self._sessions.pop(session_id, None)
        self._pending_questions.pop(session_id, None)

    def list_sessions(self) -> list[GuruSession]:
        return list(self._sessions.values())

    def set_pending_questions(self, session_id: str, questions: list[str]) -> None:
        self._pending_questions[session_id] = questions

    def get_pending_questions(self, session_id: str) -> list[str]:
        return self._pending_questions.get(session_id, [])


_store: SessionStore | None = None


def get_session_store() -> SessionStore:
    global _store
    if _store is None:
        _store = SessionStore()
    return _store
