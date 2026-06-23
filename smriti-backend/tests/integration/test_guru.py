"""
INTEGRATION TESTS — Guru Mode Sessions

POST /api/guru/start
POST /api/guru/respond
GET  /api/guru/session/{session_id}
"""
import pytest


GURU_BASE = "/api/guru"


class TestGuruStart:
    def test_start_session_returns_200(self, client, seeded_asset_id):
        res = client.post(
            f"{GURU_BASE}/start",
            json={"asset_id": seeded_asset_id, "expert_name": "Rajesh Kumar"},
            timeout=30
        )
        assert res.status_code == 200

    def test_start_session_has_required_fields(self, client, seeded_asset_id):
        res = client.post(
            f"{GURU_BASE}/start",
            json={"asset_id": seeded_asset_id, "expert_name": "Priya Sharma"},
            timeout=30
        )
        body = res.json()
        required = ["session_id", "asset_id", "expert_name", "first_question", "initial_debt_score"]
        for field in required:
            assert field in body, f"Missing field: {field}"

    def test_start_session_returns_first_question(self, client, seeded_asset_id):
        res = client.post(
            f"{GURU_BASE}/start",
            json={"asset_id": seeded_asset_id, "expert_name": "Vijay Singh"},
            timeout=30
        )
        body = res.json()
        assert isinstance(body["first_question"], str)
        assert len(body["first_question"]) > 5  # should be an actual question

    def test_start_session_correct_asset_id(self, client, seeded_asset_id):
        res = client.post(
            f"{GURU_BASE}/start",
            json={"asset_id": seeded_asset_id, "expert_name": "Test Expert"},
            timeout=30
        )
        body = res.json()
        assert body["asset_id"] == seeded_asset_id

    def test_start_session_missing_fields_returns_422(self, client, seeded_asset_id):
        res = client.post(f"{GURU_BASE}/start", json={"asset_id": seeded_asset_id})
        assert res.status_code == 422

    def test_start_session_generates_unique_ids(self, client, seeded_asset_id):
        payload = {"asset_id": seeded_asset_id, "expert_name": "Expert A"}
        id1 = client.post(f"{GURU_BASE}/start", json=payload, timeout=30).json()["session_id"]
        id2 = client.post(f"{GURU_BASE}/start", json=payload, timeout=30).json()["session_id"]
        assert id1 != id2


class TestGuruRespond:
    @pytest.fixture
    def active_session(self, client, seeded_asset_id):
        """Start a fresh Guru session for each test."""
        res = client.post(
            f"{GURU_BASE}/start",
            json={"asset_id": seeded_asset_id, "expert_name": "Mohan Lal"},
            timeout=30
        )
        assert res.status_code == 200
        return res.json()

    def test_respond_returns_200(self, client, active_session):
        res = client.post(
            f"{GURU_BASE}/respond",
            json={
                "session_id": active_session["session_id"],
                "answer": "The pump needs oil every 500 hours. We check bearings monthly."
            },
            timeout=30
        )
        assert res.status_code == 200

    def test_respond_returns_next_question(self, client, active_session):
        res = client.post(
            f"{GURU_BASE}/respond",
            json={
                "session_id": active_session["session_id"],
                "answer": "Vibration threshold is 4.5 mm/s per ISO 10816 standard."
            },
            timeout=30
        )
        body = res.json()
        assert "next_question" in body or "session" in body

    def test_respond_tracks_knowledge_added(self, client, active_session):
        res = client.post(
            f"{GURU_BASE}/respond",
            json={
                "session_id": active_session["session_id"],
                "answer": "Impeller clearance must be 0.3 to 0.5 mm. Cavitation is identified by noise."
            },
            timeout=30
        )
        body = res.json()
        assert "knowledge_added" in body
        assert isinstance(body["knowledge_added"], int)

    def test_respond_updates_debt_score(self, client, active_session):
        initial_score = active_session["initial_debt_score"]
        res = client.post(
            f"{GURU_BASE}/respond",
            json={
                "session_id": active_session["session_id"],
                "answer": "Mean time between failures is 8760 hours, that is one full year."
            },
            timeout=30
        )
        body = res.json()
        # Debt score should update (may go down as knowledge is added)
        assert "current_debt_score" in body
        assert isinstance(body["current_debt_score"], int)

    def test_respond_with_unknown_session_returns_404(self, client):
        res = client.post(
            f"{GURU_BASE}/respond",
            json={"session_id": "nonexistent-session-id-abc123", "answer": "test answer"},
            timeout=30
        )
        assert res.status_code == 404

    def test_respond_with_empty_answer_is_handled(self, client, active_session):
        res = client.post(
            f"{GURU_BASE}/respond",
            json={"session_id": active_session["session_id"], "answer": ""},
            timeout=30
        )
        # Should either handle gracefully or return validation error
        assert res.status_code in (200, 400, 422)


class TestGuruSession:
    def test_get_session_returns_200(self, client, seeded_asset_id):
        # Start a session first
        start_res = client.post(
            f"{GURU_BASE}/start",
            json={"asset_id": seeded_asset_id, "expert_name": "Anil Kapoor"},
            timeout=30
        )
        session_id = start_res.json()["session_id"]

        res = client.get(f"{GURU_BASE}/session/{session_id}")
        assert res.status_code == 200

    def test_get_session_has_messages(self, client, seeded_asset_id):
        start_res = client.post(
            f"{GURU_BASE}/start",
            json={"asset_id": seeded_asset_id, "expert_name": "Sunita Patel"},
            timeout=30
        )
        session_id = start_res.json()["session_id"]

        res = client.get(f"{GURU_BASE}/session/{session_id}")
        body = res.json()
        assert "messages" in body
        assert len(body["messages"]) >= 1  # at least the first question

    def test_get_session_has_correct_structure(self, client, seeded_asset_id):
        start_res = client.post(
            f"{GURU_BASE}/start",
            json={"asset_id": seeded_asset_id, "expert_name": "Dev Anand"},
            timeout=30
        )
        session_id = start_res.json()["session_id"]

        res = client.get(f"{GURU_BASE}/session/{session_id}")
        body = res.json()
        required = ["session_id", "asset_id", "expert_name", "messages", "status"]
        for field in required:
            assert field in body, f"Missing session field: {field}"

    def test_get_nonexistent_session_returns_404(self, client):
        res = client.get(f"{GURU_BASE}/session/nonexistent-uuid-999")
        assert res.status_code == 404
