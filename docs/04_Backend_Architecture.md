# SMRITI — Backend Architecture

**Document Type:** Backend Implementation Specification  
**Project:** SMRITI — Smart Maintenance & Retrieval Intelligence  
**Version:** 1.0  
**Date:** June 2026  
**Stack:** FastAPI · Python 3.11 · ChromaDB · NetworkX · Claude API (via OpenRouter)

---

## 1. Project Structure

```
smriti-backend/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI app, lifespan, CORS
│   ├── config.py                  # Settings (pydantic-settings)
│   ├── dependencies.py            # Shared DI: db, llm client
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── ingest.py              # POST /api/ingest
│   │   ├── assets.py              # GET /api/assets, /api/assets/{id}
│   │   ├── query.py               # POST /api/query
│   │   ├── guru.py                # /api/guru/*
│   │   ├── graph.py               # GET /api/graph
│   │   └── ws.py                  # WebSocket /ws/ingest-progress
│   │
│   ├── services/
│   │   ├── ingestion/
│   │   │   ├── pipeline.py        # Orchestrates full ingestion flow
│   │   │   ├── extractor.py       # PDF/DOCX/image text extraction
│   │   │   ├── tag_extractor.py   # Claude: extract equipment tags
│   │   │   └── deduplicator.py    # Content hash deduplication
│   │   ├── rag/
│   │   │   ├── engine.py          # Asset-Thread query orchestration
│   │   │   └── retriever.py       # ChromaDB thread retrieval
│   │   ├── debt/
│   │   │   └── scorer.py          # Knowledge Debt Score computation
│   │   ├── guru/
│   │   │   ├── session.py         # Session state management
│   │   │   └── interviewer.py     # Claude-powered interview logic
│   │   └── claude/
│   │       └── client.py          # OpenRouter/Claude API wrapper
│   │
│   ├── db/
│   │   ├── chroma.py              # ChromaDB client singleton
│   │   ├── graph.py               # NetworkX graph singleton
│   │   └── session_store.py       # In-memory Guru session store
│   │
│   ├── models/
│   │   ├── asset.py               # AssetThread, ThreadItem Pydantic models
│   │   ├── query.py               # QueryRequest, QueryResponse
│   │   ├── ingest.py              # IngestRequest, IngestProgress
│   │   └── guru.py                # GuruSession, GuruMessage
│   │
│   └── utils/
│       ├── hash.py                # Content fingerprinting
│       ├── tag_normalizer.py      # UPS-01, ups_01 → "UPS-01"
│       └── logger.py              # Structured logging setup
│
├── data/
│   ├── chromadb/                  # ChromaDB persistence directory
│   ├── uploads/                   # Uploaded document storage
│   └── sessions/                  # Guru session transcripts (JSON)
│
├── tests/
│   ├── unit/
│   │   ├── test_scorer.py
│   │   ├── test_tag_extractor.py
│   │   └── test_deduplicator.py
│   └── integration/
│       ├── test_ingest_pipeline.py
│       └── test_rag_engine.py
│
├── .env                           # Never committed — see .env.example
├── .env.example
├── requirements.txt
├── requirements-dev.txt
└── README.md
```

---

## 2. App Initialization

### `app/main.py`

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.chroma import init_chroma
from app.db.graph import init_graph
from app.api import ingest, assets, query, guru, graph, ws
from app.config import settings
from app.utils.logger import setup_logging

setup_logging()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize persistent stores
    init_chroma(persist_dir=settings.CHROMA_PERSIST_DIR)
    init_graph()
    yield
    # Shutdown: graceful cleanup (ChromaDB auto-persists)

app = FastAPI(
    title="SMRITI API",
    description="Smart Maintenance & Retrieval Intelligence — Backend",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:4173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(ingest.router,  prefix="/api", tags=["Ingestion"])
app.include_router(assets.router,  prefix="/api", tags=["Assets"])
app.include_router(query.router,   prefix="/api", tags=["Query"])
app.include_router(guru.router,    prefix="/api", tags=["Guru Mode"])
app.include_router(graph.router,   prefix="/api", tags=["Graph"])
app.include_router(ws.router,      tags=["WebSocket"])

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "smriti-api"}
```

### `app/config.py`

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    OPENROUTER_API_KEY: str
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"

    # Two-model routing strategy (all free on OpenRouter)
    # Extraction: code-trained model → strongest JSON adherence, 707ms, 89 t/s
    EXTRACTION_MODEL: str = "cohere/north-mini-code:free"
    # Query + Guru: best open-source multilingual model for Hinglish support
    QUERY_MODEL: str = "meta-llama/llama-3.3-70b-instruct:free"
    # Fallback: 102B, 1098ms published median, reliable for demo day
    QUERY_FALLBACK_MODEL: str = "poolside/laguna-xs2:free"

    CHROMA_PERSIST_DIR: str = "./data/chromadb"
    UPLOAD_DIR: str = "./data/uploads"
    SESSION_DIR: str = "./data/sessions"
    PORT: int = 8000

    class Config:
        env_file = ".env"

settings = Settings()
```

---

## 3. Pydantic Data Models

### `app/models/asset.py`

