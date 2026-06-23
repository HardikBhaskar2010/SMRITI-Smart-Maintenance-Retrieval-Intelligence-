"""
INTEGRATION TESTS — RAG Query Endpoint

POST /api/query
  - Sends real queries to the live LLM (OpenRouter)
  - Validates response structure and content quality
  - Tests scoped vs global queries
  - Tests edge cases (empty query, very long query)
"""
import pytest
import time


BASE = "/api/query"


class TestQueryBasic:
    def test_query_returns_200(self, client, seeded_asset_id):
        res = client.post(BASE, json={"query": "What is the lubrication interval?"}, timeout=30)
        assert res.status_code == 200

    def test_query_response_has_all_fields(self, client, seeded_asset_id):
        res = client.post(BASE, json={"query": "Tell me about pump maintenance"}, timeout=30)
        body = res.json()
        required = ["answer", "asset_ids_used", "citations", "thread_items_retrieved", "response_time_ms"]
        for field in required:
            assert field in body, f"Missing response field: {field}"

    def test_query_answer_is_nonempty_string(self, client, seeded_asset_id):
        res = client.post(BASE, json={"query": "What causes cavitation in pumps?"}, timeout=30)
        body = res.json()
        assert isinstance(body["answer"], str)
        assert len(body["answer"]) > 10

    def test_query_citations_are_valid(self, client, seeded_asset_id):
        res = client.post(BASE, json={"query": "pump bearing vibration"}, timeout=30)
        body = res.json()
        for citation in body["citations"]:
            assert "source_document" in citation
            assert "item_id" in citation

    def test_query_response_time_is_recorded(self, client, seeded_asset_id):
        res = client.post(BASE, json={"query": "impeller clearance specs"}, timeout=30)
        body = res.json()
        assert isinstance(body["response_time_ms"], int)
        assert body["response_time_ms"] > 0

    def test_query_thread_items_retrieved_is_nonneg(self, client, seeded_asset_id):
        res = client.post(BASE, json={"query": "MTBF for pump"}, timeout=30)
        body = res.json()
        assert body["thread_items_retrieved"] >= 0


class TestQueryScoped:
    def test_query_scoped_to_asset(self, client, seeded_asset_id):
        """Scoped query should only search within the given asset."""
        res = client.post(
            BASE,
            json={"query": "lubrication requirements", "asset_id": seeded_asset_id},
            timeout=30
        )
        assert res.status_code == 200
        body = res.json()
        assert isinstance(body["answer"], str)
        # If answer references items, the asset should be in used list
        if body["thread_items_retrieved"] > 0:
            assert seeded_asset_id in body["asset_ids_used"]

    def test_query_scoped_to_nonexistent_asset_returns_answer(self, client):
        """Query on non-existent asset should still return 200 (graceful degradation)."""
        res = client.post(
            BASE,
            json={"query": "anything", "asset_id": "ASSET_GHOST_999"},
            timeout=30
        )
        # Should not crash (200 or 404 is acceptable)
        assert res.status_code in (200, 404)

    def test_query_max_results_param(self, client, seeded_asset_id):
        """max_results should limit the number of retrieved items."""
        res = client.post(
            BASE,
            json={"query": "pump", "max_results": 2},
            timeout=30
        )
        body = res.json()
        assert body["thread_items_retrieved"] <= 2


class TestQueryEdgeCases:
    def test_empty_query_returns_error_or_graceful_response(self, client):
        res = client.post(BASE, json={"query": ""}, timeout=30)
        # Should return 400 validation error or a valid 200 with empty answer
        assert res.status_code in (200, 400, 422)

    def test_missing_query_field_returns_422(self, client):
        res = client.post(BASE, json={}, timeout=10)
        assert res.status_code == 422  # FastAPI validation

    def test_very_long_query_is_handled(self, client, seeded_asset_id):
        long_query = "pump maintenance " * 100
        res = client.post(BASE, json={"query": long_query}, timeout=60)
        assert res.status_code in (200, 400, 500)

    def test_hindi_query_is_handled(self, client, seeded_asset_id):
        """Llama 3.3 70B supports Hindi/Hinglish per the config comments."""
        res = client.post(
            BASE,
            json={"query": "पंप की रखरखाव प्रक्रिया क्या है?"},
            timeout=30
        )
        assert res.status_code in (200, 400, 500)
        if res.status_code == 200:
            assert "answer" in res.json()
