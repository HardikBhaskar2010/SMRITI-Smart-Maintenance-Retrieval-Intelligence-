from pydantic import BaseModel
from typing import Optional


class QueryRequest(BaseModel):
    query: str
    max_results: int = 5
    asset_id: Optional[str] = None  # Force-scope to one asset if provided


class Citation(BaseModel):
    source_document: str
    source_page: Optional[int] = None
    source_section: Optional[str] = None
    item_id: str


class QueryResponse(BaseModel):
    answer: str
    asset_ids_used: list[str]
    citations: list[Citation]
    thread_items_retrieved: int
    response_time_ms: int
