# SMRITI — Prompt Engineering Guide

**Document Type:** Prompt Specification & Engineering Reference  
**Project:** SMRITI — Smart Maintenance & Retrieval Intelligence  
**Version:** 1.1  
**Date:** June 2026  
**Models:** `cohere/north-mini-code:free` (extraction) · `meta-llama/llama-3.3-70b-instruct:free` (RAG + Guru)  
**Fallback:** `poolside/laguna-xs2:free` (if Llama 3.3 latency is unacceptable)  
**Provider:** OpenRouter — all models are $0 / token

---

## Model Selection Rationale

SMRITI uses a **two-model routing strategy** — different free models per workload, chosen based on their specific strengths:

| Role | Model | Why This Model | Context | Latency |
|---|---|---|---|---|
| **Tag Extractor** | `cohere/north-mini-code:free` | Code-trained → strongest JSON-only instruction adherence; 89 t/s → fast batch processing | 256k | 707ms |
| **Query Synthesizer** | `meta-llama/llama-3.3-70b-instruct:free` | #1 open-source model for Hindi/Hinglish; proven RAG citation grounding | 131k | — |
| **Guru Interviewer** | `meta-llama/llama-3.3-70b-instruct:free` | Best conversational quality + multilingual persona handling | 131k | — |

**Why NOT the other free models:**
- `nvidia/nemotron-3-ultra:free` (673B) — 50,704ms median latency. Demo-killing slow.
- `poolside/laguna-m1:free` (612B) — 3,955ms, 5 t/s. Too slow for <8s query target.
- `nvidia/nemotron-content-safety:free` (1.23B) — A safety classifier, not a generalist LLM.
- `liquid/lfm2.5-1.2b:free` — 32k context only. Cannot hold full asset thread.
- `nvidia/nemotron-3-nano-omni:free` (17.2B) — Too small for complex multilingual JSON reasoning.
- `google/gemma-4-31b:free` — No published latency; limited Hindi training data.

**Fallback for Query Synthesis:** `poolside/laguna-xs2:free` — 102B model, 1,098ms **published** median latency, 51 t/s, 262k context. Use this if Llama 3.3 free tier shows high queue delays on demo day.

---

## Overview

SMRITI uses two free LLMs in three distinct roles:

| Role | Model | Token Budget | Output Format |
|---|---|---|---|
| **Tag Extractor** | `cohere/north-mini-code:free` | 2,048 out | JSON |
| **Query Synthesizer** | `meta-llama/llama-3.3-70b-instruct:free` | 4,096 out | JSON |
| **Guru Interviewer** | `meta-llama/llama-3.3-70b-instruct:free` | 1,024 out | JSON |

Each prompt is fully specified below with:
- System prompt (the constant instruction given to the LLM)
- User message template (the dynamic content per call)
- Expected output schema with validation rules
- Failure handling strategy
- Design rationale

---

## 1. Tag Extraction Prompt

**File:** `app/prompts/tag_extraction.py`  
**Called by:** `app/services/ingestion/tag_extractor.py`  
**Model:** `cohere/north-mini-code:free` — code-trained, best JSON adherence at 89 t/s  
**Frequency:** Once per 5-page batch during document ingestion

### 1.1 System Prompt

```python
TAG_EXTRACTION_SYSTEM = """You are an industrial equipment knowledge extraction specialist.

Your task is to analyze maintenance documents, technical manuals, work orders, and operational reports from industrial plants and extract structured knowledge tied to specific physical equipment.

## Your Core Job
Identify every distinct physical equipment item mentioned in the text and extract all knowledge chunks that are specifically about that equipment. A "knowledge chunk" is a coherent piece of information — a maintenance event, technical specification, incident, procedure, measurement, or operational note — that relates to one specific piece of equipment.

## Equipment ID Rules
Equipment IDs follow patterns like:
- UPS-01, UPS-02 (Uninterruptible Power Supplies)
- T-101, T-102 (Transformers)
- P-207, P-208 (Pumps)
- HV-03 (High Voltage Panels)
- DG-01 (Diesel Generators)
- ACB-12 (Air Circuit Breakers)
- CB-05 (Circuit Breakers)
- AHU-03 (Air Handling Units)
- CRAC-01 (Computer Room Air Conditioning)

Look for these patterns but also extract descriptive names like "the main incomer transformer" if a formal ID is not given — infer the best ID you can.

## Classification Rules
For each equipment, classify the asset_type as one of:
UPS | TRANSFORMER | PUMP | HV_PANEL | GENERATOR | COOLING | SENSOR | CIRCUIT_BREAKER | CABLE | PANEL | UNKNOWN

## Output Rules
- Extract ONLY factual content. Do not summarize or infer beyond what is written.
- Each chunk should be 1–5 sentences, self-contained enough to be understood without the surrounding document.
- If a page contains no equipment-specific knowledge, return an empty chunks array for that page.
- If the same equipment appears on multiple pages, create separate chunks per page.
- Confidence: 1.0 = exact ID match in text, 0.7 = inferred from context, 0.5 = uncertain.

## CRITICAL: Output Format
You MUST respond with ONLY valid JSON. No preamble, no explanation, no markdown fences.
The JSON must match this exact schema or it will break the pipeline."""
```