```python
from pydantic import BaseModel, Field
from typing import Literal, Optional
from datetime import datetime
import uuid

class ThreadItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    content: str
    source_document: str
    source_page: Optional[int] = None
    source_section: Optional[str] = None
    added_by: Literal["ingestion_pipeline", "guru_mode", "manual"] = "ingestion_pipeline"
    added_at: datetime = Field(default_factory=datetime.utcnow)
    embedding_model: str = "text-embedding-3-small"
    expert_attributed: bool = False
    content_hash: str = ""  # For deduplication

class KnowledgeDebt(BaseModel):
    score: int = Field(ge=0, le=100)
    severity: Literal["OK", "WARNING", "CRITICAL"]
    document_coverage: float = Field(ge=0.0, le=1.0)
    expert_count: int = Field(ge=0)
    recency_days: int = 0
    operational_criticality: float = Field(default=0.5, ge=0.0, le=1.0)
    last_updated: datetime = Field(default_factory=datetime.utcnow)

class AssetThread(BaseModel):
    asset_id: str                        # e.g. "UPS-01"
    asset_type: str                      # e.g. "UPS"
    display_name: str = ""
    thread_items: list[ThreadItem] = []
    knowledge_debt: KnowledgeDebt
    experts: list[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_updated: datetime = Field(default_factory=datetime.utcnow)

class AssetSummary(BaseModel):
    """Lightweight version for list endpoints"""
    asset_id: str
    asset_type: str
    display_name: str
    debt_score: int
    severity: Literal["OK", "WARNING", "CRITICAL"]
    item_count: int
    expert_count: int
    last_updated: datetime
```

### `app/models/ingest.py`

```python
from pydantic import BaseModel
from typing import Optional

class IngestProgress(BaseModel):
    """Sent over WebSocket during ingestion"""
    stage: str                   # "extracting", "tagging", "embedding", "done", "error"
    document_name: str
    pages_processed: int = 0
    total_pages: int = 0
    tags_found: list[str] = []
    items_embedded: int = 0
    error: Optional[str] = None

class IngestResult(BaseModel):
    document_name: str
    tags_created: list[str]
    tags_updated: list[str]
    total_items_added: int
    duration_seconds: float
    duplicate_items_skipped: int
```

### `app/models/query.py`

```python
from pydantic import BaseModel
from typing import Optional

class QueryRequest(BaseModel):
    query: str
    max_results: int = 5
    asset_id: Optional[str] = None  # Force-scope to one asset if provided

class Citation(BaseModel):
    source_document: str
    source_page: Optional[int]
    source_section: Optional[str]
    item_id: str

class QueryResponse(BaseModel):
    answer: str
    asset_ids_used: list[str]
    citations: list[Citation]
    thread_items_retrieved: int
    response_time_ms: int
```

### `app/models/guru.py`

```python
from pydantic import BaseModel, Field
from typing import Literal
from datetime import datetime
import uuid

class GuruMessage(BaseModel):
    role: Literal["system", "interviewer", "expert"]
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    embedded: bool = False          # Has this answer been added to thread?
    item_id: Optional[str] = None  # Thread item ID if embedded

class GuruSession(BaseModel):
    session_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    asset_id: str
    expert_name: str
    started_at: datetime = Field(default_factory=datetime.utcnow)
    messages: list[GuruMessage] = []
    questions_asked: int = 0
    knowledge_added: int = 0
    initial_debt_score: int = 0
    current_debt_score: int = 0
    status: Literal["active", "completed", "abandoned"] = "active"

class GuruStartRequest(BaseModel):
    asset_id: str
    expert_name: str

class GuruRespondRequest(BaseModel):
    session_id: str
    answer: str
```

---

## 4. ChromaDB Architecture

### `app/db/chroma.py`

```python
import chromadb
from chromadb.config import Settings
from typing import Optional

_client: Optional[chromadb.PersistentClient] = None

def init_chroma(persist_dir: str):
    global _client
    _client = chromadb.PersistentClient(
        path=persist_dir,
        settings=Settings(anonymized_telemetry=False),
    )

def get_chroma() -> chromadb.PersistentClient:
    if _client is None:
        raise RuntimeError("ChromaDB not initialized — call init_chroma() first")
    return _client
```

### Collection Naming Convention

```
# One collection per asset tag
Collection name: "asset__{asset_id_normalized}"
Examples:
  UPS-01   → "asset__ups_01"
  T-101    → "asset__t_101"
  Pump P-207 → "asset__pump_p_207"

# Normalization rule: lowercase, replace hyphens/spaces with underscore
def normalize_asset_id(asset_id: str) -> str:
    import re
    return "asset__" + re.sub(r'[\s\-/]+', '_', asset_id.lower())
```

### Thread Item Metadata Schema (ChromaDB)

```python
# Stored per document in ChromaDB:
metadata = {
    "asset_id":        "UPS-01",
    "source_document": "Railtel_CDC_Level2_March.docx",
    "source_page":     14,
    "source_section":  "3.2 Maintenance Log",
    "added_by":        "ingestion_pipeline",
    "added_at":        "2026-06-01T10:23:00Z",
    "expert_attributed": False,
    "content_hash":    "sha256:abc123...",
}
```

