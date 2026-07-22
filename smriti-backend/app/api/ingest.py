"""
REST POST /api/ingest — non-WebSocket fallback for ingestion.
Used when WebSocket is not available (e.g., curl testing).
"""
import shutil
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.config import settings
from app.services.ingestion.pipeline import run_ingestion

router = APIRouter()


@router.post("/ingest")
async def ingest_document(file: UploadFile = File(...)):
    allowed = {".pdf", ".docx", ".png", ".jpg", ".jpeg", ".tiff"}
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {suffix}. Allowed: {', '.join(allowed)}"
        )

    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    save_path = upload_dir / file.filename

    with save_path.open("wb") as f:
        shutil.copyfileobj(file.file, f)

    try:
        result = await run_ingestion(
            file_path=save_path,
            document_name=file.filename,
        )
        return result.model_dump()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Clean up uploaded file after processing
        if save_path.exists():
            save_path.unlink()