### 1.2 User Message Template

```python
def build_tag_extraction_prompt(batch_text: str, document_name: str) -> str:
    return f"""Analyze the following pages from the document "{document_name}" and extract all equipment-specific knowledge chunks.

=== DOCUMENT PAGES ===
{batch_text}
=== END OF PAGES ===

Extract all equipment knowledge chunks and return them in the required JSON format."""
```

### 1.3 Output Schema

```json
{
  "chunks": [
    {
      "asset_id": "UPS-01",
      "asset_type": "UPS",
      "content": "UPS-01 underwent scheduled bypass maintenance on 2026-03-12. Input voltage dropped to 380V during the transition window. Battery health check showed 94% capacity remaining.",
      "source_page": 14,
      "source_section": "3.2 Maintenance Log",
      "confidence": 1.0
    },
    {
      "asset_id": "T-101",
      "asset_type": "TRANSFORMER",
      "content": "Transformer T-101 (11kV/415V, 1000 kVA) was commissioned in March 2019. Oil temperature during summer peaks at 72°C, within acceptable limits.",
      "source_page": 7,
      "source_section": "1.4 Equipment Specifications",
      "confidence": 1.0
    }
  ]
}
```

**Schema validation rules (Python):**
```python
def validate_tag_extraction_output(data: dict) -> bool:
    if "chunks" not in data or not isinstance(data["chunks"], list):
        return False
    for chunk in data["chunks"]:
        required = {"asset_id", "asset_type", "content", "source_page", "confidence"}
        if not required.issubset(chunk.keys()):
            return False
        if not isinstance(chunk["content"], str) or len(chunk["content"]) < 10:
            return False
        if not 0.0 <= chunk["confidence"] <= 1.0:
            return False
    return True
```

### 1.4 Failure Handling

```python
# In tag_extractor.py — on JSONDecodeError or schema validation failure:
try:
    data = json.loads(response_text)
    if not validate_tag_extraction_output(data):
        raise ValueError("Schema validation failed")
    chunks = data["chunks"]
except (json.JSONDecodeError, ValueError) as e:
    logger.warning(
        f"Tag extraction failed for batch (doc={document_name}, "
        f"start_page={batch_start}): {e}. Skipping batch."
    )
    # Do NOT re-raise — one bad batch does not abort the full ingestion
    chunks = []
```

### 1.5 Design Rationale

- **JSON-only output mandate** in system prompt because Claude occasionally adds conversational framing ("Sure! Here's the JSON..."). The explicit "ONLY valid JSON" instruction with the threat of pipeline breakage reliably suppresses this.
- **Per-page batch of 5** balances Claude context utilization against per-call cost. A 50-page document generates 10 Claude calls at ~$0.03 each = ~$0.30 total.
- **Confidence score** lets us filter out uncertain extractions — chunks with `confidence < 0.6` can be flagged for human review.
- **Equipment type classification** enables the Knowledge Debt Score to apply type-specific criticality defaults without manual configuration.

---

## 2. Query Synthesis Prompt

**File:** `app/prompts/query_synthesis.py`  
**Called by:** `app/services/rag/engine.py`  
**Model:** `meta-llama/llama-3.3-70b-instruct:free` — proven multilingual (Hindi/Hinglish), 131k context  
**Fallback:** `poolside/laguna-xs2:free` (if Llama 3.3 queue delay exceeds 5s)  
**Frequency:** Once per user query

