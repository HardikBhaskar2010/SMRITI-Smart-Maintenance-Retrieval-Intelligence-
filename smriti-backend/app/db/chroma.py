
import chromadb
from chromadb.config import Settings

_client: chromadb.PersistentClient | None = None


def init_chroma(persist_dir: str) -> None:
    global _client
    _client = chromadb.PersistentClient(
        path=persist_dir,
        settings=Settings(anonymized_telemetry=False),
    )


def get_chroma() -> chromadb.PersistentClient:
    if _client is None:
        raise RuntimeError("ChromaDB not initialized — call init_chroma() first")
    return _client
