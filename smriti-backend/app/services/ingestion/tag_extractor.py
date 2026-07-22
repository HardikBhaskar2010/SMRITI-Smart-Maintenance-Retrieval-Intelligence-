"""
Equipment tag extraction using LLM (cohere/north-mini-code:free)
Processes pages in batches of 5 for efficient API usage.
"""
import json
import logging

from app.prompts import (
    TAG_EXTRACTION_SYSTEM,
    build_tag_extraction_prompt,
    validate_tag_extraction_output,
)
from app.services.llm.client import LLMClient

logger = logging.getLogger(__name__)

CHUNK_SIZE = 3000   # Characters per page sent to LLM
BATCH_SIZE = 5      # Pages per LLM call


async def extract_equipment_tags(
    llm: LLMClient,
    pages: list[tuple[int, str]],
    document_name: str,
) -> list[dict]:
    """
    Returns list of:
    {asset_id, asset_type, content, source_page, source_section, confidence}
    """
    all_chunks: list[dict] = []

    for batch_start in range(0, len(pages), BATCH_SIZE):
        batch = pages[batch_start: batch_start + BATCH_SIZE]
        batch_text = "\n\n".join(
            f"[Page {pg}]\n{text[:CHUNK_SIZE]}"
            for pg, text in batch
        )

        try:
            response_text = await llm.extract(
                system_prompt=TAG_EXTRACTION_SYSTEM,
                user_message=build_tag_extraction_prompt(batch_text, document_name),
                max_tokens=2048,
            )

            # Strip any accidental markdown fences
            clean = response_text.strip()
            if clean.startswith("```"):
                clean = clean.split("```")[1]
                if clean.startswith("json"):
                    clean = clean[4:]
                clean = clean.strip()

            data = json.loads(clean)

            if not validate_tag_extraction_output(data):
                logger.warning(
                    "Tag extraction schema validation failed — batch starting page %d, doc=%s",
                    batch_start, document_name
                )
                continue

            for chunk in data.get("chunks", []):
                if chunk.get("asset_id") and chunk.get("content"):
                    all_chunks.append(chunk)

        except json.JSONDecodeError as e:
            logger.warning(
                "JSON parse failed for batch p%d in %s: %s",
                batch_start, document_name, e
            )
        except Exception as e:
            logger.error("Tag extraction error for batch p%d: %s", batch_start, e)

    return all_chunks
