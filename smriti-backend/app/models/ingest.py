from pydantic import BaseModel
from typing import Optional


class IngestProgress(BaseModel):
    """Sent over WebSocket during ingestion."""
    stage: str  # "extracting" | "tagging" | "embedding" | "done" | "error"
    document_name: str
    pages_processed: int = 0
    total_pages: int = 0
    tags_found: list[str] = []
    items_embedded: int = 0
    error: Optional[str] = None


class IngestResult(BaseModel):
    document_name: str
    tags_created: list[str]
    tags_updated: list[str]
    total_items_added: int
    duration_seconds: float
    duplicate_items_skipped: int