---

## 5. Document Ingestion Pipeline

### `app/services/ingestion/pipeline.py`

```python
import asyncio, time, hashlib
from pathlib import Path
from app.services.ingestion.extractor import extract_text
from app.services.ingestion.tag_extractor import extract_equipment_tags
from app.services.claude.client import ClaudeClient
from app.db.chroma import get_chroma
from app.db.graph import get_graph
from app.services.debt.scorer import recalculate_debt
from app.utils.tag_normalizer import normalize_asset_id
from app.models.ingest import IngestProgress, IngestResult
from typing import AsyncGenerator

async def run_ingestion(
    file_path: Path,
    document_name: str,
    progress_callback: AsyncGenerator[IngestProgress, None] | None = None,
) -> IngestResult:
    start = time.time()
    claude = ClaudeClient()
    chroma = get_chroma()
    graph = get_graph()

    # Stage 1: Extract text from document
    await _emit(progress_callback, IngestProgress(
        stage="extracting", document_name=document_name
    ))
    pages = await asyncio.to_thread(extract_text, file_path)  # Returns list of (page_num, text)

    # Stage 2: Extract equipment tags via Claude
    await _emit(progress_callback, IngestProgress(
        stage="tagging", document_name=document_name,
        total_pages=len(pages)
    ))
    tagged_chunks = await extract_equipment_tags(claude, pages, document_name)
    # tagged_chunks: list[{asset_id, content, source_page, source_section, confidence}]

    # Stage 3: Embed and store per-asset
    tags_created, tags_updated = set(), set()
    items_added, items_skipped = 0, 0

    await _emit(progress_callback, IngestProgress(
        stage="embedding", document_name=document_name,
        tags_found=list({c["asset_id"] for c in tagged_chunks})
    ))

    for chunk in tagged_chunks:
        asset_id = chunk["asset_id"]
        collection_name = normalize_asset_id(asset_id)
        content_hash = hashlib.sha256(chunk["content"].encode()).hexdigest()

        # Get or create collection
        collection = chroma.get_or_create_collection(
            name=collection_name,
            metadata={"asset_id": asset_id}
        )

        # Deduplicate: skip if hash exists
        existing = collection.get(where={"content_hash": content_hash})
        if existing["ids"]:
            items_skipped += 1
            continue

        # Add to collection
        import uuid
        item_id = str(uuid.uuid4())
        collection.add(
            ids=[item_id],
            documents=[chunk["content"]],
            metadatas=[{
                "asset_id": asset_id,
                "source_document": document_name,
                "source_page": chunk.get("source_page", 0),
                "source_section": chunk.get("source_section", ""),
                "added_by": "ingestion_pipeline",
                "added_at": datetime.utcnow().isoformat(),
                "expert_attributed": False,
                "content_hash": content_hash,
            }]
        )
        items_added += 1

        # Track for response
        if collection.count() == 1:
            tags_created.add(asset_id)
        else:
            tags_updated.add(asset_id)

        # Update graph node
        if not graph.has_node(asset_id):
            graph.add_node(asset_id, item_count=1, asset_type=chunk.get("asset_type", "UNKNOWN"))
        else:
            graph.nodes[asset_id]["item_count"] += 1

    # Stage 4: Recalculate debt scores for all touched assets
    all_touched = tags_created | tags_updated
    for asset_id in all_touched:
        await recalculate_debt(asset_id)

    await _emit(progress_callback, IngestProgress(
        stage="done",
        document_name=document_name,
        items_embedded=items_added,
    ))

    return IngestResult(
        document_name=document_name,
        tags_created=list(tags_created),
        tags_updated=list(tags_updated - tags_created),
        total_items_added=items_added,
        duration_seconds=round(time.time() - start, 2),
        duplicate_items_skipped=items_skipped,
    )

async def _emit(callback, progress: IngestProgress):
    if callback:
        await callback(progress)
```

### `app/services/ingestion/extractor.py`

```python
from pathlib import Path
import fitz          # PyMuPDF
import docx
import pytesseract
from PIL import Image
import io

def extract_text(file_path: Path) -> list[tuple[int, str]]:
    """Returns list of (page_number, text) tuples"""
    suffix = file_path.suffix.lower()

    if suffix == ".pdf":
        return _extract_pdf(file_path)
    elif suffix == ".docx":
        return _extract_docx(file_path)
    elif suffix in (".png", ".jpg", ".jpeg", ".tiff"):
        return _extract_image(file_path)
    else:
        raise ValueError(f"Unsupported file type: {suffix}")

def _extract_pdf(path: Path) -> list[tuple[int, str]]:
    doc = fitz.open(str(path))
    pages = []
    for i, page in enumerate(doc):
        text = page.get_text("text").strip()
        if not text:  # Scanned page — OCR fallback
            pix = page.get_pixmap(dpi=200)
            img = Image.open(io.BytesIO(pix.tobytes("png")))
            text = pytesseract.image_to_string(img, lang="eng")
        if text:
            pages.append((i + 1, text))
    return pages

def _extract_docx(path: Path) -> list[tuple[int, str]]:
    doc = docx.Document(str(path))
    # DOCX has no true page numbers — use paragraph index / 15 as proxy
    pages, current_page, buffer = [], 1, []
    for i, para in enumerate(doc.paragraphs):
        if para.text.strip():
            buffer.append(para.text.strip())
        if (i + 1) % 15 == 0:           # Treat every 15 paragraphs as a "page"
            if buffer:
                pages.append((current_page, "\n".join(buffer)))
                buffer = []
            current_page += 1
    if buffer:
        pages.append((current_page, "\n".join(buffer)))
    return pages

def _extract_image(path: Path) -> list[tuple[int, str]]:
    img = Image.open(str(path))
    text = pytesseract.image_to_string(img, lang="eng")
    return [(1, text)] if text.strip() else []
```

