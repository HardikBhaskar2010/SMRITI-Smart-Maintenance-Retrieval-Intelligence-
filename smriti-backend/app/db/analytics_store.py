"""
SQLite-backed analytics store for time-series debt score snapshots.
Provides lightweight persistence without heavy DB dependencies.
"""
import logging
import sqlite3
from contextlib import contextmanager
from datetime import UTC, datetime

from app.config import settings

logger = logging.getLogger(__name__)

_CREATE_SNAPSHOTS = """
CREATE TABLE IF NOT EXISTS debt_snapshots (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id    TEXT    NOT NULL,
    score       REAL    NOT NULL,
    severity    TEXT    NOT NULL,
    item_count  INTEGER NOT NULL,
    expert_count INTEGER NOT NULL,
    recorded_at TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_asset_time ON debt_snapshots (asset_id, recorded_at);
"""

_CREATE_ALERTS = """
CREATE TABLE IF NOT EXISTS alerts (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id    TEXT    NOT NULL,
    alert_type  TEXT    NOT NULL,
    message     TEXT    NOT NULL,
    severity    TEXT    NOT NULL,
    is_read     INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT    NOT NULL
);
"""


def init_analytics_db() -> None:
    """Create tables if they don't exist."""
    with _connect() as conn:
        conn.executescript(_CREATE_SNAPSHOTS)
        conn.executescript(_CREATE_ALERTS)
    logger.info("Analytics DB initialized at %s", settings.ANALYTICS_DB_PATH)


@contextmanager
def _connect():
    conn = sqlite3.connect(settings.ANALYTICS_DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def record_snapshot(
    asset_id: str,
    score: float,
    severity: str,
    item_count: int,
    expert_count: int,
) -> None:
    """Insert a debt score snapshot for an asset."""
    now = datetime.now(UTC).isoformat()
    with _connect() as conn:
        conn.execute(
            "INSERT INTO debt_snapshots (asset_id, score, severity, item_count, expert_count, recorded_at) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (asset_id, score, severity, item_count, expert_count, now),
        )


def get_snapshots(asset_id: str, days: int = 30) -> list[dict]:
    """Return up to `days` days of snapshots for an asset, oldest first."""
    with _connect() as conn:
        rows = conn.execute(
            "SELECT score, severity, item_count, expert_count, recorded_at "
            "FROM debt_snapshots "
            "WHERE asset_id = ? AND recorded_at >= datetime('now', ?) "
            "ORDER BY recorded_at ASC",
            (asset_id, f"-{days} days"),
        ).fetchall()
    return [dict(r) for r in rows]


def get_all_latest_snapshots() -> list[dict]:
    """Return the most recent snapshot for every tracked asset."""
    with _connect() as conn:
        rows = conn.execute(
            "SELECT asset_id, score, severity, item_count, expert_count, recorded_at "
            "FROM debt_snapshots "
            "WHERE id IN ("
            "  SELECT MAX(id) FROM debt_snapshots GROUP BY asset_id"
            ")",
        ).fetchall()
    return [dict(r) for r in rows]


def insert_alert(
    asset_id: str,
    alert_type: str,
    message: str,
    severity: str,
) -> int:
    """Insert an alert and return its id."""
    now = datetime.now(UTC).isoformat()
    with _connect() as conn:
        cur = conn.execute(
            "INSERT INTO alerts (asset_id, alert_type, message, severity, created_at) "
            "VALUES (?, ?, ?, ?, ?)",
            (asset_id, alert_type, message, severity, now),
        )
        return cur.lastrowid  # type: ignore[return-value]


def get_alerts(unread_only: bool = False, limit: int = 50) -> list[dict]:
    where = "WHERE is_read = 0 " if unread_only else ""
    with _connect() as conn:
        rows = conn.execute(
            f"SELECT * FROM alerts {where}ORDER BY created_at DESC LIMIT ?",
            (limit,),
        ).fetchall()
    return [dict(r) for r in rows]


def mark_alerts_read(alert_ids: list[int]) -> None:
    if not alert_ids:
        return
    placeholders = ",".join("?" * len(alert_ids))
    with _connect() as conn:
        conn.execute(
            f"UPDATE alerts SET is_read = 1 WHERE id IN ({placeholders})",
            alert_ids,
        )
