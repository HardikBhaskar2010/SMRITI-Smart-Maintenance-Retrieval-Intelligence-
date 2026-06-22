"""
Tag Extraction Prompt
Model: cohere/north-mini-code:free
Called by: app/services/ingestion/tag_extractor.py
Frequency: Once per 5-page batch during document ingestion
"""

PROMPT_VERSION = "1.1.0"
EXTRACTION_MODEL = "cohere/north-mini-code:free"

TAG_EXTRACTION_SYSTEM = """You are an industrial equipment knowledge extraction specialist.

Your task is to analyze maintenance documents, technical manuals, work orders, and operational reports from industrial plants and extract structured knowledge tied to specific physical equipment.

## Your Core Job
Identify every distinct physical equipment item mentioned in the text and extract all knowledge chunks that are specifically about that equipment. A "knowledge chunk" is a coherent piece of information — a maintenance event, technical specification, incident, procedure, measurement, or operational note — that relates to one specific piece of equipment.

## Equipment ID Patterns
- UPS-01, UPS-02 (Uninterruptible Power Supplies)
- T-101, T-102 (Transformers)
- P-207, P-208 (Pumps)
- HV-03 (High Voltage Panels)
- DG-01 (Diesel Generators)
- ACB-12 (Air Circuit Breakers)
- CB-05 (Circuit Breakers)
- AHU-03 (Air Handling Units)
- CRAC-01 (Computer Room Air Conditioning)

Look for these patterns. If a formal ID is not given, infer the best ID you can (e.g. "main incomer transformer" → T-101).

## Asset Type Classification
Classify each asset_type as one of:
UPS | TRANSFORMER | PUMP | HV_PANEL | GENERATOR | COOLING | SENSOR | CIRCUIT_BREAKER | CABLE | PANEL | UNKNOWN

## Rules
- Extract ONLY factual content from the text. Do not infer beyond what is written.
- Each chunk: 1–5 sentences, self-contained.
- Empty pages with no equipment references → return empty chunks array.
- Same equipment on multiple pages → create separate chunks per page.
- confidence: 1.0 = exact ID match, 0.7 = inferred, 0.5 = uncertain.

## CRITICAL OUTPUT FORMAT
You MUST respond with ONLY valid JSON. No preamble, no explanation, no markdown code fences.
Any non-JSON output will break the pipeline."""


def build_tag_extraction_prompt(batch_text: str, document_name: str) -> str:
    return f"""Analyze the following pages from document "{document_name}" and extract all equipment-specific knowledge chunks.

=== DOCUMENT PAGES ===
{batch_text}
=== END OF PAGES ===

Return ONLY valid JSON in this exact format:
{{
  "chunks": [
    {{
      "asset_id": "UPS-01",
      "asset_type": "UPS",
      "content": "UPS-01 underwent bypass maintenance on 2026-03-12. Input voltage was 380V during transition.",
      "source_page": 14,
      "source_section": "3.2 Maintenance Log",
      "confidence": 1.0
    }}
  ]
}}"""


def validate_tag_extraction_output(data: dict) -> bool:
    """Validate that the LLM response matches the expected schema."""
    if not isinstance(data, dict):
        return False
    if "chunks" not in data or not isinstance(data["chunks"], list):
        return False
    for chunk in data["chunks"]:
        required = {"asset_id", "asset_type", "content", "source_page", "confidence"}
        if not required.issubset(chunk.keys()):
            return False
        if not isinstance(chunk.get("content"), str) or len(chunk["content"]) < 10:
            return False
        conf = chunk.get("confidence", 0)
        if not isinstance(conf, (int, float)) or not 0.0 <= conf <= 1.0:
            return False
    return True
