
from pydantic import BaseModel


class QueryRequest(BaseModel):
    query: str
    max_results: int = 5
    asset_id: str | None = None  # Force-scope to one asset if provided


class Citation(BaseModel):
    source_document: str
    source_page: int | None = None
    source_section: str | None = None
    item_id: str


class QueryResponse(BaseModel):
    answer: str
    asset_ids_used: list[str]
    citations: list[Citation]
    thread_items_retrieved: int
    response_time_ms: int
