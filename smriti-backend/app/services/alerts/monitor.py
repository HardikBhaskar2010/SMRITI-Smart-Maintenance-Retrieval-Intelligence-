"""
Background alert monitor — polls debt scores every N seconds,
pushes WebSocket alerts to connected clients on threshold crossings.
"""
import asyncio
import logging
from datetime import UTC, datetime

from app.config import settings
from app.db.analytics_store import get_all_latest_snapshots, insert_alert
from app.services.analytics.flight_risk import detect_flight_risks
from app.services.analytics.trend_engine import snapshot_all_assets

logger = logging.getLogger(__name__)

# Global WebSocket connection pool — populated by ws/alerts endpoint
_alert_connections: set = set()

# Track last known severity per asset to detect crossings
_last_severity: dict[str, str] = {}


def register_ws(ws) -> None:
    _alert_connections.add(ws)


def unregister_ws(ws) -> None:
    _alert_connections.discard(ws)


async def _broadcast(payload: dict) -> None:
    dead = set()
    for ws in _alert_connections:
        try:
            await ws.send_json(payload)
        except Exception:
            dead.add(ws)
    for ws in dead:
        _alert_connections.discard(ws)


async def run_monitor() -> None:
    """Infinite monitoring loop. Run as a background asyncio task."""
    logger.info("Alert monitor started (interval=%ds)", settings.ALERT_POLL_INTERVAL_SECONDS)
    while True:
        try:
            await _check_cycle()
        except Exception as e:
            logger.error("Alert monitor cycle error: %s", e)
        await asyncio.sleep(settings.ALERT_POLL_INTERVAL_SECONDS)


async def _check_cycle() -> None:
    """One monitoring cycle: snapshot all assets, detect crossings."""
    await snapshot_all_assets()
    snapshots = get_all_latest_snapshots()

    for snap in snapshots:
        asset_id = snap["asset_id"]
        severity = snap["severity"]
        score = snap["score"]
        prev = _last_severity.get(asset_id)

        if prev and prev != "CRITICAL" and severity == "CRITICAL":
            msg = f"{asset_id} has crossed into CRITICAL knowledge debt (score {score:.0f}/100)."
            alert_id = insert_alert(asset_id, "SCORE_CROSSED_CRITICAL", msg, "CRITICAL")
            await _broadcast({
                "type": "alert",
                "id": alert_id,
                "asset_id": asset_id,
                "alert_type": "SCORE_CROSSED_CRITICAL",
                "message": msg,
                "severity": "CRITICAL",
                "created_at": datetime.now(UTC).isoformat(),
            })
            logger.warning("ALERT: %s", msg)

        _last_severity[asset_id] = severity

    # Expert flight risk check
    risks = detect_flight_risks()
    for risk in risks:
        if risk["risk_level"] == "CRITICAL":
            for asset_id in risk["assets"][:1]:  # Alert once per expert
                msg = (
                    f"Expert {risk['expert_name']} has been inactive for "
                    f"{risk['days_inactive']} days. "
                    f"Knowledge risk on {', '.join(risk['assets'])}."
                )
                alert_id = insert_alert(asset_id, "EXPERT_INACTIVE", msg, "WARNING")
                await _broadcast({
                    "type": "alert",
                    "id": alert_id,
                    "asset_id": asset_id,
                    "alert_type": "EXPERT_INACTIVE",
                    "message": msg,
                    "severity": "WARNING",
                    "created_at": datetime.now(UTC).isoformat(),
                })
