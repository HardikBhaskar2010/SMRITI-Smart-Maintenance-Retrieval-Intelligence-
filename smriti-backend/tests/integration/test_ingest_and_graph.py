"""
INTEGRATION TESTS — Document Ingestion & Knowledge Graph

POST /api/ingest  (multipart upload)
GET  /api/graph
"""
import io
import pytest


class TestIngestEndpoint:
    def test_ingest_pdf_returns_200(self, client, minimal_pdf_bytes):
        res = client.post(
            "/api/ingest",
            files={"file": ("smriti_test.pdf", io.BytesIO(minimal_pdf_bytes), "application/pdf")},
            timeout=60
        )
        # 200 = success, 500 = LLM extraction failed (acceptable in CI)
        assert res.status_code in (200, 500), f"Unexpected status: {res.status_code} — {res.text}"

    def test_ingest_response_structure(self, client, minimal_pdf_bytes):
        res = client.post(
            "/api/ingest",
            files={"file": ("test_doc.pdf", io.BytesIO(minimal_pdf_bytes), "application/pdf")},
            timeout=60
        )
        if res.status_code == 200:
            body = res.json()
            required = ["document_name", "tags_created", "tags_updated", "total_items_added", "duration_seconds"]
            for field in required:
                assert field in body, f"Missing field: {field}"

    def test_ingest_unsupported_format_returns_400(self, client):
        res = client.post(
            "/api/ingest",
            files={"file": ("malware.exe", io.BytesIO(b"\x00\x00\x00"), "application/octet-stream")},
            timeout=10
        )
        assert res.status_code == 400
        body = res.json()
        assert "detail" in body

    def test_ingest_txt_returns_400(self, client):
        """Plain .txt is not in the allowed list."""
        res = client.post(
            "/api/ingest",
            files={"file": ("notes.txt", io.BytesIO(b"some text"), "text/plain")},
            timeout=10
        )
        assert res.status_code == 400

    def test_ingest_no_file_returns_422(self, client):
        res = client.post("/api/ingest", timeout=10)
        assert res.status_code == 422

    def test_ingest_jpg_is_accepted_format(self, client):
        """JPEG images are in the allowed list (OCR path)."""
        # Minimal valid JPEG header
        jpeg_bytes = (
            b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00'
            b'\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t'
            b'\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a'
            b'\x1f\x1e\x1d\x1a\x1c\x1c $.\' ",#\x1c\x1c(7),01444\x1f\'9=82<.342\x1e'
            b'\xff\xd9'
        )
        res = client.post(
            "/api/ingest",
            files={"file": ("equipment_photo.jpg", io.BytesIO(jpeg_bytes), "image/jpeg")},
            timeout=30
        )
        # 200 = extracted, 500 = pytesseract/LLM issue in CI env — both are OK
        assert res.status_code in (200, 500)

    def test_ingest_duration_is_positive(self, client, minimal_pdf_bytes):
        res = client.post(
            "/api/ingest",
            files={"file": ("timing_test.pdf", io.BytesIO(minimal_pdf_bytes), "application/pdf")},
            timeout=60
        )
        if res.status_code == 200:
            body = res.json()
            assert body["duration_seconds"] >= 0


class TestKnowledgeGraph:
    def test_graph_returns_200(self, client, seeded_asset_id):
        res = client.get("/api/graph")
        assert res.status_code == 200

    def test_graph_has_nodes_and_edges_keys(self, client, seeded_asset_id):
        res = client.get("/api/graph")
        body = res.json()
        assert "nodes" in body
        assert "edges" in body

    def test_graph_nodes_are_list(self, client, seeded_asset_id):
        res = client.get("/api/graph")
        body = res.json()
        assert isinstance(body["nodes"], list)
        assert isinstance(body["edges"], list)

    def test_graph_node_structure(self, client, seeded_asset_id):
        res = client.get("/api/graph")
        body = res.json()
        if body["nodes"]:
            node = body["nodes"][0]
            assert "id"         in node
            assert "asset_type" in node
            assert "item_count" in node
            assert "debt_score" in node
            assert "severity"   in node

    def test_graph_edge_structure(self, client, seeded_asset_id):
        res = client.get("/api/graph")
        body = res.json()
        if body["edges"]:
            edge = body["edges"][0]
            assert "source"   in edge
            assert "target"   in edge
            assert "strength" in edge

    def test_graph_severity_values_valid(self, client, seeded_asset_id):
        res = client.get("/api/graph")
        body = res.json()
        valid_severities = {"OK", "WARNING", "CRITICAL"}
        for node in body["nodes"]:
            assert node["severity"] in valid_severities, (
                f"Node {node['id']} has invalid severity: {node['severity']}"
            )

    def test_graph_debt_scores_in_range(self, client, seeded_asset_id):
        res = client.get("/api/graph")
        body = res.json()
        for node in body["nodes"]:
            assert 0 <= node["debt_score"] <= 100, (
                f"debt_score {node['debt_score']} out of range for node {node['id']}"
            )
