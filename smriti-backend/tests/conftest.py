"""pytest fixtures for SMRITI backend tests."""
import pytest
from fastapi.testclient import TestClient


@pytest.fixture(scope="session")
def client():
    """FastAPI TestClient with in-memory ChromaDB and SQLite."""
    import os
    os.environ["OPENROUTER_API_KEY"] = "sk-or-test-key"
    os.environ["CHROMA_PERSIST_DIR"] = ":memory:"
    os.environ["ANALYTICS_DB_PATH"] = ":memory:"

    from app.main import app
    with TestClient(app) as c:
        yield c


@pytest.fixture
def mock_llm(monkeypatch):
    """Mock LLMClient to avoid real API calls in tests."""
    async def fake_query(self, system_prompt, user_message, **kwargs):
        return '{"answer": "Test answer", "citations": []}'

    async def fake_extract(self, system_prompt, user_message, **kwargs):
        return '{"tags": ["UPS-01"], "content": "Test content"}'

    from app.services.llm import client as llm_module
    monkeypatch.setattr(llm_module.LLMClient, "query", fake_query)
    monkeypatch.setattr(llm_module.LLMClient, "extract", fake_extract)