---

## 6. Equipment Tag Extraction

### `app/services/ingestion/tag_extractor.py`

```python
import json
from app.services.claude.client import ClaudeClient
from app.prompts import TAG_EXTRACTION_SYSTEM, build_tag_extraction_prompt

CHUNK_SIZE = 3000           # Characters per chunk sent to Claude
BATCH_SIZE = 5              # Pages per Claude call

async def extract_equipment_tags(
    claude: ClaudeClient,
    pages: list[tuple[int, str]],
    document_name: str,
) -> list[dict]:
    """
    Returns list of:
    {asset_id, asset_type, content, source_page, source_section, confidence}
    """
    all_chunks = []

    # Process pages in batches to stay under token limits
    for batch_start in range(0, len(pages), BATCH_SIZE):
        batch = pages[batch_start : batch_start + BATCH_SIZE]
        batch_text = "\n\n".join(
            f"[Page {pg}]\n{text[:CHUNK_SIZE]}"
            for pg, text in batch
        )

        response_text = await claude.extract(
            system_prompt=TAG_EXTRACTION_SYSTEM,
            user_message=build_tag_extraction_prompt(batch_text, document_name),
            max_tokens=2048,
        )
        # Uses: cohere/north-mini-code:free — fastest JSON extraction (707ms, 89 t/s)

        try:
            extracted = json.loads(response_text)
            # Expected: {"chunks": [{asset_id, asset_type, content, source_page, source_section, confidence}]}
            for chunk in extracted.get("chunks", []):
                if chunk.get("asset_id") and chunk.get("content"):
                    all_chunks.append(chunk)
        except json.JSONDecodeError:
            # Log and continue — don't let one bad batch kill the whole ingestion
            import logging
            logging.warning(f"Tag extraction JSON parse failed for batch starting page {batch_start}")

    return all_chunks
```

---

## 7. Asset-Thread RAG Engine

### `app/services/rag/engine.py`

```python
import re, time
from app.services.claude.client import ClaudeClient
from app.services.rag.retriever import retrieve_thread_context
from app.models.query import QueryRequest, QueryResponse, Citation
from app.prompts import QUERY_SYNTHESIS_SYSTEM, build_query_prompt

# Regex to detect asset IDs in queries: UPS-01, T-101, P-207, HV-03, etc.
ASSET_ID_PATTERN = re.compile(
    r'\b([A-Z]{1,5}[-\s]?\d{2,4}[A-Z]?)\b', re.IGNORECASE
)

async def run_query(request: QueryRequest) -> QueryResponse:
    start_ms = int(time.time() * 1000)
    claude = ClaudeClient()

    # Step 1: Identify asset IDs mentioned in query
    if request.asset_id:
        asset_ids = [request.asset_id]
    else:
        matches = ASSET_ID_PATTERN.findall(request.query)
        asset_ids = list({m.upper() for m in matches}) if matches else []

    if not asset_ids:
        # No specific asset — do cross-asset semantic search
        asset_ids = await _find_relevant_assets(request.query)

    # Step 2: Retrieve thread context for each asset
    thread_contexts = []
    for asset_id in asset_ids:
        ctx = await retrieve_thread_context(
            asset_id=asset_id,
            query=request.query,
            max_items=request.max_results,
        )
        if ctx:
            thread_contexts.append(ctx)

    if not thread_contexts:
        return QueryResponse(
            answer="No asset threads found matching your query. Please check the asset ID or upload relevant documents first.",
            asset_ids_used=[],
            citations=[],
            thread_items_retrieved=0,
            response_time_ms=int(time.time() * 1000) - start_ms,
        )

    # Step 3: Synthesize answer via LLM (Llama 3.3 70B — multilingual, Hinglish-capable)
    context_text = _format_context(thread_contexts)
    answer_json = await claude.query(
        system_prompt=QUERY_SYNTHESIS_SYSTEM,
        user_message=build_query_prompt(request.query, context_text),
        max_tokens=4096,
    )
    # Falls back to poolside/laguna-xs2:free automatically on rate-limit

    import json
    parsed = json.loads(answer_json)

    return QueryResponse(
        answer=parsed["answer"],
        asset_ids_used=[ctx["asset_id"] for ctx in thread_contexts],
        citations=[Citation(**c) for c in parsed.get("citations", [])],
        thread_items_retrieved=sum(len(ctx["items"]) for ctx in thread_contexts),
        response_time_ms=int(time.time() * 1000) - start_ms,
    )

def _format_context(thread_contexts: list[dict]) -> str:
    parts = []
    for ctx in thread_contexts:
        parts.append(f"=== ASSET: {ctx['asset_id']} ===")
        for i, item in enumerate(ctx["items"]):
            parts.append(
                f"[{i+1}] Source: {item['source_document']} (p.{item['source_page']})\n"
                f"Date: {item['added_at']}\n"
                f"Content: {item['content']}"
            )
    return "\n\n".join(parts)

async def _find_relevant_assets(query: str) -> list[str]:
    """Cross-asset search when no specific ID is mentioned"""
    from app.db.chroma import get_chroma
    chroma = get_chroma()
    all_collections = chroma.list_collections()
    results = []
    for col in all_collections[:10]:          # Limit to 10 assets for performance
        coll = chroma.get_collection(col.name)
        res = coll.query(query_texts=[query], n_results=1)
        if res["distances"][0] and res["distances"][0][0] < 0.5:  # similarity threshold
            results.append(col.metadata.get("asset_id", col.name))
    return results[:3]                        # Return top 3 most relevant
```