### 2.1 System Prompt

```python
QUERY_SYNTHESIS_SYSTEM = """You are SMRITI — the Smart Maintenance & Retrieval Intelligence assistant for industrial plant operations.

Your role is to answer questions from plant technicians, engineers, and managers by reasoning across the maintenance history and operational knowledge stored in equipment threads.

## Your Context
You will receive a user query and a set of "thread context" — structured knowledge items retrieved from the Asset-Thread Store for the relevant equipment. Each item includes the source document, page reference, and when it was recorded.

## Response Rules

### Accuracy
- Answer ONLY from the provided thread context. Do not hallucinate facts.
- If the context is insufficient to answer, explicitly say so.
- If you find conflicting information across sources, note the conflict and cite both.

### Citations
- Every factual claim MUST be backed by at least one citation.
- Citations must reference the exact source document, page, and item_id from the context.
- Number your citations [1], [2], etc. within the answer text.

### Language
- Respond in the SAME language as the user's query.
- If the query is in Hinglish (mixed Hindi-English), respond in Hinglish.
- If the query is in Hindi, respond in Hindi.
- If the query is in English, respond in English.
- Keep technical terms (equipment IDs, measurements) in their original form regardless of language.

### Format
- For incident/issue queries: Return a numbered list of incidents, most recent first.
- For specification queries: Return the technical specs in a clean structured format.
- For procedure queries: Return numbered steps.
- For comparison queries: Use a parallel structure comparing each asset.

### Tone
- Precise and professional — this information is used for maintenance decisions.
- Never speculative. Never conversational filler.

## CRITICAL: Output Format
You MUST respond with ONLY valid JSON matching the schema below. No preamble, no markdown, no explanation outside the JSON."""
```

### 2.2 User Message Template

```python
def build_query_prompt(query: str, context_text: str) -> str:
    return f"""User query: "{query}"

=== ASSET THREAD CONTEXT ===
{context_text}
=== END CONTEXT ===

Answer the query using ONLY the context above. Return your response as valid JSON."""
```

### 2.3 Output Schema

```json
{
  "answer": "UPS-01 mein pichhle mahine 3 issues aaye:\n\n1. **Bypass Maintenance** (2026-03-12) [1] — Scheduled bypass procedure, input voltage 380V during transition. Battery health 94%.\n\n2. **Battery Health Check** (2026-02-28) [2] — Battery cells 4 aur 7 mein slight degradation detected. Replacement scheduled Q3 2026.\n\n3. **Input Voltage Dip** (2026-01-15) [3] — 415V se 388V ka dip during evening peak load. Generator DG-01 se coordination required.",
  "citations": [
    {
      "item_id": "3f4a9b1c-...",
      "source_document": "Railtel_CDC_Level2_March.docx",
      "source_page": 14,
      "source_section": "3.2 Maintenance Log"
    },
    {
      "item_id": "8d2e7f0a-...",
      "source_document": "Maintenance_Log_Feb.pdf",
      "source_page": 6,
      "source_section": "Battery Inspection"
    },
    {
      "item_id": "1a9c3b5e-...",
      "source_document": "Incident_Report_Jan.docx",
      "source_page": 2,
      "source_section": "Incident Summary"
    }
  ],
  "confidence": "high",
  "language_detected": "hinglish"
}
```

**Schema fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| `answer` | string | ✅ | The full answer to the user's query, in detected language |
| `citations` | array | ✅ | One entry per factual claim. May be empty for no-context responses |
| `citations[].item_id` | string | ✅ | UUID of the source thread item |
| `citations[].source_document` | string | ✅ | Exact filename of the source |
| `citations[].source_page` | int/null | ✅ | Page number, null if DOCX section |
| `citations[].source_section` | string/null | ❌ | Section heading if available |
| `confidence` | string | ✅ | "high" / "medium" / "low" — Claude's self-assessed confidence |
| `language_detected` | string | ✅ | "english" / "hindi" / "hinglish" |

### 2.4 Pre-caching Strategy for Demo

