"""Unit tests for the Knowledge Debt Score calculator."""
import pytest
from app.services.debt.scorer import calculate_debt_score


class TestDebtScorer:
    def test_zero_items_single_expert_gives_high_score(self):
        result = calculate_debt_score(
            item_count=0,
            expert_count=1,
            last_updated_iso="2024-01-01T00:00:00+00:00",
            operational_criticality=0.9,
        )
        assert result["score"] > 60
        assert result["severity"] in ("WARNING", "CRITICAL")

    def test_full_coverage_three_experts_gives_low_score(self):
        from datetime import datetime, timezone
        result = calculate_debt_score(
            item_count=50,
            expert_count=3,
            last_updated_iso=datetime.now(timezone.utc).isoformat(),
            operational_criticality=0.1,
        )
        assert result["score"] < 40
        assert result["severity"] == "OK"

    def test_score_clamped_0_to_100(self):
        result = calculate_debt_score(
            item_count=0,
            expert_count=1,
            last_updated_iso="2000-01-01T00:00:00+00:00",
            operational_criticality=1.0,
        )
        assert 0 <= result["score"] <= 100

    def test_severity_thresholds(self):
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc).isoformat()
        ok = calculate_debt_score(50, 3, now, 0.0)
        assert ok["severity"] == "OK"

        warn = calculate_debt_score(10, 2, now, 0.5)
        assert warn["severity"] in ("WARNING", "OK")

    def test_breakdown_keys_present(self):
        from datetime import datetime, timezone
        result = calculate_debt_score(20, 2, datetime.now(timezone.utc).isoformat())
        assert "doc_penalty" in result["breakdown"]
        assert "expert_penalty" in result["breakdown"]
        assert "recency_penalty" in result["breakdown"]
        assert "crit_penalty" in result["breakdown"]

    def test_recency_penalty_increases_with_age(self):
        recent = calculate_debt_score(20, 2, "2026-07-01T00:00:00+00:00", 0.5)
        old    = calculate_debt_score(20, 2, "2020-01-01T00:00:00+00:00", 0.5)
        assert old["score"] >= recent["score"]

    def test_expert_count_reduces_penalty(self):
        one   = calculate_debt_score(20, 1, "2026-01-01T00:00:00+00:00", 0.5)
        three = calculate_debt_score(20, 3, "2026-01-01T00:00:00+00:00", 0.5)
        assert one["score"] > three["score"]