### `app/services/rag/retriever.py`

```python
from app.db.chroma import get_chroma
from app.utils.tag_normalizer import normalize_asset_id

async def retrieve_thread_context(
    asset_id: str,
    query: str,
    max_items: int = 5,
) -> dict | None:
    chroma = get_chroma()
    collection_name = normalize_asset_id(asset_id)

    try:
        collection = chroma.get_collection(collection_name)
    except Exception:
        return None      # Asset thread doesn't exist yet

    if collection.count() == 0:
        return None

    # Semantic search within asset thread
    results = collection.query(
        query_texts=[query],
        n_results=min(max_items, collection.count()),
        include=["documents", "metadatas", "distances"],
    )

    items = []
    for doc, meta, dist in zip(
        results["documents"][0],
        results["metadatas"][0],
        results["distances"][0],
    ):
        items.append({
            "content": doc,
            "source_document": meta.get("source_document", "Unknown"),
            "source_page": meta.get("source_page", 0),
            "source_section": meta.get("source_section", ""),
            "added_at": meta.get("added_at", ""),
            "item_id": results["ids"][0][len(items)],
            "similarity_score": round(1 - dist, 3),
        })

    return {
        "asset_id": asset_id,
        "items": items,
        "total_thread_size": collection.count(),
    }
```

---

## 8. Knowledge Debt Score Service

### `app/services/debt/scorer.py`

```python
from datetime import datetime, timezone
from app.db.chroma import get_chroma
from app.utils.tag_normalizer import normalize_asset_id

# Criticality map: asset type → default operational criticality (0.0–1.0)
DEFAULT_CRITICALITY = {
    "TRANSFORMER": 0.95,
    "UPS": 0.90,
    "HV_PANEL": 0.85,
    "PUMP": 0.70,
    "GENERATOR": 0.80,
    "COOLING": 0.65,
    "SENSOR": 0.40,
    "UNKNOWN": 0.50,
}

def calculate_debt_score(
    item_count: int,
    expert_count: int,
    last_updated_iso: str,
    operational_criticality: float = 0.5,
    doc_coverage: float | None = None,
) -> dict:
    """
    Returns {"score": int, "severity": str, "breakdown": dict}
    """
    # 1. Document coverage score (30 pts max)
    # Heuristic: 0 items=no coverage, 50+ items=full coverage
    coverage = min(1.0, item_count / 50.0) if doc_coverage is None else doc_coverage
    doc_penalty = (1.0 - coverage) * 30

    # 2. Expert distribution score (35 pts max)
    # 1 expert = full penalty; 3+ experts = zero penalty
    expert_penalty = max(0.0, (1.0 - min(expert_count, 3) / 3.0)) * 35

    # 3. Recency score (20 pts max)
    try:
        last_dt = datetime.fromisoformat(last_updated_iso.replace("Z", "+00:00"))
        days_old = (datetime.now(timezone.utc) - last_dt).days
    except (ValueError, AttributeError):
        days_old = 365
    # 0 days = no penalty; 365+ days = full penalty
    recency_penalty = min(1.0, days_old / 365.0) * 20

    # 4. Criticality multiplier (15 pts max)
    crit_penalty = operational_criticality * 15

    raw_score = doc_penalty + expert_penalty + recency_penalty + crit_penalty
    score = min(100, int(raw_score))

    if score <= 40:
        severity = "OK"
    elif score <= 70:
        severity = "WARNING"
    else:
        severity = "CRITICAL"

    return {
        "score": score,
        "severity": severity,
        "breakdown": {
            "doc_penalty": round(doc_penalty, 1),
            "expert_penalty": round(expert_penalty, 1),
            "recency_penalty": round(recency_penalty, 1),
            "crit_penalty": round(crit_penalty, 1),
        }
    }

async def recalculate_debt(asset_id: str) -> dict:
    """Pull live stats from ChromaDB and compute score"""
    chroma = get_chroma()
    collection_name = normalize_asset_id(asset_id)

    try:
        col = chroma.get_collection(collection_name)
    except Exception:
        return {}

    # Get all metadata to compute stats
    all_items = col.get(include=["metadatas"])
    metas = all_items["metadatas"]

    experts = {m.get("expert_name", "") for m in metas if m.get("expert_attributed")}
    experts.discard("")

    # Get most recent item timestamp
    timestamps = [m.get("added_at", "") for m in metas if m.get("added_at")]
    last_updated = max(timestamps) if timestamps else datetime.utcnow().isoformat()

    asset_type = col.metadata.get("asset_type", "UNKNOWN").upper().replace(" ", "_")
    criticality = DEFAULT_CRITICALITY.get(asset_type, 0.5)

    return calculate_debt_score(
        item_count=col.count(),
        expert_count=max(1, len(experts)),  # At least 1 (the ingestion engineer)
        last_updated_iso=last_updated,
        operational_criticality=criticality,
    )
```