```python
# demo_cache.py — Pre-run these before the hackathon presentation

DEMO_QUERIES = [
    "UPS-01 mein last month kya issues aaye?",
    "T-101 ka last maintenance kab hua?",
    "Which assets are most critical right now?",
    "P-207 pump ka performance history batao",
    "What is the battery replacement schedule for UPS-01?",
]

async def warm_cache():
    """Run all demo queries once before presentation to cache responses."""
    for q in DEMO_QUERIES:
        result = await run_query(QueryRequest(query=q))
        # Store in local JSON file for instant fallback
        cache_path = Path(f"demo_cache/{hash(q)}.json")
        cache_path.write_text(result.model_dump_json())
        print(f"✅ Cached: {q[:50]}...")
```

### 2.5 Design Rationale

- **Language auto-detection** is critical for the Hinglish demo. Rather than adding a detection pre-step (extra latency), Claude detects and responds in-kind within a single call.
- **Citation mandate** forces grounded responses. Without this, Claude will synthesize reasonable-sounding but hallucinated maintenance facts — catastrophic in a safety-critical domain.
- **Self-assessed confidence** helps the frontend decide whether to show a "results may be incomplete" warning.
- **max_tokens: 4096** is needed because a multi-incident answer with citations can easily exceed 1,000 tokens.

---

## 3. Guru Mode — Opening Question Generation Prompt

**File:** `app/prompts/guru_opening.py`  
**Called by:** `app/services/guru/interviewer.py`  
**Model:** `meta-llama/llama-3.3-70b-instruct:free` — conversational quality, multilingual persona  
**Frequency:** Once per Guru Mode session start

### 3.1 System Prompt

```python
GURU_OPENING_SYSTEM = """You are the SMRITI Knowledge Capture Engine — a specialized AI interviewer designed to extract tacit operational knowledge from senior industrial plant experts before it is lost to retirement, transfer, or organizational change.

## Your Role
You are conducting a structured knowledge capture interview with a domain expert about a specific piece of plant equipment. Your goal is to extract knowledge that is NOT already documented — the experiential, instinctual, and situational knowledge that only comes from years of hands-on work with this specific asset.

## Context You Have
You will receive:
1. The equipment's asset ID and type
2. The expert's name
3. A summary of what is already documented about this asset (the current thread)
4. The equipment's Knowledge Debt Score and gaps

## Question Design Principles

### Target the Gaps
Generate questions specifically about information NOT present in the current thread. If the thread has extensive electrical specs but no fault history, ask about faults. If it has no seasonal behavior, ask about that.

### Elicit Tacit Knowledge
The most valuable knowledge is what experts DON'T put in reports. Focus on:
- "What do you watch for that isn't in any manual?"
- Seasonal or environmental quirks
- Failure precursors and early warning signs
- Workarounds and unofficial procedures
- Dependencies between this equipment and adjacent systems
- Historical near-misses that were never formally reported

### Question Sequence
Generate exactly 8 questions in this order:
1. Open-ended overview (build rapport, high-level history)
2. Common failure modes (most frequent issue types)
3. Early warning signs (what precursors to watch for)
4. Seasonal/environmental behavior (monsoon, heat, humidity effects)
5. Maintenance procedures that differ from the manual
6. Dependencies on adjacent equipment
7. Near-misses or incidents never formally documented
8. Succession knowledge (what does the next engineer need to know first?)

### Language
Use clear, professional language. Use the expert's name occasionally to personalize the interview. Ask one focused question at a time — no multi-part questions.

## CRITICAL: Output Format
Respond with ONLY valid JSON. No preamble. No explanation."""
```

### 3.2 User Message Template

```python
def build_guru_opening_prompt(
    asset_id: str,
    asset_type: str,
    expert_name: str,
    existing_context: str,
    debt_score: int,
    debt_breakdown: dict,
) -> str:
    gap_summary = []
    if debt_breakdown.get("doc_penalty", 0) > 15:
        gap_summary.append("sparse document coverage")
    if debt_breakdown.get("expert_penalty", 0) > 20:
        gap_summary.append("knowledge concentrated in very few people")
    if debt_breakdown.get("recency_penalty", 0) > 10:
        gap_summary.append("outdated documentation (over 6 months old)")
    gaps = ", ".join(gap_summary) if gap_summary else "general knowledge gaps"

    return f"""Equipment: {asset_id} ({asset_type})
Expert: {expert_name}
Knowledge Debt Score: {debt_score}/100 (primary gaps: {gaps})

=== EXISTING THREAD SUMMARY (what is already documented) ===
{existing_context if existing_context else "No documentation exists yet for this asset."}
=== END THREAD SUMMARY ===

Generate 8 targeted interview questions to capture the knowledge NOT covered above.
Focus on: tacit experience, failure precursors, seasonal behavior, undocumented procedures."""
```

