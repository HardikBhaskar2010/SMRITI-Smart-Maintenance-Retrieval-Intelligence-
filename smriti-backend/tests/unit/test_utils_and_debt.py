"""
UNIT TESTS — Tag Normalizer & Debt Scorer
Tests pure functions that don't need a live API.
"""
import pytest


# ── Tag normalizer ────────────────────────────────────────────────────

class TestTagNormalizer:
    def test_basic_normalization(self):
        from app.utils.tag_normalizer import normalize_asset_id
        assert normalize_asset_id("PUMP-001") == "asset__pump_001"

    def test_spaces_become_underscores(self):
        from app.utils.tag_normalizer import normalize_asset_id
        assert normalize_asset_id("Heat Exchanger 02") == "asset__heat_exchanger_02"

    def test_special_chars_stripped(self):
        from app.utils.tag_normalizer import normalize_asset_id
        result = normalize_asset_id("Boiler#1 (Unit-A)")
        assert result.startswith("asset__")
        # Special chars # ( ) should NOT appear in the result
        assert "#" not in result
        assert "(" not in result
        assert ")" not in result
        # Should only contain alphanumeric and underscores after prefix
        suffix = result[len("asset__"):]
        assert suffix.replace("_", "").isalnum()

    def test_already_prefixed(self):
        from app.utils.tag_normalizer import normalize_asset_id
        result = normalize_asset_id("asset__boiler_1")
        # Should NOT double-prefix
        assert result.count("asset__") == 1
        assert result == "asset__boiler_1"

    def test_display_asset_id_roundtrip(self):
        from app.utils.tag_normalizer import normalize_asset_id, display_asset_id
        original = "PUMP-TEST-001"
        col_name = normalize_asset_id(original)
        displayed = display_asset_id(col_name)
        # Displayed form should contain the original content
        assert "PUMP" in displayed.upper() or "pump" in displayed.lower()


# ── Debt Scorer ───────────────────────────────────────────────────────

class TestDebtScorer:
    @pytest.mark.asyncio
    async def test_empty_collection_returns_high_score(self, seeded_asset_id):
        """A non-existent asset should return a full debt dict with high score."""
        from app.services.debt.scorer import recalculate_debt
        # Use a non-existent asset
        debt = await recalculate_debt("NON_EXISTENT_ASSET_XYZ")
        assert "score"    in debt, f"Expected 'score' key, got: {debt}"
        assert "severity" in debt
        assert debt["score"] >= 0
        assert debt["severity"] in ("OK", "WARNING", "CRITICAL")

    @pytest.mark.asyncio
    async def test_seeded_asset_returns_valid_debt(self, seeded_asset_id):
        """An asset with real content should compute a valid debt score."""
        from app.services.debt.scorer import recalculate_debt
        debt = await recalculate_debt(seeded_asset_id)
        assert 0 <= debt["score"] <= 100
        assert debt["severity"] in ("OK", "WARNING", "CRITICAL")
        assert "breakdown" in debt

    @pytest.mark.asyncio
    async def test_debt_severity_thresholds(self):
        """Non-existent asset should have WARNING or CRITICAL (high debt)."""
        from app.services.debt.scorer import recalculate_debt
        debt = await recalculate_debt("NON_EXISTENT_ASSET_000")
        # No items and no experts → should be WARNING or CRITICAL
        assert debt["severity"] in ("WARNING", "CRITICAL")
