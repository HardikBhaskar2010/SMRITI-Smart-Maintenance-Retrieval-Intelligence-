"""
Shared pytest fixtures for SMRITI backend tests.
Merges Phase 2 (analytics DB, mock_llm) with remote branch's richer seeding fixtures.
"""
import os
import io
import tempfile
import shutil
import uuid
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

# ── Point all data dirs at temp dirs BEFORE importing the app ──────────
_tmp_root = tempfile.mkdtemp(prefix="smriti_test_")
os.environ.setdefault("OPENROUTER_API_KEY", "sk-or-test-placeholder")
os.environ["CHROMA_PERSIST_DIR"] = str(Path(_tmp_root) / "chroma")
os.environ["UPLOAD_DIR"]         = str(Path(_tmp_root) / "uploads")
os.environ["SESSION_DIR"]        = str(Path(_tmp_root) / "sessions")
os.environ["ANALYTICS_DB_PATH"]  = str(Path(_tmp_root) / "analytics.db")

# ── Safe to import the app now ─────────────────────────────────────────
from app.main import app  # noqa: E402


@pytest.fixture(scope="session")
def client():
    """FastAPI TestClient shared across the whole test session."""
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c


@pytest.fixture
def mock_llm(monkeypatch):
    """Mock LLMClient to avoid real API calls in unit tests."""
    async def fake_query(self, system_prompt, user_message, **kwargs):
        return '{"answer": "Test answer", "citations": []}'

    async def fake_extract(self, system_prompt, user_message, **kwargs):
        return '{"tags": ["UPS-01"], "content": "Test content"}'

    from app.services.llm import client as llm_module
    monkeypatch.setattr(llm_module.LLMClient, "query", fake_query)
    monkeypatch.setattr(llm_module.LLMClient, "extract", fake_extract)


@pytest.fixture(scope="session")
def seeded_asset_id(client):
    """
    Seeds a minimal asset collection into ChromaDB so integration tests
    have real data to query against. Returns the asset_id string.
    """
    from app.db.chroma import get_chroma
    from app.utils.tag_normalizer import normalize_asset_id
    from datetime import datetime

    asset_id = "PUMP-TEST-001"
    col_name = normalize_asset_id(asset_id)
    chroma   = get_chroma()

    try:
        col = chroma.get_collection(col_name)
    except Exception:
        col = chroma.create_collection(
            col_name,
            metadata={"asset_id": asset_id, "asset_type": "PUMP"},
        )

    documents = [
        "The centrifugal pump requires oil lubrication every 500 operating hours.",
        "Vibration levels above 4.5 mm/s indicate bearing failure risk.",
        "Impeller clearance must be maintained between 0.3 mm and 0.5 mm.",
        "Cavitation symptoms include noise and sudden pressure drops.",
        "MTBF for this pump model is 8,760 hours under standard conditions.",
    ]
    ids       = [str(uuid.uuid4()) for _ in documents]
    metadatas = [
        {
            "source_document": "pump_manual_v3.pdf",
            "source_page": i + 1,
            "source_section": f"Section {i + 1}",
            "added_by": "ingestion_pipeline",
            "added_at": datetime.utcnow().isoformat(),
            "expert_attributed": False,
        }
        for i in range(len(documents))
    ]
    embeddings = [[float(j % 10) / 10.0] * 384 for j in range(len(documents))]

    existing_ids = set(col.get()["ids"])
    new_idx = [i for i, eid in enumerate(ids) if eid not in existing_ids]
    if new_idx:
        col.add(
            ids       =[ids[i]       for i in new_idx],
            documents =[documents[i] for i in new_idx],
            metadatas =[metadatas[i] for i in new_idx],
            embeddings=[embeddings[i] for i in new_idx],
        )
    return asset_id


@pytest.fixture(scope="session")
def minimal_pdf_bytes():
    """Return raw bytes of a tiny valid PDF for upload tests."""
    pdf = (
        b"%PDF-1.4\n"
        b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
        b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
        b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792]\n"
        b"   /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n"
        b"4 0 obj\n<< /Length 44 >>\nstream\n"
        b"BT /F1 12 Tf 100 700 Td (SMRITI Test Document) Tj ET\n"
        b"endstream\nendobj\n"
        b"5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n"
        b"xref\n0 6\n0000000000 65535 f\n"
        b"0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n"
        b"0000000274 00000 n\n0000000370 00000 n\n"
        b"trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n461\n%%EOF\n"
    )
    return pdf


def pytest_sessionfinish(session, exitstatus):
    """Clean up the temp directory after the full test run."""
    shutil.rmtree(_tmp_root, ignore_errors=True)