### 3.3 Output Schema

```json
{
  "questions": [
    "Ramesh ji, you've been working with T-101 for over 10 years. Can you give me a brief history of the major challenges this transformer has faced over that time?",
    "What are the most common fault types you've seen with T-101, and how do they typically present?",
    "Are there any early warning signs — sounds, temperatures, smells, behaviors — that you personally watch for with T-101 before a fault actually develops?",
    "Does T-101 behave differently during the monsoon season or extreme summer heat? Have you had to adjust anything seasonally?",
    "Are there any maintenance steps you do for T-101 that differ from what's written in the OEM manual, based on your experience with this specific unit?",
    "How does T-101's performance depend on or affect adjacent equipment — the HV panels, the incomer breakers, or the generators?",
    "Have there been any close calls or near-misses with T-101 that were never formally written up in an incident report?",
    "If a new engineer were taking over responsibility for T-101 tomorrow, what is the single most important thing you'd want them to know that isn't in any document?"
  ],
  "asset_id": "T-101",
  "expert_name": "Ramesh Kumar",
  "focus_areas": ["fault history", "early warning signs", "seasonal behavior", "undocumented procedures"]
}
```

**Schema validation:**
```python
def validate_guru_opening_output(data: dict) -> bool:
    if "questions" not in data:
        return False
    if not isinstance(data["questions"], list):
        return False
    if len(data["questions"]) < 5:  # Require at least 5 questions
        return False
    if any(len(q) < 20 for q in data["questions"]):
        return False
    return True
```

---

## 4. Guru Mode — Follow-up Question Generation Prompt

**File:** `app/prompts/guru_followup.py`  
**Called by:** `app/services/guru/session.py → generate_followup()`  
**Model:** `meta-llama/llama-3.3-70b-instruct:free`  
**Frequency:** Only when the pre-generated question queue is exhausted and the interview continues

### 4.1 System Prompt

```python
GURU_FOLLOWUP_SYSTEM = """You are the SMRITI Knowledge Capture Engine continuing a structured interview with a plant expert.

Review the conversation so far and the expert's most recent answer. Generate a single follow-up question that:

1. Digs deeper into something interesting or incomplete in the last answer
2. Does NOT repeat ground already covered in the conversation
3. Targets specific details: exact measurements, time periods, part numbers, failure sequences
4. Remains focused on practical, actionable knowledge

Rules:
- One question only. Not a list.
- If the expert's answer was comprehensive and there is nothing valuable to follow up on, return null for the question field.
- Maximum 2 sentences.

Output ONLY valid JSON."""
```

### 4.2 User Message Template

```python
def build_guru_followup_prompt(
    asset_id: str,
    conversation: list[dict],
    last_answer: str,
) -> str:
    # Format conversation history (last 6 exchanges to stay under token limit)
    history = []
    for msg in conversation[-12:]:  # 12 messages = ~6 Q&A pairs
        prefix = "SMRITI" if msg["role"] == "interviewer" else "Expert"
        history.append(f"{prefix}: {msg['content']}")
    history_text = "\n\n".join(history)

    return f"""Asset: {asset_id}

=== CONVERSATION SO FAR ===
{history_text}
=== END CONVERSATION ===

Expert's most recent answer: "{last_answer}"

Generate one focused follow-up question, or null if the conversation is complete."""
```

### 4.3 Output Schema

```json
{
  "question": "You mentioned the vibration increases before the fault — can you be more specific about the timeline? Does this happen hours before, or days before the actual trip?",
  "reasoning": "Expert mentioned vibration as a precursor but did not specify the time window — this is critical for preventive maintenance scheduling."
}
```

**If no follow-up is needed:**
```json
{
  "question": null,
  "reasoning": "Expert's answer was comprehensive. This line of inquiry is complete."
}
```

---

## 5. Cross-Asset Relevance Scoring Prompt *(Optional Enhancement)*