---

## 9. Guru Mode — Interview Engine

### `app/services/guru/session.py`

```python
import json
from pathlib import Path
from app.models.guru import GuruSession, GuruMessage, GuruStartRequest
from app.db.session_store import get_session_store
from app.services.guru.interviewer import generate_opening_questions
from app.services.claude.client import ClaudeClient
from app.services.debt.scorer import recalculate_debt
from app.db.chroma import get_chroma
from app.utils.tag_normalizer import normalize_asset_id
from app.config import settings

async def start_guru_session(request: GuruStartRequest) -> GuruSession:
    store = get_session_store()
    claude = ClaudeClient()

    # Get existing debt score
    debt = await recalculate_debt(request.asset_id)

    session = GuruSession(
        asset_id=request.asset_id,
        expert_name=request.expert_name,
        initial_debt_score=debt.get("score", 50),
        current_debt_score=debt.get("score", 50),
    )

    # Generate opening questions based on knowledge gaps
    questions = await generate_opening_questions(
        claude=claude,
        asset_id=request.asset_id,
        expert_name=request.expert_name,
        existing_context=await _get_asset_summary(request.asset_id),
    )

    # Add first question as interviewer message
    session.messages.append(GuruMessage(
        role="interviewer",
        content=questions[0],
    ))
    session.questions_asked = 1

    # Store remaining questions for follow-up
    store.set_pending_questions(session.session_id, questions[1:])
    store.save_session(session)

    return session

async def process_expert_answer(
    session_id: str,
    answer: str,
) -> dict:
    store = get_session_store()
    session = store.get_session(session_id)
    if not session or session.status != "active":
        raise ValueError("Session not found or not active")

    chroma = get_chroma()
    claude = ClaudeClient()

    # Add expert answer to messages
    session.messages.append(GuruMessage(role="expert", content=answer))

    # Embed the answer into the asset thread
    collection_name = normalize_asset_id(session.asset_id)
    col = chroma.get_or_create_collection(collection_name)

    import uuid, hashlib
    item_id = str(uuid.uuid4())
    content = f"Expert knowledge ({session.expert_name}): {answer}"
    content_hash = hashlib.sha256(content.encode()).hexdigest()

    col.add(
        ids=[item_id],
        documents=[content],
        metadatas=[{
            "asset_id": session.asset_id,
            "source_document": f"Guru_Session_{session.session_id[:8]}",
            "source_page": 0,
            "source_section": "Expert Interview",
            "added_by": "guru_mode",
            "added_at": datetime.utcnow().isoformat(),
            "expert_attributed": True,
            "expert_name": session.expert_name,
            "content_hash": content_hash,
        }]
    )

    session.knowledge_added += 1

    # Recalculate debt score
    new_debt = await recalculate_debt(session.asset_id)
    session.current_debt_score = new_debt.get("score", session.current_debt_score)

    # Generate next question (from pending queue or Claude follow-up)
    pending = store.get_pending_questions(session_id)
    if pending:
        next_question = pending.pop(0)
        store.set_pending_questions(session_id, pending)
    else:
        next_question = await generate_followup(
            claude=claude,
            asset_id=session.asset_id,
            conversation=session.messages,
            last_answer=answer,
        )

    if next_question:
        session.messages.append(GuruMessage(role="interviewer", content=next_question))
        session.questions_asked += 1

    store.save_session(session)

    return {
        "next_question": next_question,
        "knowledge_added": session.knowledge_added,
        "current_debt_score": session.current_debt_score,
        "debt_change": session.initial_debt_score - session.current_debt_score,
        "session": session,
    }

async def _get_asset_summary(asset_id: str) -> str:
    """Returns a brief text summary of what's in the asset thread"""
    chroma = get_chroma()
    col_name = normalize_asset_id(asset_id)
    try:
        col = chroma.get_collection(col_name)
        items = col.peek(limit=5)
        return "\n".join(items["documents"]) if items["documents"] else ""
    except Exception:
        return ""
```

---

## 10. Claude API Service Layer

### `app/services/claude/client.py`

