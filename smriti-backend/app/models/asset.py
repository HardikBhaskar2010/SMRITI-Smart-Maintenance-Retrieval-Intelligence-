import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class ThreadItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    content: str
    source_document: str
    source_page: int | None = None
    source_section: str | None = None
    added_by: Literal["ingestion_pipeline", "guru_mode", "manual"] = "ingestion_pipeline"
    added_at: datetime = Field(default_factory=datetime.utcnow)
    embedding_model: str = "chromadb-default"
    expert_attributed: bool = False
    content_hash: str = ""


class KnowledgeDebt(BaseModel):
    score: int = Field(ge=0, le=100)
    severity: Literal["OK", "WARNING", "CRITICAL"]
    document_coverage: float = Field(ge=0.0, le=1.0)
    expert_count: int = Field(ge=0)
    recency_days: int = 0
    operational_criticality: float = Field(default=0.5, ge=0.0, le=1.0)
    last_updated: datetime = Field(default_factory=datetime.utcnow)


class AssetThread(BaseModel):
    asset_id: str
    asset_type: str
    display_name: str = ""
    thread_items: list[ThreadItem] = []
    knowledge_debt: KnowledgeDebt
    experts: list[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_updated: datetime = Field(default_factory=datetime.utcnow)


class AssetSummary(BaseModel):
    """Lightweight version for list endpoints."""
    asset_id: str
    asset_type: str
    display_name: str
    debt_score: int
    severity: Literal["OK", "WARNING", "CRITICAL"]
    item_count: int
    expert_count: int
    last_updated: str
