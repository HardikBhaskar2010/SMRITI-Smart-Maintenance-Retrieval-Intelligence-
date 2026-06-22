"""RAG retriever — semantic search within a single asset's ChromaDB thread."""
import logging
from app.db.chroma import get_chroma
from app.utils.tag_normalizer import normalize_asset_id

logger = logging.getLogger(__name__)


async def retrieve_thread_context(
    asset_id: str,
    query: str,
    max_items: int = 5,
) -> dict | None:
    """
    Semantic search within the asset's dedicated ChromaDB collection.
    Returns None if the asset has no thread yet.
    """
    chroma = get_chroma()
    col_name = normalize_asset_id(asset_id)

    try:
        collection = chroma.get_collection(col_name)
    except Exception:
        logger.debug("No thread found for asset: %s", asset_id)
        return None

    count = collection.count()
    if count == 0:
        return None

    results = collection.query(
        query_texts=[query],
        n_results=min(max_items, count),
        include=["documents", "metadatas", "distances"],
    )

    items = []
    docs      = results.get("documents", [[]])[0]
    metas     = results.get("metadatas", [[]])[0]
    distances = results.get("distances", [[]])[0]
    ids       = results.get("ids", [[]])[0]

    for i, (doc, meta, dist, item_id) in enumerate(zip(docs, metas, distances, ids)):
        items.append({
            "content":          doc,
            "source_document":  meta.get("source_document", "Unknown"),
            "source_page":      meta.get("source_page", 0),
            "source_section":   meta.get("source_section", ""),
            "added_at":         meta.get("added_at", ""),
            "item_id":          item_id,
            "similarity_score": round(1 - dist, 3),
        })

    return {
        "asset_id":         asset_id,
        "items":            items,
        "total_thread_size": count,
    }
