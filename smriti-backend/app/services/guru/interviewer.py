"""
Guru Mode expert interview orchestration.
Generates opening questions and follow-ups using Llama 3.3 70B.
"""
import json
import logging

from app.services.llm.client import LLMClient
from app.prompts import (
    GURU_OPENING_SYSTEM,
    build_guru_opening_prompt,
    validate_guru_opening_output,
    GURU_FOLLOWUP_SYSTEM,
    build_guru_followup_prompt,
)
from app.db.chroma import get_chroma
from app.utils.tag_normalizer import normalize_asset_id
from app.services.debt.scorer import recalculate_debt

logger = logging.getLogger(__name__)


async def generate_opening_questions(
    asset_id: str,
    expert_name: str,
) -> list[str]:
    """Generate 8 asset-specific interview questions targeting knowledge gaps."""
    llm = LLMClient()
    chroma = get_chroma()

    # Get existing thread summary
    col_name = normalize_asset_id(asset_id)
    context_lines = []
    try:
        col = chroma.get_collection(col_name)
        items = col.get(include=["documents"])
        for doc in (items.get("documents") or [])[:15]:
            context_lines.append(f"• {doc[:200]}")
    except Exception:
        pass
    context = "\n".join(context_lines) or "No existing documentation."

    debt = await recalculate_debt(asset_id)

    # Infer asset type from ChromaDB collection metadata
    asset_type = "UNKNOWN"
    try:
        col = chroma.get_collection(col_name)
        asset_type = (col.metadata or {}).get("asset_type", "UNKNOWN")
    except Exception:
        pass

    response_text = await llm.query(
        system_prompt=GURU_OPENING_SYSTEM,
        user_message=build_guru_opening_prompt(
            asset_id=asset_id,
            asset_type=asset_type,
            expert_name=expert_name,
            existing_context=context,
            debt_score=debt.get("score", 50),
            debt_breakdown=debt.get("breakdown", {}),
        ),
        max_tokens=1024,
    )

    try:
        clean = response_text.strip()
        if clean.startswith("```"):
            clean = clean.split("```")[1]
            if clean.startswith("json"):
                clean = clean[4:]
            clean = clean.strip()
        data = json.loads(clean)
        if validate_guru_opening_output(data):
            return data["questions"]
    except (json.JSONDecodeError, KeyError) as e:
        logger.warning("Failed to parse Guru opening questions: %s", e)

    # Fallback: generic questions
    return [
        f"Can you describe the overall history of {asset_id} — how long have you been working with it?",
        f"What are the most common failure modes you have seen on {asset_id}?",
        f"What early warning signs do you watch for before a fault trip on {asset_id}?",
        f"Does {asset_id} behave differently during monsoon season or extreme heat?",
        f"Are there any maintenance procedures you do differently from what the OEM manual specifies?",
        f"What other equipment does {asset_id} depend on, and how do failures propagate?",
        f"Have there been any near-misses or incidents on {asset_id} that were never formally reported?",
        f"What is the single most important thing the next engineer must know about {asset_id}?",
    ]


async def generate_followup(
    asset_id: str,
    conversation: list[dict],
    last_answer: str,
) -> str | None:
    """Generate a contextual follow-up question or return None if complete."""
    llm = LLMClient()
    response_text = await llm.query(
        system_prompt=GURU_FOLLOWUP_SYSTEM,
        user_message=build_guru_followup_prompt(asset_id, conversation, last_answer),
        max_tokens=512,
    )
    try:
        clean = response_text.strip()
        if clean.startswith("```"):
            clean = clean.split("```")[1]
            if clean.startswith("json"):
                clean = clean[4:]
            clean = clean.strip()
        data = json.loads(clean)
        question = data.get("question")
        return None if question is None else str(question)
    except (json.JSONDecodeError, KeyError):
        return None
