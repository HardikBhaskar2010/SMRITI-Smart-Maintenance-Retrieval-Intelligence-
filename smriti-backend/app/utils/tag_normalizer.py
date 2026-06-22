import re


def normalize_asset_id(asset_id: str) -> str:
    """
    Convert an equipment tag to a valid ChromaDB collection name.
    Examples:
        UPS-01     → asset__ups_01
        T-101      → asset__t_101
        Pump P-207 → asset__pump_p_207
    """
    normalized = re.sub(r"[\s\-/]+", "_", asset_id.lower())
    return f"asset__{normalized}"


def display_asset_id(collection_name: str) -> str:
    """Reverse: asset__ups_01 → UPS-01 (best-effort)"""
    if collection_name.startswith("asset__"):
        raw = collection_name[len("asset__"):]
        # Re-insert hyphen: ups_01 → UPS-01
        return raw.upper().replace("_", "-", 1)
    return collection_name
