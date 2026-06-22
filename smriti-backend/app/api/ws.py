"""
WebSocket /ws/ingest — real-time ingestion progress feed.
Streams IngestProgress events as JSON lines to the connected frontend.
"""
import json
import logging
import shutil
from pathlib import Path

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.config import settings
from app.models.ingest import IngestProgress
from app.services.ingestion.pipeline import run_ingestion

router = APIRouter()
logger = logging.getLogger(__name__)


@router.websocket("/ws/ingest")
async def ingest_ws(websocket: WebSocket):
    await websocket.accept()
    save_path: Path | None = None

    try:
        # First message: JSON with filename and file bytes (base64)
        init_data = await websocket.receive_json()
        filename = init_data.get("filename", "upload.pdf")
        file_b64 = init_data.get("file_data", "")

        import base64
        file_bytes = base64.b64decode(file_b64)

        upload_dir = Path(settings.UPLOAD_DIR)
        upload_dir.mkdir(parents=True, exist_ok=True)
        save_path = upload_dir / filename
        save_path.write_bytes(file_bytes)

        async def progress_callback(progress: IngestProgress):
            try:
                await websocket.send_json(progress.model_dump())
            except Exception:
                pass

        result = await run_ingestion(
            file_path=save_path,
            document_name=filename,
            progress_callback=progress_callback,
        )

        await websocket.send_json({"type": "result", **result.model_dump()})
        await websocket.close(code=1000)

    except WebSocketDisconnect:
        logger.info("WebSocket ingest: client disconnected")
    except Exception as e:
        logger.error("WebSocket ingest error: %s", e, exc_info=True)
        try:
            await websocket.send_json({
                "stage": "error",
                "document_name": "",
                "error": str(e),
            })
            await websocket.close(code=1011)
        except Exception:
            pass
    finally:
        if save_path and save_path.exists():
            save_path.unlink()
