"""POST /api/query"""
from fastapi import APIRouter
from app.models.query import QueryRequest, QueryResponse
from app.services.rag.engine import run_query

router = APIRouter()


@router.post("/query", response_model=QueryResponse)
async def query_asset_thread(request: QueryRequest) -> QueryResponse:
    return await run_query(request)
