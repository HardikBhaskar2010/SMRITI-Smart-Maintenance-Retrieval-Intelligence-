import re


def normalize_asset_id(asset_id: str) -> str:
    """
    Convert an equipment tag to a valid ChromaDB collection name.
    Examples:
        UPS-01          → asset__ups_01
        T-101           → asset__t_101
        Pump P-207      → asset__pump_p_207
        Boiler#1 (A)    → asset__boiler_1__a_
        asset__boiler_1 → asset__boiler_1  (no double-prefix)
    """
    # Guard: already prefixed — don't double-prefix
    if asset_id.startswith("asset__"):
        return asset_id

    lower = asset_id.lower()
    # Replace whitespace and hyphens/slashes with underscores
    normalized = re.sub(r"[\s\-/]+", "_", lower)
    # Strip all remaining non-alphanumeric, non-underscore characters
    normalized = re.sub(r"[^a-z0-9_]+", "_", normalized)
    # Collapse multiple underscores and strip leading/trailing
    normalized = re.sub(r"_+", "_", normalized).strip("_")
    return f"asset__{normalized}"


def display_asset_id(collection_name: str) -> str:
    """Reverse: asset__ups_01 → UPS-01 (best-effort)"""
    if collection_name.startswith("asset__"):
        raw = collection_name[len("asset__"):]
        # Re-insert hyphen: ups_01 → UPS-01
        return raw.upper().replace("_", "-", 1)
    return collection_name
