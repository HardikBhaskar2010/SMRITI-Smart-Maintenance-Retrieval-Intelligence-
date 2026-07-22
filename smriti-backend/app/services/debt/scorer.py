"""
Knowledge Debt Score computation.
Four weighted dimensions: doc coverage (30%), expert distribution (35%),
recency (20%), operational criticality (15%).
"""
import logging
from datetime import datetime, timezone

from app.db.chroma import get_chroma
from app.utils.tag_normalizer import normalize_asset_id

logger = logging.getLogger(__name__)

# Default operational criticality by asset type (0.0–1.0)
DEFAULT_CRITICALITY: dict[str, float] = {
    "TRANSFORMER":     0.95,
    "UPS":             0.90,
    "HV_PANEL":        0.85,
    "GENERATOR":       0.80,
    "PUMP":            0.70,
    "CIRCUIT_BREAKER": 0.70,
    "COOLING":         0.65,
    "PANEL":           0.55,
    "SENSOR":          0.40,
    "CABLE":           0.35,
    "UNKNOWN":         0.50,
}


def calculate_debt_score(
    item_count: int,
    expert_count: int,
    last_updated_iso: str,
    operational_criticality: float = 0.5,
    doc_coverage: float | None = None,
) -> dict:
    """
    Returns {"score": int 0-100, "severity": str, "breakdown": dict}
    """
    # 1. Document coverage penalty (max 30 pts)
    # Heuristic: 0 items = no coverage, 50+ items = full coverage
    coverage = min(1.0, item_count / 50.0) if doc_coverage is None else doc_coverage
    doc_penalty = (1.0 - coverage) * 30.0

    # 2. Expert distribution penalty (max 35 pts)
    # 1 expert = full penalty; 3+ experts = zero penalty
    expert_penalty = max(0.0, (1.0 - min(expert_count, 3) / 3.0)) * 35.0

    # 3. Recency penalty (max 20 pts)
    # 0 days old = no penalty; 365+ days = full penalty
    try:
        last_dt = datetime.fromisoformat(last_updated_iso.replace("Z", "+00:00"))
        # Ensure the parsed datetime is timezone-aware
        if last_dt.tzinfo is None:
            last_dt = last_dt.replace(tzinfo=timezone.utc)
        days_old = (datetime.now(timezone.utc) - last_dt).days
    except (ValueError, AttributeError):
        days_old = 365
    recency_penalty = min(1.0, days_old / 365.0) * 20.0

    # 4. Criticality multiplier (max 15 pts)
    crit_penalty = operational_criticality * 15.0

    raw = doc_penalty + expert_penalty + recency_penalty + crit_penalty
    score = min(100, int(raw))

    if score <= 40:
        severity = "OK"
    elif score <= 70:
        severity = "WARNING"
    else:
        severity = "CRITICAL"

    return {
        "score": score,
        "severity": severity,
        "breakdown": {
            "doc_penalty":     round(doc_penalty, 1),
            "expert_penalty":  round(expert_penalty, 1),
            "recency_penalty": round(recency_penalty, 1),
            "crit_penalty":    round(crit_penalty, 1),
        },
    }


async def recalculate_debt(asset_id: str) -> dict:
    """Pull live stats from ChromaDB and recompute debt score."""
    chroma = get_chroma()
    col_name = normalize_asset_id(asset_id)
    try:
        col = chroma.get_collection(col_name)
    except Exception:
        # Asset doesn't exist — treat as zero knowledge items (maximum debt)
        return calculate_debt_score(
            item_count=0,
            expert_count=0,
            last_updated_iso="",
            operational_criticality=0.5,
        )

    all_items = col.get(include=["metadatas"])
    metas = all_items.get("metadatas") or []

    # Count unique named experts from guru-attributed items
    experts = {m.get("expert_name", "") for m in metas if m.get("expert_attributed")}
    experts.discard("")

    # Most recent timestamp
    timestamps = [m.get("added_at", "") for m in metas if m.get("added_at")]
    last_updated = max(timestamps) if timestamps else datetime.now(timezone.utc).isoformat()

    asset_type = (col.metadata or {}).get("asset_type", "UNKNOWN").upper().replace(" ", "_")
    criticality = DEFAULT_CRITICALITY.get(asset_type, 0.5)

    return calculate_debt_score(
        item_count=col.count(),
        expert_count=max(1, len(experts)),
        last_updated_iso=last_updated,
        operational_criticality=criticality,
    )
