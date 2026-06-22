# SMRITI — Expert Implementation Plan

> **Strictly follows:** 01_PRD · 02_Technical_Requirements · 03_App_Design · 04_Backend_Architecture · 05_Frontend_Architecture · 06_Prompt_Engineering · 07_Implementation_Roadmap · 08_Demo_Script

---

## Architecture Summary

```
smriti-backend/   FastAPI 0.111 · Python 3.11 · ChromaDB 0.5 · NetworkX 3.3
smriti-frontend/  React 18 · TypeScript 5 · Vite 5 · R3F · Zustand · Framer Motion
OpenRouter (free) cohere/north-mini-code:free  (extraction)
                  meta-llama/llama-3.3-70b-instruct:free  (RAG + Guru)
                  poolside/laguna-xs2:free  (fallback)
```

---

## Phase 1 — Backend Scaffolding & Data Layer

### Files to create
- `smriti-backend/` — full directory tree
- `app/__init__.py`, `app/main.py`, `app/config.py`, `app/dependencies.py`
- All `app/models/*.py` (asset, query, ingest, guru)
- `app/db/chroma.py`, `app/db/graph.py`, `app/db/session_store.py`
- `app/utils/tag_normalizer.py`, `app/utils/hash.py`, `app/utils/logger.py`
- `requirements.txt`, `.env.example`

### Commands
```bash
cd c:\Users\sesa457837\Videos\Smriti
mkdir smriti-backend
cd smriti-backend && python -m venv venv
pip install fastapi uvicorn[standard] chromadb networkx pymupdf pytesseract Pillow python-docx httpx python-dotenv pydantic pydantic-settings python-multipart
```

### Acceptance criteria
- `uvicorn app.main:app --reload` starts without error
- `/health` returns `{"status": "ok"}`
- ChromaDB initializes and persists to `./data/chromadb`

---

## Phase 2 — Claude/LLM Client + Prompts

### Files to create
- `app/services/llm/client.py` — `LLMClient` with `.extract()` / `.query()` routing
- `app/prompts/__init__.py`
- `app/prompts/tag_extraction.py`
- `app/prompts/query_synthesis.py`
- `app/prompts/guru_opening.py`
- `app/prompts/guru_followup.py`

### Acceptance criteria
- `LLMClient().extract(...)` hits `cohere/north-mini-code:free` via OpenRouter
- `LLMClient().query(...)` hits `meta-llama/llama-3.3-70b-instruct:free`
- Rate-limit 429 → auto-falls back to `poolside/laguna-xs2:free`
- All prompts produce valid JSON in the schema defined in 06_Prompt_Engineering.md

---

## Phase 3 — Document Ingestion Pipeline + WebSocket

### Files to create
- `app/services/ingestion/extractor.py` — PDF/DOCX/image text extraction
- `app/services/ingestion/tag_extractor.py` — Claude extraction call
- `app/services/ingestion/deduplicator.py` — SHA-256 content hash
- `app/services/ingestion/pipeline.py` — full orchestration
- `app/api/ws.py` — `/ws/ingest` WebSocket endpoint
- `app/api/ingest.py` — REST fallback `POST /api/ingest`

### Acceptance criteria
- Drop a 50-page PDF → at least 3 asset threads created in ChromaDB in <45s
- WebSocket sends stage events: extracting → tagging → embedding → done
- Duplicate content (same hash) is skipped and counted separately

---

## Phase 4 — Asset APIs + Knowledge Debt Scorer

### Files to create
- `app/services/debt/scorer.py` — `calculate_debt_score()` + `recalculate_debt()`
- `app/api/assets.py` — `GET /api/assets`, `GET /api/assets/{id}`
- `app/api/graph.py` — `GET /api/graph`

### Acceptance criteria
- T-101 (1 expert, sparse docs) scores CRITICAL (>70)
- UPS-01 (3 experts, full docs) scores OK (<40)
- `/api/assets` returns sorted-by-debt-score list

---

## Phase 5 — RAG Query Engine

### Files to create
- `app/services/rag/retriever.py` — ChromaDB semantic search per asset
- `app/services/rag/engine.py` — asset ID detection + multi-asset orchestration
- `app/api/query.py` — `POST /api/query`

### Acceptance criteria
- "UPS-01 mein last month kya issues aaye?" → Hinglish response with citations in <8s
- Unknown asset → graceful "no thread found" message
- Multi-asset query → pulls from both asset threads

---

## Phase 6 — Guru Mode Backend

### Files to create
- `app/services/guru/interviewer.py` — `generate_opening_questions()`, `generate_followup()`
- `app/services/guru/session.py` — `start_guru_session()`, `process_expert_answer()`
- `app/api/guru.py` — `POST /api/guru/start`, `POST /api/guru/respond`, `GET /api/guru/session/{id}`

### Acceptance criteria
- Start session for T-101 → 8 asset-specific questions generated
- Submit 3 answers → debt score drops ≥10 points
- Session transcript stored to `./data/sessions/{id}.json`

