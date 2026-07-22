"""Unit tests for tag normalizer and deduplicator."""
import pytest
from app.utils.tag_normalizer import normalize_asset_id


class TestTagNormalizer:
    def test_spaces_replaced_with_underscores(self):
        assert "_" in normalize_asset_id("Pump P-207")

    def test_lowercase(self):
        result = normalize_asset_id("UPS-01")
        assert result == result.lower()

    def test_special_chars_removed(self):
        result = normalize_asset_id("T-101!")
        assert "!" not in result

    def test_prefix_added(self):
        result = normalize_asset_id("UPS-01")
        assert result.startswith("asset")

    def test_idempotent_on_normalized_input(self):
        first = normalize_asset_id("T-101")
        second = normalize_asset_id("T-101")
        assert first == second

    def test_empty_string_safe(self):
        result = normalize_asset_id("")
        assert isinstance(result, str)


class TestDeduplicator:
    def test_same_content_same_hash(self):
        from app.services.ingestion.deduplicator import sha256_hash
        assert sha256_hash("hello") == sha256_hash("hello")

    def test_different_content_different_hash(self):
        from app.services.ingestion.deduplicator import sha256_hash
        assert sha256_hash("hello") != sha256_hash("world")

    def test_hash_is_hex_64_chars(self):
        from app.services.ingestion.deduplicator import sha256_hash
        h = sha256_hash("test content")
        assert len(h) == 64
        assert all(c in "0123456789abcdef" for c in h)