```python
import httpx
import asyncio
import logging
from app.config import settings

logger = logging.getLogger(__name__)

class LLMClient:
    """
    OpenRouter client with two-model routing strategy.

    Routing logic:
      - EXTRACTION_MODEL (cohere/north-mini-code:free)
            → used by ingestion pipeline for JSON tag extraction
            → code-trained → best JSON-only instruction adherence
            → 707ms median, 89 t/s → fast batch processing

      - QUERY_MODEL (meta-llama/llama-3.3-70b-instruct:free)
            → used for RAG query synthesis + Guru Mode
            → proven multilingual: Hindi, Hinglish, English
            → 131k context handles full asset threads

      - QUERY_FALLBACK_MODEL (poolside/laguna-xs2:free)
            → activated if QUERY_MODEL returns rate-limit error (429)
            → 102B, 1098ms published median → reliable demo-day fallback
    """

    def __init__(self):
        self.base_url = settings.OPENROUTER_BASE_URL
        self.api_key = settings.OPENROUTER_API_KEY
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://smriti.local",
            "X-Title": "SMRITI",
        }

    async def extract(self, system_prompt: str, user_message: str,
                      max_tokens: int = 2048, retries: int = 2) -> str:
        """Use extraction model (Cohere North Mini Code) for JSON tag extraction."""
        return await self._complete(
            model=settings.EXTRACTION_MODEL,
            system_prompt=system_prompt,
            user_message=user_message,
            max_tokens=max_tokens,
            retries=retries,
        )

    async def query(self, system_prompt: str, user_message: str,
                    max_tokens: int = 4096, retries: int = 2) -> str:
        """Use query model (Llama 3.3 70B) for RAG synthesis + Guru Mode.
        Falls back to Laguna XS.2 on rate-limit error."""
        try:
            return await self._complete(
                model=settings.QUERY_MODEL,
                system_prompt=system_prompt,
                user_message=user_message,
                max_tokens=max_tokens,
                retries=retries,
            )
        except RateLimitError:
            logger.warning(
                f"Rate limit hit on {settings.QUERY_MODEL}. "
                f"Falling back to {settings.QUERY_FALLBACK_MODEL}."
            )
            return await self._complete(
                model=settings.QUERY_FALLBACK_MODEL,
                system_prompt=system_prompt,
                user_message=user_message,
                max_tokens=max_tokens,
                retries=1,
            )

    async def _complete(
        self,
        model: str,
        system_prompt: str,
        user_message: str,
        max_tokens: int = 2048,
        retries: int = 2,
    ) -> str:
        """
        Core completion call. Uses OpenAI-compatible chat completions API
        (works with OpenRouter for all three models).
        """
        payload = {
            "model": model,
            "max_tokens": max_tokens,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_message},
            ],
        }

        for attempt in range(retries + 1):
            try:
                async with httpx.AsyncClient(timeout=60.0) as client:
                    response = await client.post(
                        f"{self.base_url}/chat/completions",
                        headers=self.headers,
                        json=payload,
                    )
                    if response.status_code == 429:
                        raise RateLimitError(f"Rate limited on model: {model}")
                    response.raise_for_status()
                    data = response.json()
                    return data["choices"][0]["message"]["content"]

            except RateLimitError:
                raise   # Propagate immediately — handled by query() fallback

            except (httpx.HTTPStatusError, httpx.TimeoutException) as e:
                if attempt == retries:
                    raise RuntimeError(
                        f"LLM API failed after {retries} retries "
                        f"(model={model}): {e}"
                    )
                await asyncio.sleep(2 ** attempt)   # Exponential backoff: 1s, 2s

class RateLimitError(Exception):
    """Raised when OpenRouter returns HTTP 429 for a model."""
    pass

# Convenience: keep ClaudeClient as an alias to not break existing imports
ClaudeClient = LLMClient
```

---

## 11. WebSocket — Real-time Ingestion Progress

### `app/api/ws.py`

```python
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, UploadFile, File
from pathlib import Path
import asyncio, json, shutil, uuid
from app.services.ingestion.pipeline import run_ingestion
from app.config import settings

router = APIRouter()

@router.websocket("/ws/ingest")
async def ingest_websocket(websocket: WebSocket):
    await websocket.accept()
    try:
        # Receive file metadata first
        meta_raw = await websocket.receive_text()
        meta = json.loads(meta_raw)
        filename = meta["filename"]
        file_b64 = meta["data"]      # Base64 encoded file

        # Decode and save
        import base64
        file_bytes = base64.b64decode(file_b64)
        upload_path = Path(settings.UPLOAD_DIR) / f"{uuid.uuid4()}_{filename}"
        upload_path.parent.mkdir(parents=True, exist_ok=True)
        upload_path.write_bytes(file_bytes)

        # Run ingestion with progress callback
        async def progress_callback(progress):
            await websocket.send_text(progress.model_dump_json())

        result = await run_ingestion(
            file_path=upload_path,
            document_name=filename,
            progress_callback=progress_callback,
        )

        # Send final result
        await websocket.send_text(json.dumps({"type": "result", **result.model_dump()}))

    except WebSocketDisconnect:
        pass
    except Exception as e:
        await websocket.send_text(json.dumps({"type": "error", "message": str(e)}))
```

---

## 12. API Route Implementations

### `app/api/assets.py`

