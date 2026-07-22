"""
Full document ingestion pipeline orchestration.
Coordinates: extract text → tag with LLM → embed in ChromaDB → update graph → score debt.
"""
import asyncio
import logging
import time
import uuid
from collections.abc import Awaitable, Callable
from datetime import UTC, datetime
from pathlib import Path
from typing import Optional

from app.db.chroma import get_chroma
from app.db.graph import get_graph
from app.models.ingest import IngestProgress, IngestResult
from app.services.ingestion.extractor import extract_text
from app.services.ingestion.tag_extractor import extract_equipment_tags
from app.services.llm.client import LLMClient
from app.utils.hash import content_hash
from app.utils.tag_normalizer import normalize_asset_id

logger = logging.getLogger(__name__)

ProgressCallback = Optional[Callable[[IngestProgress], Awaitable[None]]]


async def run_ingestion(
    file_path: Path,
    document_name: str,
    progress_callback: ProgressCallback = None,
) -> IngestResult:
    start = time.time()
    llm = LLMClient()
    chroma = get_chroma()
    graph = get_graph()

    # ── Stage 1: Extract text ─────────────────────────────────────────
    await _emit(progress_callback, IngestProgress(
        stage="extracting", document_name=document_name
    ))
    pages = await asyncio.to_thread(extract_text, file_path)
    logger.info("Extracted %d pages from %s", len(pages), document_name)

    # ── Stage 2: Tag extraction via LLM ──────────────────────────────
    await _emit(progress_callback, IngestProgress(
        stage="tagging",
        document_name=document_name,
        total_pages=len(pages),
    ))
    tagged_chunks = await extract_equipment_tags(llm, pages, document_name)
    found_tags = list({c["asset_id"] for c in tagged_chunks})
    logger.info("Found %d chunks across %d asset tags", len(tagged_chunks), len(found_tags))

    # ── Stage 3: Embed into ChromaDB ─────────────────────────────────
    await _emit(progress_callback, IngestProgress(
        stage="embedding",
        document_name=document_name,
        total_pages=len(pages),
        tags_found=found_tags,
    ))

    tags_created: set[str] = set()
    tags_updated: set[str] = set()
    items_added = 0
    items_skipped = 0

    for chunk in tagged_chunks:
        asset_id = chunk["asset_id"]
        collection_name = normalize_asset_id(asset_id)
        chunk_hash = content_hash(chunk["content"])

        collection = chroma.get_or_create_collection(
            name=collection_name,
            metadata={
                "asset_id": asset_id,
                "asset_type": chunk.get("asset_type", "UNKNOWN"),
            },
        )

        # Deduplication: skip if hash already exists
        existing = collection.get(where={"content_hash": chunk_hash})
        if existing and existing.get("ids"):
            items_skipped += 1
            continue

        item_id = str(uuid.uuid4())
        collection.add(
            ids=[item_id],
            documents=[chunk["content"]],
            metadatas=[{
                "asset_id": asset_id,
                "asset_type": chunk.get("asset_type", "UNKNOWN"),
                "source_document": document_name,
                "source_page": chunk.get("source_page", 0),
                "source_section": chunk.get("source_section", ""),
                "added_by": "ingestion_pipeline",
                "added_at": datetime.now(UTC).isoformat(),
                "expert_attributed": False,
                "content_hash": chunk_hash,
            }],
        )
        items_added += 1

        if collection.count() <= 1:
            tags_created.add(asset_id)
        else:
            tags_updated.add(asset_id)

        # Update knowledge graph
        if not graph.has_node(asset_id):
            graph.add_node(
                asset_id,
                item_count=1,
                asset_type=chunk.get("asset_type", "UNKNOWN"),
            )
        else:
            graph.nodes[asset_id]["item_count"] = graph.nodes[asset_id].get("item_count", 0) + 1

        await _emit(progress_callback, IngestProgress(
            stage="embedding",
            document_name=document_name,
            total_pages=len(pages),
            tags_found=found_tags,
            items_embedded=items_added,
        ))

    # ── Stage 4: Recalculate debt scores ─────────────────────────────
    all_touched = tags_created | tags_updated
    from app.services.debt.scorer import recalculate_debt
    for asset_id in all_touched:
        await recalculate_debt(asset_id)

    await _emit(progress_callback, IngestProgress(
        stage="done",
        document_name=document_name,
        tags_found=found_tags,
        items_embedded=items_added,
    ))

    return IngestResult(
        document_name=document_name,
        tags_created=list(tags_created),
        tags_updated=list(tags_updated - tags_created),
        total_items_added=items_added,
        duration_seconds=round(time.time() - start, 2),
        duplicate_items_skipped=items_skipped,
    )


async def _emit(callback: ProgressCallback, progress: IngestProgress) -> None:
    if callback:
        await callback(progress)
