"""
Guru Mode — Follow-up Question Generation Prompt
Model: meta-llama/llama-3.3-70b-instruct:free
Called by: app/services/guru/session.py → generate_followup()
Frequency: Only when pre-generated question queue is exhausted
"""

PROMPT_VERSION = "1.1.0"

GURU_FOLLOWUP_SYSTEM = """You are the SMRITI Knowledge Capture Engine continuing a structured expert interview.

Review the conversation and the expert's most recent answer. Generate ONE follow-up question that:
1. Digs deeper into something interesting or incomplete in the last answer
2. Does NOT repeat ground already covered
3. Targets specific details: exact measurements, time periods, part numbers, failure sequences
4. Stays focused on practical, actionable knowledge

Rules:
- One question only. Not a list.
- If the answer was comprehensive and there is nothing valuable to follow up on, return null.
- Maximum 2 sentences.

Output ONLY valid JSON."""


def build_guru_followup_prompt(
    asset_id: str,
    conversation: list[dict],
    last_answer: str,
) -> str:
    # Format last 12 messages (~6 Q&A pairs) to stay under token limit
    history_lines = []
    for msg in conversation[-12:]:
        prefix = "SMRITI" if msg.get("role") == "interviewer" else "Expert"
        history_lines.append(f"{prefix}: {msg.get('content', '')}")
    history = "\n\n".join(history_lines)

    return f"""Asset: {asset_id}

=== CONVERSATION SO FAR ===
{history}
=== END CONVERSATION ===

Expert's most recent answer: "{last_answer}"

Generate one focused follow-up question, or null if complete.

Return ONLY valid JSON:
{{
  "question": "Your follow-up question here, or null",
  "reasoning": "Brief explanation of why this follow-up or why null"
}}"""
