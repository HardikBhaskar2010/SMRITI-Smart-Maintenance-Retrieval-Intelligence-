"""
Asset-Thread RAG query engine.
Identifies asset IDs in the query, retrieves their threads, synthesizes via LLM.
"""
import json
import logging
import re
import time

from app.models.query import Citation, QueryRequest, QueryResponse
from app.prompts import QUERY_SYNTHESIS_SYSTEM, build_query_prompt
from app.services.llm.client import LLMClient
from app.services.rag.retriever import retrieve_thread_context

logger = logging.getLogger(__name__)

# Pattern: UPS-01, T-101, P-207, HV-03, DG-01, ACB-12, CB-05, AHU-03
ASSET_ID_PATTERN = re.compile(
    r"\b([A-Z]{1,5}[-\s]?\d{2,4}[A-Z]?)\b", re.IGNORECASE
)


async def run_query(request: QueryRequest) -> QueryResponse:
    start_ms = int(time.time() * 1000)
    llm = LLMClient()

    # ── Step 1: Identify asset IDs in query ──────────────────────────
    if request.asset_id:
        asset_ids = [request.asset_id]
    else:
        matches = ASSET_ID_PATTERN.findall(request.query)
        asset_ids = list({m.upper() for m in matches}) if matches else []

    if not asset_ids:
        # No specific asset — cross-asset semantic search
        asset_ids = await _find_relevant_assets(request.query)

    # ── Step 2: Retrieve thread context ──────────────────────────────
    thread_contexts = []
    for asset_id in asset_ids:
        ctx = await retrieve_thread_context(
            asset_id=asset_id,
            query=request.query,
            max_items=request.max_results,
        )
        if ctx:
            thread_contexts.append(ctx)

    if not thread_contexts:
        return QueryResponse(
            answer=(
                "No asset threads found matching your query. "
                "Please check the asset ID or upload relevant documents first."
            ),
            asset_ids_used=[],
            citations=[],
            thread_items_retrieved=0,
            response_time_ms=int(time.time() * 1000) - start_ms,
        )

    # ── Step 3: Synthesize answer via LLM (Llama 3.3 70B — Hinglish) ─
    context_text = _format_context(thread_contexts)
    raw_response = await llm.query(
        system_prompt=QUERY_SYNTHESIS_SYSTEM,
        user_message=build_query_prompt(request.query, context_text),
        max_tokens=4096,
    )

    try:
        # Strip possible markdown fences
        clean = raw_response.strip()
        if clean.startswith("```"):
            clean = clean.split("```")[1]
            if clean.startswith("json"):
                clean = clean[4:]
            clean = clean.strip()

        parsed = json.loads(clean)
        answer = parsed.get("answer", raw_response)
        raw_citations = parsed.get("citations", [])
    except (json.JSONDecodeError, KeyError):
        logger.warning("Query response was not valid JSON — returning raw text")
        answer = raw_response
        raw_citations = []

    citations = []
    for c in raw_citations:
        try:
            citations.append(Citation(
                source_document=c.get("source_document", ""),
                source_page=c.get("source_page"),
                source_section=c.get("source_section"),
                item_id=c.get("item_id", ""),
            ))
        except Exception:
            pass

    return QueryResponse(
        answer=answer,
        asset_ids_used=[ctx["asset_id"] for ctx in thread_contexts],
        citations=citations,
        thread_items_retrieved=sum(len(ctx["items"]) for ctx in thread_contexts),
        response_time_ms=int(time.time() * 1000) - start_ms,
    )


def _format_context(thread_contexts: list[dict]) -> str:
    parts = []
    for ctx in thread_contexts:
        parts.append(f"=== ASSET: {ctx['asset_id']} ===")
        for i, item in enumerate(ctx["items"]):
            parts.append(
                f"[{i + 1}] item_id={item['item_id']}\n"
                f"Source: {item['source_document']} (p.{item['source_page']})\n"
                f"Section: {item.get('source_section', 'N/A')}\n"
                f"Date: {item.get('added_at', 'Unknown')}\n"
                f"Content: {item['content']}"
            )
    return "\n\n".join(parts)


async def _find_relevant_assets(query: str) -> list[str]:
    """Cross-asset search when no specific ID is in the query."""
    from app.db.chroma import get_chroma
    chroma = get_chroma()
    try:
        all_collections = chroma.list_collections()
    except Exception:
        return []

    results = []
    for col_info in all_collections[:10]:
        try:
            col = chroma.get_collection(col_info.name)
            if col.count() == 0:
                continue
            res = col.query(query_texts=[query], n_results=1)
            distances = (res.get("distances") or [[]])[0]
            if distances and distances[0] < 0.6:
                asset_id = (col.metadata or {}).get("asset_id", col_info.name)
                results.append((distances[0], asset_id))
        except Exception:
            continue

    results.sort(key=lambda x: x[0])
    return [r[1] for r in results[:3]]
