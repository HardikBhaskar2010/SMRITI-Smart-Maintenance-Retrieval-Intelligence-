"""
Guru Mode — Opening Question Generation Prompt
Model: meta-llama/llama-3.3-70b-instruct:free
Called by: app/services/guru/interviewer.py
Frequency: Once per Guru Mode session start
"""

PROMPT_VERSION = "1.1.0"

GURU_OPENING_SYSTEM = """You are the SMRITI Knowledge Capture Engine — a specialized AI interviewer that extracts tacit operational knowledge from senior industrial plant experts before it is lost to retirement or organizational change.

## Your Role
Conduct a structured knowledge capture interview with a domain expert about a specific piece of plant equipment. Extract knowledge NOT already documented — the experiential, instinctual, and situational knowledge that only comes from years of hands-on work.

## Question Design Principles

### Target the Gaps
Generate questions specifically about information NOT present in the current thread. If the thread has electrical specs but no fault history → ask about faults. No seasonal behavior → ask about that.

### Elicit Tacit Knowledge
Focus on:
- What experts watch for that isn't in any manual
- Seasonal or environmental quirks
- Failure precursors and early warning signs
- Workarounds and unofficial procedures
- Dependencies between this equipment and adjacent systems
- Historical near-misses never formally reported

### Question Sequence (always 8 questions in this order)
1. Open-ended overview — high-level history, build rapport
2. Common failure modes — most frequent issues
3. Early warning signs — precursors before a fault
4. Seasonal/environmental behavior — monsoon, heat, humidity
5. Maintenance procedures that differ from OEM manual
6. Dependencies on adjacent equipment
7. Near-misses or incidents never formally documented
8. Succession knowledge — what must the next engineer know first?

### Rules
- One focused question per item. No multi-part questions.
- Use the expert's name occasionally to personalize.
- Clear, professional language — not jargon-heavy.
- All 8 questions must be specific to the named equipment, not generic.

## CRITICAL OUTPUT FORMAT
Respond with ONLY valid JSON. No preamble. No explanation."""


def build_guru_opening_prompt(
    asset_id: str,
    asset_type: str,
    expert_name: str,
    existing_context: str,
    debt_score: int,
    debt_breakdown: dict,
) -> str:
    gap_parts = []
    if debt_breakdown.get("doc_penalty", 0) > 15:
        gap_parts.append("sparse document coverage")
    if debt_breakdown.get("expert_penalty", 0) > 20:
        gap_parts.append("knowledge concentrated in very few people")
    if debt_breakdown.get("recency_penalty", 0) > 10:
        gap_parts.append("outdated documentation (over 6 months old)")
    gaps = ", ".join(gap_parts) if gap_parts else "general knowledge gaps"

    return f"""Equipment: {asset_id} ({asset_type})
Expert: {expert_name}
Knowledge Debt Score: {debt_score}/100
Primary gaps: {gaps}

=== EXISTING THREAD SUMMARY (already documented) ===
{existing_context if existing_context else "No documentation exists yet for this asset."}
=== END THREAD SUMMARY ===

Generate exactly 8 targeted interview questions to capture knowledge NOT covered above.

Return ONLY valid JSON:
{{
  "questions": [
    "Question 1 text here...",
    "Question 2 text here...",
    "Question 3 text here...",
    "Question 4 text here...",
    "Question 5 text here...",
    "Question 6 text here...",
    "Question 7 text here...",
    "Question 8 text here..."
  ],
  "asset_id": "{asset_id}",
  "expert_name": "{expert_name}",
  "focus_areas": ["area1", "area2", "area3"]
}}"""


def validate_guru_opening_output(data: dict) -> bool:
    if not isinstance(data, dict):
        return False
    if "questions" not in data or not isinstance(data["questions"], list):
        return False
    if len(data["questions"]) < 5:
        return False
    if any(not isinstance(q, str) or len(q) < 20 for q in data["questions"]):
        return False
    return True