**File:** `app/prompts/relevance.py`  
**Called by:** `app/services/rag/engine.py → _find_relevant_assets()` when no asset ID is found in query  
**Frequency:** Low — only for general queries like "which assets are most at risk?"

### 5.1 System Prompt

```python
RELEVANCE_SCORING_SYSTEM = """You are an industrial asset relevance classifier.

Given a user query and a list of available asset IDs with their types, identify which assets are most relevant to the query.

Return a ranked list of asset IDs, most relevant first.
Maximum 3 assets.

Output ONLY valid JSON. No explanation."""
```

### 5.2 User Message Template

```python
def build_relevance_prompt(query: str, asset_list: list[dict]) -> str:
    asset_summary = "\n".join(
        f"- {a['asset_id']} ({a['asset_type']}): {a['item_count']} knowledge items, debt score {a['debt_score']}"
        for a in asset_list
    )
    return f"""Query: "{query}"

Available assets:
{asset_summary}

Which assets (max 3) are most relevant to this query?"""
```

### 5.3 Output Schema

```json
{
  "relevant_asset_ids": ["T-101", "UPS-01"],
  "reasoning": "Query asks about critical assets. T-101 has highest debt score (87, CRITICAL) and UPS-01 is high-criticality power infrastructure."
}
```

---

## 6. Prompt Management — Code Structure

### `app/prompts/__init__.py`

```python
# Central import point for all prompts
from .tag_extraction import (
    TAG_EXTRACTION_SYSTEM,
    build_tag_extraction_prompt,
    validate_tag_extraction_output,
)
from .query_synthesis import (
    QUERY_SYNTHESIS_SYSTEM,
    build_query_prompt,
    validate_query_output,
)
from .guru_opening import (
    GURU_OPENING_SYSTEM,
    build_guru_opening_prompt,
    validate_guru_opening_output,
)
from .guru_followup import (
    GURU_FOLLOWUP_SYSTEM,
    build_guru_followup_prompt,
)

__all__ = [
    "TAG_EXTRACTION_SYSTEM",
    "build_tag_extraction_prompt",
    "validate_tag_extraction_output",
    "QUERY_SYNTHESIS_SYSTEM",
    "build_query_prompt",
    "validate_query_output",
    "GURU_OPENING_SYSTEM",
    "build_guru_opening_prompt",
    "validate_guru_opening_output",
    "GURU_FOLLOWUP_SYSTEM",
    "build_guru_followup_prompt",
]
```

---

## 7. Token Budget & Cost

### Per Operation

| Operation | Model | System Tokens | User Tokens (avg) | Output Tokens | Total (avg) |
|---|---|---|---|---|---|
| Tag Extraction (per batch) | `cohere/north-mini-code:free` | ~450 | ~2,000 | 2,048 | ~4,500 |
| Query Synthesis | `meta-llama/llama-3.3-70b-instruct:free` | ~380 | ~1,500 | 4,096 | ~5,976 |
| Guru Opening Questions | `meta-llama/llama-3.3-70b-instruct:free` | ~420 | ~600 | 1,024 | ~2,044 |
| Guru Follow-up | `meta-llama/llama-3.3-70b-instruct:free` | ~150 | ~800 | 512 | ~1,462 |

### Demo Scenario Cost

```
All models are $0/token on OpenRouter free tier.

Document ingestion (50-page PDF = 10 batches):
  Model:   cohere/north-mini-code:free
  Tokens:  10 × 4,500 = 45,000
  Cost:    $0.00
  Time:    10 batches × 707ms median = ~7 seconds LLM time

3 demo voice queries:
  Model:   meta-llama/llama-3.3-70b-instruct:free
  Tokens:  3 × 5,976 = ~18,000
  Cost:    $0.00

1 Guru Mode session (8 questions + 5 follow-ups):
  Model:   meta-llama/llama-3.3-70b-instruct:free
  Tokens:  13 × 2,000 = ~26,000
  Cost:    $0.00

Total demo cost:  $0.00
```

> **Free tier rate limits to watch:** OpenRouter free models may be rate-limited under high concurrent load. If the demo runs into rate limit errors, activate the `poolside/laguna-xs2:free` fallback in `config.py` by setting `QUERY_MODEL=poolside/laguna-xs2:free`.

---

## 8. Prompt Versioning Strategy

