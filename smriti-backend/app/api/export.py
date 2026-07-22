"""Export API — PDF and Excel download endpoints."""
import logging
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from app.services.export.pdf_excel_generator import generate_asset_pdf, generate_asset_excel
from app.services.debt.scorer import recalculate_debt
from app.db.chroma import get_chroma
from app.utils.tag_normalizer import normalize_asset_id

router = APIRouter()
logger = logging.getLogger(__name__)


async def _get_asset_and_items(asset_id: str) -> tuple[dict, list]:
    """Helper: fetch debt data + thread items from ChromaDB."""
    chroma = get_chroma()
    col_name = normalize_asset_id(asset_id)
    try:
        col = chroma.get_collection(col_name)
    except Exception:
        raise HTTPException(status_code=404, detail=f"Asset '{asset_id}' not found")

    result = await recalculate_debt(asset_id)
    result["asset_type"] = (col.metadata or {}).get("asset_type", "UNKNOWN")

    raw = col.get(include=["documents", "metadatas", "ids"])
    items = []
    for item_id, doc, meta in zip(
        raw.get("ids") or [],
        raw.get("documents") or [],
        raw.get("metadatas") or [],
    ):
        items.append({
            "id": item_id,
            "content": doc,
            **(meta or {}),
        })
    items.sort(key=lambda x: x.get("added_at", ""), reverse=True)
    return result, items


@router.get("/export/asset/{asset_id}/pdf")
async def export_pdf(asset_id: str):
    """Download a PDF Knowledge Debt Report for an asset."""
    try:
        asset_data, items = await _get_asset_and_items(asset_id)
        pdf_bytes = generate_asset_pdf(asset_id, asset_data, items)
        filename = f"smriti_report_{asset_id.replace(' ', '_')}.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("PDF export failed for %s: %s", asset_id, e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/export/asset/{asset_id}/excel")
async def export_excel(asset_id: str):
    """Download an Excel workbook for an asset."""
    try:
        asset_data, items = await _get_asset_and_items(asset_id)
        excel_bytes = generate_asset_excel(asset_id, asset_data, items)
        filename = f"smriti_{asset_id.replace(' ', '_')}.xlsx"
        return Response(
            content=excel_bytes,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Excel export failed for %s: %s", asset_id, e)
        raise HTTPException(status_code=500, detail=str(e))
