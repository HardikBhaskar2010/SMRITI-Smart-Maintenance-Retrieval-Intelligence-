"""GET /api/assets  · GET /api/assets/{asset_id}"""
import logging
from fastapi import APIRouter, HTTPException
from app.db.chroma import get_chroma
from app.services.debt.scorer import recalculate_debt
from app.utils.tag_normalizer import display_asset_id

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/assets")
async def list_assets():
    chroma = get_chroma()
    try:
        collections = chroma.list_collections()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    results = []
    for col_info in collections:
        col_name = col_info.name
        if not col_name.startswith("asset__"):
            continue
        try:
            col = chroma.get_collection(col_name)
            meta = col.metadata or {}
            asset_id = meta.get("asset_id", display_asset_id(col_name))
            asset_type = meta.get("asset_type", "UNKNOWN")

            # Pull all metadata to count experts
            all_items = col.get(include=["metadatas"])
            metas = all_items.get("metadatas") or []
            experts = {m.get("expert_name", "") for m in metas if m.get("expert_attributed")}
            experts.discard("")
            timestamps = [m.get("added_at", "") for m in metas if m.get("added_at")]
            last_updated = max(timestamps) if timestamps else ""

            debt = await recalculate_debt(asset_id)

            results.append({
                "asset_id":    asset_id,
                "asset_type":  asset_type,
                "display_name": asset_id,
                "debt_score":  debt.get("score", 0),
                "severity":    debt.get("severity", "UNKNOWN"),
                "item_count":  col.count(),
                "expert_count": max(1, len(experts)),
                "last_updated": last_updated,
                "breakdown":   debt.get("breakdown", {}),
            })
        except Exception as e:
            logger.warning("Failed to load collection %s: %s", col_name, e)

    # Sort by debt_score descending (CRITICAL first)
    results.sort(key=lambda x: x["debt_score"], reverse=True)
    return results


@router.get("/assets/{asset_id}")
async def get_asset(asset_id: str):
    chroma = get_chroma()
    from app.utils.tag_normalizer import normalize_asset_id
    col_name = normalize_asset_id(asset_id)
    try:
        col = chroma.get_collection(col_name)
    except Exception:
        raise HTTPException(status_code=404, detail=f"Asset {asset_id} not found")

    all_items = col.get(include=["documents", "metadatas"])
    items = []
    for doc, meta, item_id in zip(
        all_items.get("documents") or [],
        all_items.get("metadatas") or [],
        all_items.get("ids") or [],
    ):
        items.append({
            "id":              item_id,
            "content":         doc,
            "source_document": meta.get("source_document", ""),
            "source_page":     meta.get("source_page", 0),
            "source_section":  meta.get("source_section", ""),
            "added_by":        meta.get("added_by", "ingestion_pipeline"),
            "added_at":        meta.get("added_at", ""),
            "expert_attributed": meta.get("expert_attributed", False),
        })

    items.sort(key=lambda x: x["added_at"], reverse=True)
    debt = await recalculate_debt(asset_id)

    return {
        "asset_id":    asset_id,
        "item_count":  len(items),
        "debt_score":  debt.get("score", 0),
        "severity":    debt.get("severity", "UNKNOWN"),
        "breakdown":   debt.get("breakdown", {}),
        "thread_items": items,
    }
