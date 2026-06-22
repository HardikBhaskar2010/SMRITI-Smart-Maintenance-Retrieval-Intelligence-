"""Content hash deduplication utility for the ingestion pipeline."""
import hashlib


def sha256_hash(content: str) -> str:
    """Return a hex SHA-256 digest of the given content string."""
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


def is_duplicate(collection, content_hash: str) -> bool:
    """
    Check if a document with the given content hash already exists
    in the ChromaDB collection.
    """
    try:
        result = collection.get(where={"content_hash": content_hash})
        return bool(result.get("ids"))
    except Exception:
        return False
