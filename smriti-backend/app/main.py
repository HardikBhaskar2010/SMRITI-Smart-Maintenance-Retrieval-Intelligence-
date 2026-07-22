"""
SMRITI API — Phase 2 Entry Point
FastAPI + ChromaDB + NetworkX + Analytics + Alerts + JWT + Export
"""
import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.db.chroma import init_chroma
from app.db.graph import init_graph
from app.db.analytics_store import init_analytics_db
from app.config import settings
from app.utils.logger import setup_logging

setup_logging()
logger = logging.getLogger(__name__)

_monitor_task: asyncio.Task | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _monitor_task
    # ── Startup ────────────────────────────────────────────────────────
    logger.info("Initializing ChromaDB at %s", settings.CHROMA_PERSIST_DIR)
    init_chroma(persist_dir=settings.CHROMA_PERSIST_DIR)

    logger.info("Initializing NetworkX knowledge graph")
    init_graph()

    logger.info("Initializing Analytics SQLite DB at %s", settings.ANALYTICS_DB_PATH)
    init_analytics_db()

    # Start background alert monitor
    from app.services.alerts.monitor import run_monitor
    _monitor_task = asyncio.create_task(run_monitor())
    logger.info("Alert monitor background task started")

    logger.info("SMRITI API Phase 2 ready ✓")
    yield

    # ── Shutdown ──────────────────────────────────────────────────────
    if _monitor_task:
        _monitor_task.cancel()
        try:
            await _monitor_task
        except asyncio.CancelledError:
            pass
    logger.info("SMRITI API shutting down")


app = FastAPI(
    title="SMRITI API — Phase 2",
    description=(
        "Smart Maintenance & Retrieval Intelligence — "
        "Knowledge Debt RAG Backend with Predictive Analytics, Alerts & Export"
    ),
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:4173",
        "http://localhost:3000",
        "*",  # Phase 2: open for demo — restrict in production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ────────────────────────────────────────────────────────────
from app.api import ingest, assets, query, guru, graph, ws  # noqa: E402
from app.api import analytics, alerts, auth, export          # noqa: E402

app.include_router(auth.router,      prefix="/api", tags=["Auth"])
app.include_router(ingest.router,    prefix="/api", tags=["Ingestion"])
app.include_router(assets.router,    prefix="/api", tags=["Assets"])
app.include_router(query.router,     prefix="/api", tags=["Query"])
app.include_router(guru.router,      prefix="/api", tags=["Guru Mode"])
app.include_router(graph.router,     prefix="/api", tags=["Graph"])
app.include_router(analytics.router, prefix="/api", tags=["Analytics"])
app.include_router(alerts.router,    prefix="/api", tags=["Alerts"])
app.include_router(export.router,    prefix="/api", tags=["Export"])
app.include_router(ws.router,        tags=["WebSocket"])
app.include_router(alerts.router,    tags=["WebSocket Alerts"])  # /ws/alerts


# ── Health check ──────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "ok",
        "service": "smriti-api",
        "version": "2.0.0",
        "phase": 2,
    }


# ── Streaming query endpoint ──────────────────────────────────────────
from fastapi.responses import StreamingResponse  # noqa: E402

@app.post("/api/query/stream", tags=["Query"])
async def stream_query(body: dict):
    """
    Server-Sent Events streaming endpoint.
    Streams LLM answer tokens as they are generated.
    """
    from app.services.llm.client import LLMClient
    from app.prompts import QUERY_SYNTHESIS_SYSTEM, build_query_prompt
    from app.services.rag.engine import run_query
    from app.models.query import QueryRequest

    query_text = body.get("query", "")
    asset_id = body.get("asset_id")

    # First, get context via non-streaming RAG
    try:
        req = QueryRequest(query=query_text, asset_id=asset_id, max_results=20)
    except Exception:
        req = QueryRequest(query=query_text)

    from app.services.rag.retriever import retrieve_thread_context
    from app.services.rag.engine import ASSET_ID_PATTERN, _find_relevant_assets, _format_context

    # Identify assets
    if asset_id:
        asset_ids = [asset_id]
    else:
        matches = ASSET_ID_PATTERN.findall(query_text)
        asset_ids = list({m.upper() for m in matches}) if matches else []
    if not asset_ids:
        asset_ids = await _find_relevant_assets(query_text)

    thread_contexts = []
    for aid in asset_ids:
        ctx = await retrieve_thread_context(asset_id=aid, query=query_text, max_items=20)
        if ctx:
            thread_contexts.append(ctx)

    if not thread_contexts:
        async def _empty():
            yield "data: No relevant knowledge found for this query.\n\n"
            yield "data: [DONE]\n\n"
        return StreamingResponse(_empty(), media_type="text/event-stream")

    context_text = _format_context(thread_contexts)
    llm = LLMClient()

    async def _stream_events():
        try:
            async for token in llm.stream(
                system_prompt=QUERY_SYNTHESIS_SYSTEM,
                user_message=build_query_prompt(query_text, context_text),
                max_tokens=4096,
            ):
                escaped = token.replace("\n", "\\n")
                yield f"data: {escaped}\n\n"
        except Exception as e:
            yield f"data: [ERROR] {e}\n\n"
        finally:
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        _stream_events(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


# ── Global error handler ──────────────────────────────────────────────
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    import traceback
    logger.error("Unhandled error: %s\n%s", exc, traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc)},
    )
