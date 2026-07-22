"""Expert Flight Risk detection — flags experts with long inactivity."""
import logging
from datetime import datetime, timezone, timedelta

from app.db.chroma import get_chroma

logger = logging.getLogger(__name__)

INACTIVITY_WARNING_DAYS = 60
INACTIVITY_CRITICAL_DAYS = 90


def detect_flight_risks() -> list[dict]:
    """
    Scan all ChromaDB collections for expert attribution records.
    Returns a list of at-risk experts sorted by days_inactive descending.
    """
    chroma = get_chroma()
    now = datetime.now(timezone.utc)

    try:
        collections = chroma.list_collections()
    except Exception:
        return []

    # expert_name → {assets: [], last_activity: datetime, item_count: int}
    expert_map: dict[str, dict] = {}

    for col_info in collections:
        try:
            col = chroma.get_collection(col_info.name)
            asset_id = (col.metadata or {}).get("asset_id", col_info.name)
            items = col.get(include=["metadatas"])
            for meta in (items.get("metadatas") or []):
                if not meta.get("expert_attributed"):
                    continue
                name = meta.get("expert_name", "").strip()
                if not name:
                    continue
                added_raw = meta.get("added_at", "")
                try:
                    added_dt = datetime.fromisoformat(
                        added_raw.replace("Z", "+00:00")
                    )
                except ValueError:
                    added_dt = now - timedelta(days=120)

                if name not in expert_map:
                    expert_map[name] = {
                        "expert_name": name,
                        "assets": [],
                        "last_activity": added_dt,
                        "total_contributions": 0,
                    }
                info = expert_map[name]
                if asset_id not in info["assets"]:
                    info["assets"].append(asset_id)
                if added_dt > info["last_activity"]:
                    info["last_activity"] = added_dt
                info["total_contributions"] += 1
        except Exception as e:
            logger.warning("Flight risk scan failed for %s: %s", col_info.name, e)

    results = []
    for name, info in expert_map.items():
        days_inactive = (now - info["last_activity"]).days
        if days_inactive >= INACTIVITY_WARNING_DAYS:
            if days_inactive >= INACTIVITY_CRITICAL_DAYS:
                risk_level = "CRITICAL"
            else:
                risk_level = "WARNING"
            results.append({
                "expert_name": name,
                "assets": info["assets"],
                "asset_count": len(info["assets"]),
                "last_activity_iso": info["last_activity"].isoformat(),
                "days_inactive": days_inactive,
                "total_contributions": info["total_contributions"],
                "risk_level": risk_level,
                "risk_reason": (
                    f"No knowledge contributions in {days_inactive} days. "
                    f"Covers {len(info['assets'])} asset(s)."
                ),
            })

    results.sort(key=lambda r: r["days_inactive"], reverse=True)
    return results
