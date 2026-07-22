"""
INTEGRATION TESTS — Health & Asset Endpoints

Tests:
  GET /health
  GET /api/assets
  GET /api/assets/{asset_id}
  GET /api/assets/{asset_id}  → 404 for unknown asset
"""
import pytest


class TestHealth:
    def test_health_returns_ok(self, client):
        res = client.get("/health")
        assert res.status_code == 200
        body = res.json()
        assert body["status"] == "ok"
        assert body["service"] == "smriti-api"
        assert "version" in body

    def test_health_content_type_is_json(self, client):
        res = client.get("/health")
        assert "application/json" in res.headers.get("content-type", "")


class TestAssetList:
    def test_assets_returns_200(self, client, seeded_asset_id):
        res = client.get("/api/assets")
        assert res.status_code == 200

    def test_assets_returns_list(self, client, seeded_asset_id):
        res = client.get("/api/assets")
        body = res.json()
        assert isinstance(body, list)

    def test_seeded_asset_appears_in_list(self, client, seeded_asset_id):
        res = client.get("/api/assets")
        body = res.json()
        asset_ids = [a["asset_id"] for a in body]
        assert seeded_asset_id in asset_ids

    def test_asset_summary_has_required_fields(self, client, seeded_asset_id):
        res = client.get("/api/assets")
        body = res.json()
        asset = next((a for a in body if a["asset_id"] == seeded_asset_id), None)
        assert asset is not None, "Seeded asset not found in list"

        required = ["asset_id", "asset_type", "display_name", "debt_score", "severity", "item_count", "expert_count"]
        for field in required:
            assert field in asset, f"Missing field: {field}"

    def test_asset_debt_score_in_range(self, client, seeded_asset_id):
        res = client.get("/api/assets")
        body = res.json()
        asset = next((a for a in body if a["asset_id"] == seeded_asset_id), None)
        assert asset is not None
        assert 0 <= asset["debt_score"] <= 100

    def test_asset_severity_valid(self, client, seeded_asset_id):
        res = client.get("/api/assets")
        body = res.json()
        asset = next((a for a in body if a["asset_id"] == seeded_asset_id), None)
        assert asset["severity"] in ("OK", "WARNING", "CRITICAL")

    def test_assets_sorted_by_debt_score_desc(self, client, seeded_asset_id):
        res = client.get("/api/assets")
        body = res.json()
        if len(body) < 2:
            pytest.skip("Need at least 2 assets to test sort order")
        scores = [a["debt_score"] for a in body]
        assert scores == sorted(scores, reverse=True), "Assets not sorted by debt_score descending"


class TestAssetDetail:
    def test_asset_detail_returns_200(self, client, seeded_asset_id):
        res = client.get(f"/api/assets/{seeded_asset_id}")
        assert res.status_code == 200

    def test_asset_detail_has_thread_items(self, client, seeded_asset_id):
        res = client.get(f"/api/assets/{seeded_asset_id}")
        body = res.json()
        assert "thread_items" in body
        assert isinstance(body["thread_items"], list)
        assert len(body["thread_items"]) == 5  # We seeded 5 items

    def test_asset_detail_item_structure(self, client, seeded_asset_id):
        res = client.get(f"/api/assets/{seeded_asset_id}")
        body = res.json()
        item = body["thread_items"][0]
        required = ["id", "content", "source_document", "added_by", "added_at", "expert_attributed"]
        for field in required:
            assert field in item, f"Thread item missing: {field}"

    def test_asset_detail_debt_fields(self, client, seeded_asset_id):
        res = client.get(f"/api/assets/{seeded_asset_id}")
        body = res.json()
        assert "debt_score"  in body
        assert "severity"    in body
        assert "item_count"  in body
        assert body["item_count"] == len(body["thread_items"])

    def test_unknown_asset_returns_404(self, client):
        res = client.get("/api/assets/DOES_NOT_EXIST_98765")
        assert res.status_code == 404
        body = res.json()
        assert "detail" in body

    def test_asset_id_in_response_matches_request(self, client, seeded_asset_id):
        res = client.get(f"/api/assets/{seeded_asset_id}")
        body = res.json()
        assert body["asset_id"] == seeded_asset_id