---

## Phase 7 — Frontend Foundation

### Files to create (all under `smriti-frontend/src/`)
- `styles/globals.css` — full CSS design token system from 03_App_Design.md
- `api/client.ts`, `api/assets.ts`, `api/query.ts`, `api/guru.ts`, `api/graph.ts`, `api/types.ts`
- `stores/uiStore.ts`, `stores/assetStore.ts`, `stores/queryStore.ts`, `stores/guruStore.ts`
- `hooks/useVoice.ts`, `hooks/useIngestion.ts`, `hooks/useAssets.ts`, `hooks/useGuruSession.ts`, `hooks/useGraphData.ts`
- `components/ui/` — Button, Input, Skeleton, Toast, Spinner
- `components/layout/` — Sidebar, BottomNav, TopBar
- `components/debt/` — DebtRing, DebtBadge, DebtSummaryBar, DebtTable
- `components/asset/` — AssetCard, AssetCardGrid, AssetDrawer, ThreadItem, ThreadList
- `components/query/` — VoiceQueryBar, QueryResult, CitationChip
- `components/graph/` — KnowledgeGraph, AssetNode, AssetEdge, NodeTooltip, GraphControls
- `components/guru/` — GuruPanel, GuruMessage, GuruProgress, GuruStartModal
- `components/upload/` — DropZone, IngestionProgress, TagChip
- All page components + App.tsx + router setup
- `vite.config.ts` with PWA + proxy

### Acceptance criteria
- Dashboard renders real data: T-101 CRITICAL pulsing red, UPS-01 green
- DebtRing animates on mount (SVG arc fill 600ms ease-out)
- Voice query speaks Hinglish → transcription → result with citations
- 3D graph: all nodes visible, CRITICAL pulses, hover tooltip, click opens drawer
- Full Guru Mode session in UI: score arc animates live
- PWA installable, offline fallback page works

---

## Phase 8 — Demo Data Seeding + Final Polish

### Files to create
- `smriti-backend/scripts/seed_demo_data.py`
- `smriti-backend/scripts/warm_demo_cache.py`
- `smriti-backend/scripts/verify_demo_ready.py`

### Acceptance criteria
- Cold restart → demo-ready in <10 seconds
- All 5 demo queries return in <8 seconds
- Zero crashes across 3 full demo run-throughs

---

## Phase 9 — Android APK Compilation & GitHub Actions CI

We will add a cross-platform compilation layer using **Capacitor** to build a native Android APK from SMRITI's web bundle, and automate this inside a GitHub Actions CI workflow that publishes the compiled APK as a release asset.

### Proposed Changes

#### [MODIFY] [package.json](file:///c:/Users/sesa457837/Videos/Smriti/smriti-frontend/package.json)
- Add `@capacitor/core` and `@capacitor/android` to dependencies.
- Add `@capacitor/cli` to devDependencies.

#### [NEW] [capacitor.config.json](file:///c:/Users/sesa457837/Videos/Smriti/smriti-frontend/capacitor.config.json)
- Define standard Capacitor configurations specifying `appId: "com.smriti.app"`, `appName: "Smriti"`, and `webDir: "dist"`.

#### [NEW] [build-apk.yml](file:///c:/Users/sesa457837/Videos/Smriti/.github/workflows/build-apk.yml)
- Create a GitHub Actions workflow that:
  1. Triggers on `push` to `master` (or manual execution).
  2. Sets up Node.js 20 and Java JDK 17.
  3. Installs dependencies and builds the Vite frontend.
  4. Dynamically initializes the Android native project (`npx cap add android` + `npx cap sync`).
  5. Compiles the APK using Gradle (`./gradlew assembleDebug`).
  6. Uploads the built `.apk` to the workflow run artifacts.
  7. Publishes/attaches the `.apk` as a release asset to a GitHub Release.

### Verification Plan

#### Automated CI Run
- Push a change to verify the GitHub Actions pipeline runs, successfully compiles the debug APK, and uploads the `.apk` package.

#### Manual Verification
- Verify the generated `app-debug.apk` installs and launches on an Android emulator or device, pointing to SMRITI's layout correctly.

---

## Critical Path (non-negotiable order)
```
[Phase 1] → [Phase 2] → [Phase 3] → [Phase 4] → [Phase 5] → [Phase 6]
                                                                    ↓
[Phase 7 frontend] runs in parallel after Phase 4 backend APIs are live
                                                                    ↓
                                                             [Phase 8]
                                                                    ↓
                                                             [Phase 9]
```

## File Count
- Backend: ~35 Python files
- Frontend: ~45 TypeScript/TSX files
- Scripts: 3 Python scripts
- Config: .env, vite.config, tailwind.config, tsconfig, package.json, requirements.txt, capacitor.config.json, build-apk.yml

---

## Progress Tracking
See [task.md](task.md) for live task status.

