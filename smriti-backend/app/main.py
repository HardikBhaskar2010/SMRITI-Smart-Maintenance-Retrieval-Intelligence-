from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.db.chroma import init_chroma
from app.db.graph import init_graph
from app.config import settings
from app.utils.logger import setup_logging

setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ──────────────────────────────────────────────────────
    import logging
    log = logging.getLogger(__name__)

    log.info("Initializing ChromaDB at %s", settings.CHROMA_PERSIST_DIR)
    init_chroma(persist_dir=settings.CHROMA_PERSIST_DIR)

    log.info("Initializing NetworkX knowledge graph")
    init_graph()

    log.info("SMRITI API ready [OK]")
    yield
    # ── Shutdown ─────────────────────────────────────────────────────
    log.info("SMRITI API shutting down")


app = FastAPI(
    title="SMRITI API",
    description="Smart Maintenance & Retrieval Intelligence — Asset-Thread RAG Backend",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ─────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Vite dev server
        "http://localhost:4173",   # Vite preview
        "http://localhost:3000",   # Fallback
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes — registered after import to avoid circular deps ──────────
from app.api import ingest, assets, query, guru, graph, ws  # noqa: E402

app.include_router(ingest.router, prefix="/api", tags=["Ingestion"])
app.include_router(assets.router, prefix="/api", tags=["Assets"])
app.include_router(query.router,  prefix="/api", tags=["Query"])
app.include_router(guru.router,   prefix="/api", tags=["Guru Mode"])
app.include_router(graph.router,  prefix="/api", tags=["Graph"])
app.include_router(ws.router,     tags=["WebSocket"])


# ── Health check ─────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "service": "smriti-api", "version": "1.0.0"}


# ── Global error handler ─────────────────────────────────────────────
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    import logging, traceback
    logging.getLogger(__name__).error(
        "Unhandled error: %s\n%s", exc, traceback.format_exc()
    )
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc)},
    )
