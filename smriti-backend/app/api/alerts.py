"""Alerts API — REST endpoints + WebSocket push."""
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query

from app.db.analytics_store import get_alerts, mark_alerts_read
from app.services.alerts.monitor import register_ws, unregister_ws

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/alerts")
def list_alerts(unread_only: bool = Query(default=False), limit: int = Query(default=50)):
    """Return recent alerts."""
    alerts = get_alerts(unread_only=unread_only, limit=limit)
    return {
        "alerts": alerts,
        "total": len(alerts),
        "unread_count": sum(1 for a in alerts if not a["is_read"]),
    }


@router.post("/alerts/read")
def mark_read(alert_ids: list[int]):
    """Mark specified alerts as read."""
    mark_alerts_read(alert_ids)
    return {"marked": len(alert_ids)}


@router.websocket("/ws/alerts")
async def alerts_ws(websocket: WebSocket):
    """WebSocket endpoint — push alerts to connected clients."""
    await websocket.accept()
    register_ws(websocket)
    logger.info("Alert WebSocket client connected")
    try:
        # Keep connection alive — client sends heartbeat pings
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        unregister_ws(websocket)
        logger.info("Alert WebSocket client disconnected")