```python
from fastapi import APIRouter, HTTPException
from app.db.chroma import get_chroma
from app.services.debt.scorer import recalculate_debt
from app.utils.tag_normalizer import normalize_asset_id
from app.models.asset import AssetSummary, AssetThread

router = APIRouter()

@router.get("/assets", response_model=list[AssetSummary])
async def list_assets():
    chroma = get_chroma()
    collections = chroma.list_collections()
    summaries = []
    for col_info in collections:
        col = chroma.get_collection(col_info.name)
        asset_id = col.metadata.get("asset_id", col_info.name)
        debt = await recalculate_debt(asset_id)
        all_meta = col.get(include=["metadatas"])
        experts = {m.get("expert_name", "") for m in all_meta["metadatas"] if m.get("expert_attributed")}
        experts.discard("")
        timestamps = [m.get("added_at", "") for m in all_meta["metadatas"] if m.get("added_at")]

        summaries.append(AssetSummary(
            asset_id=asset_id,
            asset_type=col.metadata.get("asset_type", "UNKNOWN"),
            display_name=asset_id,
            debt_score=debt.get("score", 0),
            severity=debt.get("severity", "OK"),
            item_count=col.count(),
            expert_count=max(1, len(experts)),
            last_updated=max(timestamps) if timestamps else "1970-01-01T00:00:00Z",
        ))

    return sorted(summaries, key=lambda s: s.debt_score, reverse=True)

@router.get("/assets/{asset_id}")
async def get_asset(asset_id: str):
    chroma = get_chroma()
    col_name = normalize_asset_id(asset_id)
    try:
        col = chroma.get_collection(col_name)
    except Exception:
        raise HTTPException(status_code=404, detail=f"Asset thread not found: {asset_id}")

    all_items = col.get(include=["documents", "metadatas"])
    debt = await recalculate_debt(asset_id)

    return {
        "asset_id": asset_id,
        "item_count": col.count(),
        "debt": debt,
        "items": [
            {"content": doc, **meta}
            for doc, meta in zip(all_items["documents"], all_items["metadatas"])
        ]
    }
```

### `app/api/graph.py`

```python
from fastapi import APIRouter
from app.db.chroma import get_chroma
from app.services.debt.scorer import recalculate_debt

router = APIRouter()

@router.get("/graph")
async def get_graph_data():
    """Returns nodes + edges for the 3D visualization"""
    chroma = get_chroma()
    collections = chroma.list_collections()

    nodes = []
    for col_info in collections:
        col = chroma.get_collection(col_info.name)
        asset_id = col.metadata.get("asset_id", col_info.name)
        debt = await recalculate_debt(asset_id)
        nodes.append({
            "id": asset_id,
            "label": asset_id,
            "asset_type": col.metadata.get("asset_type", "UNKNOWN"),
            "item_count": col.count(),
            "debt_score": debt.get("score", 0),
            "severity": debt.get("severity", "OK"),
        })

    # Edges: assets that appear together in the same document
    edges = _compute_edges(chroma, collections)

    return {"nodes": nodes, "edges": edges}

def _compute_edges(chroma, collections):
    """Find assets that co-occur in the same source document"""
    doc_to_assets: dict[str, set] = {}
    for col_info in collections:
        col = chroma.get_collection(col_info.name)
        asset_id = col.metadata.get("asset_id", col_info.name)
        metas = col.get(include=["metadatas"])["metadatas"]
        for m in metas:
            doc = m.get("source_document", "")
            if doc:
                doc_to_assets.setdefault(doc, set()).add(asset_id)

    edges = []
    seen = set()
    for assets in doc_to_assets.values():
        assets_list = list(assets)
        for i in range(len(assets_list)):
            for j in range(i+1, len(assets_list)):
                pair = tuple(sorted([assets_list[i], assets_list[j]]))
                if pair not in seen:
                    edges.append({"source": pair[0], "target": pair[1], "type": "co_document"})
                    seen.add(pair)
    return edges
```

---

## 13. Error Handling Strategy

```python
# app/utils/errors.py
from fastapi import Request
from fastapi.responses import JSONResponse

async def generic_exception_handler(request: Request, exc: Exception):
    import logging, traceback
    logging.error(f"Unhandled error: {exc}\n{traceback.format_exc()}")
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc)},
    )

# Register in main.py:
# app.add_exception_handler(Exception, generic_exception_handler)
```

**Error boundaries per layer:**
- **Ingestion:** One failed page/batch doesn't abort the run — log and continue
- **Claude API:** 2 retries with exponential backoff; surface clear error to client
- **ChromaDB:** Collection-not-found returns `None`, callers handle gracefully
- **Guru Mode:** Session not found returns 404; stale sessions auto-expire after 2 hours

---

## 14. `requirements.txt`

```
fastapi==0.111.0
uvicorn[standard]==0.29.0
chromadb==0.5.0
networkx==3.3
pymupdf==1.24.0
pytesseract==0.3.10
Pillow==10.3.0
python-docx==1.1.0
httpx==0.27.0
python-dotenv==1.0.0
pydantic==2.7.0
pydantic-settings==2.3.0
python-multipart==0.0.9
```

---

## 15. Launch Command

```bash
# Development
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Production (demo)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2
```

---

*Document version 1.0 — SMRITI Backend Architecture — ET AI Hackathon 2026*
