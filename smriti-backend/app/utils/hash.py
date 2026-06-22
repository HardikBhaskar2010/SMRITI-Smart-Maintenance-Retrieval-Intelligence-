import hashlib


def content_hash(text: str) -> str:
    """SHA-256 fingerprint of a text chunk for deduplication."""
    return hashlib.sha256(text.strip().encode("utf-8")).hexdigest()
