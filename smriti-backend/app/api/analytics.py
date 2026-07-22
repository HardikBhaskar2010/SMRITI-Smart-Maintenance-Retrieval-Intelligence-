"""Analytics API — trends, flight risk, portfolio stats."""
import logging
from fastapi import APIRouter, HTTPException, Query

from app.services.analytics.trend_engine import (
    compute_asset_trend,
    compute_portfolio_trends,
)
from app.services.analytics.flight_risk import detect_flight_risks
from app.db.analytics_store import get_alerts, mark_alerts_read

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/analytics/trends/{asset_id}")
async def get_asset_trend(
    asset_id: str,
    days: int = Query(default=30, ge=7, le=90),
):
    """Return historical + projected debt trend for a single asset."""
    try:
        trend = await compute_asset_trend(asset_id, days=days)
        return trend
    except Exception as e:
        logger.error("Trend computation failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analytics/trends")
async def get_all_trends():
    """Return trends for every tracked asset (portfolio view)."""
    try:
        trends = await compute_portfolio_trends()
        return {"trends": trends, "total": len(trends)}
    except Exception as e:
        logger.error("Portfolio trends failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analytics/flight-risk")
async def get_flight_risks():
    """Return experts at risk of departure due to inactivity."""
    try:
        risks = detect_flight_risks()
        return {
            "at_risk_experts": risks,
            "total": len(risks),
            "critical_count": sum(1 for r in risks if r["risk_level"] == "CRITICAL"),
        }
    except Exception as e:
        logger.error("Flight risk detection failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analytics/portfolio")
async def get_portfolio_stats():
    """Return portfolio-level aggregate metrics."""
    from app.db.chroma import get_chroma
    from app.services.debt.scorer import recalculate_debt

    chroma = get_chroma()
    try:
        collections = chroma.list_collections()
    except Exception:
        return {"error": "ChromaDB unavailable"}

    scores = []
    severities = {"OK": 0, "WARNING": 0, "CRITICAL": 0}
    total_items = 0

    for col_info in collections:
        try:
            col = chroma.get_collection(col_info.name)
            asset_id = (col.metadata or {}).get("asset_id", col_info.name)
            result = await recalculate_debt(asset_id)
            if result:
                s = result["score"]
                scores.append(s)
                severities[result["severity"]] = severities.get(result["severity"], 0) + 1
                total_items += col.count()
        except Exception:
            continue

    if not scores:
        return {"portfolio_health": 0, "asset_count": 0, "total_items": 0, "severities": severities}

    portfolio_health = round(100 - (sum(scores) / len(scores)), 1)

    return {
        "portfolio_health": portfolio_health,
        "average_debt_score": round(sum(scores) / len(scores), 1),
        "asset_count": len(scores),
        "total_items": total_items,
        "severities": severities,
        "highest_risk_score": max(scores),
        "lowest_risk_score": min(scores),
    }