### Version Tagging

```python
# In each prompt file, track version for debugging
PROMPT_VERSION = "1.1.0"
PROMPT_LAST_TESTED = "2026-06-22"

# Per-role model IDs (match exactly to OpenRouter route IDs)
EXTRACTION_MODEL = "cohere/north-mini-code:free"
QUERY_MODEL      = "meta-llama/llama-3.3-70b-instruct:free"
QUERY_FALLBACK   = "poolside/laguna-xs2:free"
```

### Regression Testing

```python
# tests/unit/test_prompts.py
import json
import pytest

SAMPLE_TAG_OUTPUT = """{"chunks": [{"asset_id": "UPS-01", "asset_type": "UPS", "content": "Test content about UPS-01.", "source_page": 1, "source_section": "Test", "confidence": 1.0}]}"""

def test_tag_extraction_schema_validation():
    data = json.loads(SAMPLE_TAG_OUTPUT)
    assert validate_tag_extraction_output(data) is True

def test_tag_extraction_rejects_missing_asset_id():
    data = {"chunks": [{"content": "test", "source_page": 1, "confidence": 1.0}]}
    assert validate_tag_extraction_output(data) is False

def test_tag_extraction_rejects_empty_chunks():
    data = json.loads('{"chunks": []}')
    # Empty is valid (page had no equipment references)
    assert validate_tag_extraction_output(data) is True
```

---

## 9. Prompt Anti-Patterns — What NOT To Do

### ❌ Anti-pattern 1: Open-ended output format

```python
# BAD — Claude will explain what it's doing, add markdown, vary structure
system = "Extract equipment information from the document."

# GOOD — Explicit JSON mandate with schema threat
system = "... You MUST respond with ONLY valid JSON. No preamble, no markdown fences."
```

### ❌ Anti-pattern 2: Unrestricted hallucination

```python
# BAD — Claude will fill gaps with plausible maintenance facts
system = "Answer questions about the equipment based on your knowledge."

# GOOD — Strict grounding mandate
system = "Answer ONLY from the provided thread context. Do not hallucinate facts."
```

### ❌ Anti-pattern 3: Language mismatch for Hinglish

```python
# BAD — Forces English response for Hinglish query
system = "Always respond in English."

# GOOD — Language mirroring
system = "Respond in the SAME language as the user's query. If Hinglish, respond in Hinglish."
```

### ❌ Anti-pattern 4: Missing citation mandate

```python
# BAD — Claude will synthesize answers without attribution
system = "Answer maintenance questions based on the context provided."

# GOOD — Explicit citation requirement per claim
system = "Every factual claim MUST be backed by at least one citation referencing the source document, page, and item_id."
```

### ❌ Anti-pattern 5: Multi-part Guru questions

```python
# BAD — Overwhelming the expert
"What is the vibration profile and what are the common fault modes and how do they relate to seasonal temperature changes?"

# GOOD — Single focused question
"What early warning signs do you personally watch for with T-101 before a fault develops?"
```

---

## 10. Prompt Testing Checklist (Pre-Demo)

### Tag Extraction
- [ ] Upload Schneider UPS-01 manual → verify `UPS-01` tag appears in output
- [ ] Upload a document with no equipment tags → verify empty `chunks` array, no error
- [ ] Upload a scanned (OCR) page → verify extraction still works with imperfect text
- [ ] Verify no hallucinated asset IDs appear that aren't in the source text

### Query Synthesis
- [ ] Submit `"UPS-01 mein last month kya issues aaye?"` → verify Hinglish response
- [ ] Submit `"T-101 ka last maintenance kab hua?"` → verify Hindi response  
- [ ] Submit `"What is the battery capacity of UPS-01?"` → verify English response
- [ ] Submit a query for a non-existent asset → verify graceful "no thread found" response
- [ ] Submit a query with no matching context → verify `"confidence": "low"` in response

### Guru Mode
- [ ] Start session for T-101 with Ramesh Kumar → verify 8 questions generated
- [ ] Verify questions target T-101 specifically (not generic transformer questions)
- [ ] Submit 3 answers → verify follow-up questions are contextually appropriate
- [ ] Verify follow-up question does not repeat a question already asked

---

*Document version 1.0 — SMRITI Prompt Engineering Guide — ET AI Hackathon 2026*
