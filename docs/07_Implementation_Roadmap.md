# SMRITI — Implementation Roadmap

**Document Type:** 72-Hour Hackathon Sprint Plan  
**Project:** SMRITI — Smart Maintenance & Retrieval Intelligence  
**Event:** ET AI Hackathon 2026  
**Version:** 1.0  
**Date:** June 2026

---

## Hackathon Timeline Overview

```
Hour  0 ──► Hour 24 ──► Hour 48 ──► Hour 72
  │              │              │              │
  │  PHASE 1     │  PHASE 2     │  PHASE 3     │
  │  Foundation  │  Core Feat.  │  Polish &    │
  │  + Backend   │  + Frontend  │  Demo Ready  │
  │              │              │              │
  └──────────────┴──────────────┴──────────────┘
```

---

## Critical Path

The critical path is the sequence of tasks that cannot be parallelized — delay on any one blocks everything downstream.

```
[ChromaDB setup] → [Ingestion pipeline] → [Tag extraction prompt] → [RAG query engine]
       │                                            │                        │
       │                                    [Guru question gen]      [Query synthesis prompt]
       │                                            │                        │
       └──────── [Asset score API] ──────────── [Dashboard] ──────────── [Demo]
```

**Critical path total estimated time: ~28 hours**  
**Buffer before demo: ~44 hours** (ample time for debugging and polishing)

---

## Phase 1 — Foundation (Hours 0–24)

### Hour 0–2: Environment Setup & Scaffolding

**Goal:** Both backend and frontend repos running locally with hot reload.

**Backend tasks:**
```bash
# Create project
mkdir smriti-backend && cd smriti-backend
python -m venv venv && source venv/bin/activate   # or venv\Scripts\activate on Windows
pip install fastapi uvicorn chromadb networkx pymupdf pytesseract \
            python-docx openai httpx python-dotenv pydantic pydantic-settings \
            python-multipart Pillow

# Create directory structure
mkdir -p app/{api,services/{ingestion,rag,debt,guru,claude},db,models,utils,prompts}
mkdir -p data/{chromadb,uploads,sessions}
touch app/__init__.py app/main.py app/config.py
touch .env .env.example

# Verify server starts
uvicorn app.main:app --reload --port 8000
# Expected: "Application startup complete."
```

**Frontend tasks:**
```bash
# Create Vite + React + TypeScript project
npm create vite@latest smriti-frontend -- --template react-ts
cd smriti-frontend
npm install

# Install core dependencies
npm install react-router-dom @tanstack/react-query zustand axios \
            framer-motion three @react-three/fiber @react-three/drei \
            lucide-react clsx
npm install -D vite-plugin-pwa tailwindcss autoprefixer

# Initialize Tailwind
npx tailwindcss init -p

# Verify dev server starts
npm run dev
# Expected: http://localhost:5173 renders default Vite page
```

**Checkpoint ✅:** Both servers start, CORS allows frontend to reach backend `/health`.

---

### Hour 2–6: Backend Data Layer & Models

**Goal:** ChromaDB initialized, all Pydantic models defined, config loading.

**Tasks:**
1. Implement `app/config.py` — Settings with pydantic-settings
2. Implement `app/db/chroma.py` — ChromaDB singleton
3. Implement `app/db/graph.py` — NetworkX graph singleton
4. Implement `app/db/session_store.py` — In-memory Guru session store
5. Implement `app/models/asset.py` — ThreadItem, KnowledgeDebt, AssetThread
6. Implement `app/models/query.py` — QueryRequest, QueryResponse, Citation
7. Implement `app/models/ingest.py` — IngestProgress, IngestResult
8. Implement `app/models/guru.py` — GuruSession, GuruMessage
9. Implement `app/utils/tag_normalizer.py` — normalize_asset_id()
10. Implement `app/utils/hash.py` — content fingerprinting
11. Implement `app/main.py` — FastAPI app with lifespan, CORS, routers registered

**Verification:**
```bash
python -c "from app.db.chroma import init_chroma, get_chroma; init_chroma('./data/chromadb'); c = get_chroma(); print('ChromaDB OK:', c.list_collections())"
# Expected: ChromaDB OK: []
```

**Checkpoint ✅:** All models import without error. FastAPI docs at `/docs` show all route stubs.

---

### Hour 6–12: Document Ingestion Pipeline (CRITICAL PATH)

**Goal:** Upload a PDF → equipment tags extracted → ChromaDB populated.

**Tasks (in dependency order):**

1. **`app/services/claude/client.py`** — ClaudeClient with retry logic
   ```bash
   # Test: verify OpenRouter connection
   python -c "
   import asyncio
   from app.services.claude.client import ClaudeClient
   async def test():
       c = ClaudeClient()
       r = await c.complete('Say hello', 'Hello?', max_tokens=50)
       print(r)
   asyncio.run(test())
   "
   ```

2. **`app/prompts/tag_extraction.py`** — System prompt + user template + validator
   
3. **`app/services/ingestion/extractor.py`** — PDF/DOCX text extraction
   ```bash
   # Test: extract from sample Railtel PDF
   python -c "
   from pathlib import Path
   from app.services.ingestion.extractor import extract_text
   pages = extract_text(Path('test_docs/sample.pdf'))
   print(f'Extracted {len(pages)} pages. First 200 chars of p1:')
   print(pages[0][1][:200])
   "
   ```

4. **`app/services/ingestion/tag_extractor.py`** — Claude-powered tag extraction

5. **`app/services/ingestion/deduplicator.py`** — Content hash deduplication

6. **`app/services/ingestion/pipeline.py`** — Orchestration

7. **`app/api/ws.py`** — WebSocket ingest endpoint

8. **`app/api/ingest.py`** — REST POST `/api/ingest` (non-WS fallback)

**End-to-end ingestion test:**
```bash
# Start server
uvicorn app.main:app --reload &

# Upload sample PDF via curl
curl -X POST http://localhost:8000/api/ingest \
  -F "file=@test_docs/schneider_ups_manual.pdf"

# Expected response:
# {"document_name": "schneider_ups_manual.pdf", "tags_created": ["UPS-01", "UPS-02"], 
#  "tags_updated": [], "total_items_added": 47, "duration_seconds": 28.3}
```

**Checkpoint ✅:** At least 3 equipment threads created from a real Railtel CDC document.

---

### Hour 12–18: Asset APIs + Knowledge Debt Score

**Goal:** `/api/assets` returns populated data with correct debt scores.

**Tasks:**

1. **`app/services/debt/scorer.py`** — `calculate_debt_score()` + `recalculate_debt()`
   
   **Unit test first:**
   ```python
   # Manually verify formula before integrating
   result = calculate_debt_score(
       item_count=5,        # sparse
       expert_count=1,      # single point of failure
       last_updated_iso="2025-12-01T00:00:00Z",  # 6+ months ago
       operational_criticality=0.95,  # transformer
   )
   assert result["score"] > 70, f"Expected CRITICAL, got {result['score']}"
   assert result["severity"] == "CRITICAL"
   print("✅ Debt scorer: CRITICAL case correct")
   
   result2 = calculate_debt_score(
       item_count=80,
       expert_count=4,
       last_updated_iso="2026-06-20T00:00:00Z",  # 2 days ago
       operational_criticality=0.4,
   )
   assert result2["score"] < 40, f"Expected OK, got {result2['score']}"
   print("✅ Debt scorer: OK case correct")
   ```

2. **`app/api/assets.py`** — GET `/api/assets` + GET `/api/assets/{id}`

3. **`app/api/graph.py`** — GET `/api/graph`

**Verification:**
```bash
curl http://localhost:8000/api/assets | python -m json.tool
# Expected: Array of assets with debt_score, severity, item_count populated
```

**Checkpoint ✅:** Dashboard shows real data; T-101 (sparse docs, 1 expert) shows CRITICAL.

---

### Hour 18–24: RAG Query Engine

**Goal:** POST `/api/query` returns accurate, cited answers.

**Tasks:**

1. **`app/prompts/query_synthesis.py`** — System prompt + template + validator

2. **`app/services/rag/retriever.py`** — ChromaDB semantic search

3. **`app/services/rag/engine.py`** — Query orchestration with asset ID detection

4. **`app/api/query.py`** — POST `/api/query`

**Voice query test (the money shot):**
```bash
curl -X POST http://localhost:8000/api/query \
  -H "Content-Type: application/json" \
  -d '{"query": "UPS-01 mein last month kya issues aaye?"}'

# Expected response includes:
# - answer in Hinglish
# - citations with source_document and source_page
# - response_time_ms < 8000
```

**Checkpoint ✅:** All three demo queries return correct, cited answers in < 8 seconds.

---

## Phase 2 — Core Features (Hours 24–48)

### Hour 24–28: Guru Mode Backend

**Goal:** Full Guru Mode session flow works end-to-end.

**Tasks:**

1. **`app/prompts/guru_opening.py`** — Opening question generation prompt + validator
2. **`app/prompts/guru_followup.py`** — Follow-up generation prompt
3. **`app/services/guru/interviewer.py`** — `generate_opening_questions()` + `generate_followup()`
4. **`app/services/guru/session.py`** — `start_guru_session()` + `process_expert_answer()`
5. **`app/api/guru.py`** — POST `/api/guru/start`, POST `/api/guru/respond`, GET `/api/guru/session/{id}`

**Guru Mode integration test:**
```bash
# Start session
SESSION=$(curl -s -X POST http://localhost:8000/api/guru/start \
  -H "Content-Type: application/json" \
  -d '{"asset_id": "T-101", "expert_name": "Ramesh Kumar"}' | python -c "import json,sys; print(json.load(sys.stdin)['session_id'])")

echo "Session ID: $SESSION"

# Submit answer
curl -X POST http://localhost:8000/api/guru/respond \
  -H "Content-Type: application/json" \
  -d "{\"session_id\": \"$SESSION\", \"answer\": \"T-101 shows vibration before fault. The main issues are overheating in summer and oil degradation after 10 years.\"}"

# Expected: next_question populated, current_debt_score reduced
```

**Checkpoint ✅:** T-101 debt score drops measurably after 3 answered questions.

---

### Hour 28–36: Frontend Foundation + Dashboard

**Goal:** Dashboard renders real data from backend. Responsive layout working.

**Tasks:**

1. **`src/styles/globals.css`** — All CSS custom properties from design spec
2. **`src/api/client.ts`** + **`src/api/*.ts`** — All API functions
3. **`src/stores/*.ts`** — All 4 Zustand stores
4. **`src/components/ui/`** — Button, Input, Skeleton, Toast, Spinner
5. **`src/components/layout/`** — Sidebar, BottomNav, TopBar
6. **`App.tsx`** — Router setup, layout, route definitions
7. **`src/hooks/useAssets.ts`** — TanStack Query with 10s polling
8. **`src/components/debt/DebtRing.tsx`** — SVG arc with Framer Motion animation
9. **`src/components/debt/DebtBadge.tsx`** — Severity pill
10. **`src/components/debt/DebtSummaryBar.tsx`** — CRITICAL/WARN/OK counts
11. **`src/components/asset/AssetCard.tsx`** — Full card with hover, CRITICAL pulse
12. **`src/components/asset/AssetCardGrid.tsx`** — Responsive 1/2/3 column grid
13. **`src/pages/DashboardPage.tsx`** — Assembled dashboard view

**Visual checks:**
- [ ] Dark background (#0D0F14) renders correctly
- [ ] T-101 card has red pulsing border (CRITICAL)
- [ ] Debt Score Ring animates on mount
- [ ] 3-column grid on desktop, 1-column on mobile
- [ ] Cards lift on hover (translateY(-2px))

**Checkpoint ✅:** Dashboard looks like the App Design spec. Someone unfamiliar with the project says "wow" looking at it.

---

### Hour 36–40: Asset Drawer + Thread View

**Goal:** Click an asset card → drawer slides in with full thread history.

**Tasks:**

1. **`src/hooks/useAssetDetail.ts`** — Fetch single asset thread
2. **`src/components/asset/ThreadItem.tsx`** — Individual knowledge item
3. **`src/components/asset/ThreadList.tsx`** — Scrollable list (virtualized if >50 items)
4. **`src/components/asset/AssetDrawer.tsx`** — 400px slide-in panel

**Checkpoint ✅:** Click T-101 → drawer opens with thread items, each showing source citation.

---

### Hour 40–44: Voice Query Interface

**Goal:** Voice query in Hinglish works end-to-end on Chrome.

**Tasks:**

1. **`src/hooks/useVoice.ts`** — Full Web Speech API hook
2. **`src/components/query/CitationChip.tsx`** — Source citation pill
3. **`src/components/query/QueryResult.tsx`** — Answer + numbered citations
4. **`src/pages/QueryPage.tsx`** — Full query page
5. **`src/components/query/VoiceQueryBar.tsx`** — Mic button + text input

**Demo query test checklist:**
- [ ] Click mic → button pulses red, "Listening..." shown in field
- [ ] Speak "UPS-01 mein last month kya issues aaye?" → transcription appears live
- [ ] Silence for 1.5 seconds → query auto-submits
- [ ] Result appears with 3 incidents, each with source citation
- [ ] Text fallback: can also type query and press Enter

**Checkpoint ✅:** Voice query demo flow works without any text typing.

---

### Hour 44–48: 3D Knowledge Graph

**Goal:** R3F graph renders all assets with correct colors, clickable, interactive.

**Tasks:**

1. **`src/hooks/useGraphData.ts`** — Fetch graph nodes + edges
2. **`src/components/graph/AssetEdge.tsx`** — 3D line between co-document assets
3. **`src/components/graph/AssetNode.tsx`** — Color-coded sphere with pulsing for CRITICAL
4. **`src/components/graph/NodeTooltip.tsx`** — HTML overlay: asset ID + score on hover
5. **`src/components/graph/GraphControls.tsx`** — Filter, Legend, Reset buttons
6. **`src/components/graph/KnowledgeGraph.tsx`** — R3F Canvas + OrbitControls + layout
7. **`src/pages/GraphPage.tsx`** — Full-screen graph page

**Performance checks:**
- [ ] 15+ nodes render at ≥30fps (use browser DevTools → Performance)
- [ ] Auto-rotate enabled (slow, continuous)
- [ ] Hover tooltip appears within 100ms
- [ ] Click T-101 node → AssetDrawer opens

**Checkpoint ✅:** 3D graph is interactive, runs smoothly, T-101 pulses red.

---

## Phase 3 — Polish & Demo Ready (Hours 48–72)

### Hour 48–52: Guru Mode Frontend

**Goal:** Full Guru Mode session UI works in the browser.

**Tasks:**

1. **`src/components/guru/GuruStartModal.tsx`** — Asset + expert name form
2. **`src/components/guru/GuruMessage.tsx`** — Chat-style message bubble
3. **`src/components/guru/GuruProgress.tsx`** — Progress bar + live score arc
4. **`src/components/guru/GuruPanel.tsx`** — Full session container
5. **`src/hooks/useGuruSession.ts`** — Session start + answer submission
6. **`src/pages/GuruPage.tsx`** — Asset selection table + Guru panel

**Demo flow test:**
- [ ] Dashboard → click "Interview Expert" on T-101 → GuruStartModal opens
- [ ] Enter expert name → click Start → GuruPanel opens with first question
- [ ] Type answer → Submit → next question appears, score ring animates down
- [ ] After 3 answers, toast shows "Knowledge Debt reduced by X points"

**Checkpoint ✅:** Full Guru Mode demo flow works in under 3 minutes.

---

### Hour 52–56: Document Upload UI + Ingestion Progress

**Goal:** Drop a PDF → live progress animation → threads appear on dashboard.

**Tasks:**

1. **`src/hooks/useIngestion.ts`** — WebSocket progress hook
2. **`src/components/upload/TagChip.tsx`** — Detected asset tag pills
3. **`src/components/upload/IngestionProgress.tsx`** — Live stage progress
4. **`src/components/upload/DropZone.tsx`** — Drag-and-drop file target
5. **`src/pages/UploadPage.tsx`** — Full upload page

**Demo flow test:**
- [ ] Drag Schneider UPS manual onto DropZone → file highlights drop target
- [ ] Progress stages animate: "Extracting text..." → "Tagging equipment..." → "Embedding..."
- [ ] Tag chips appear live as tags are found: UPS-01, UPS-02...
- [ ] "Done! 47 items added" success state
- [ ] Navigate to Dashboard → new asset cards visible

**Checkpoint ✅:** Flow 1 demo works start-to-finish with real PDF.

---

### Hour 56–60: PWA Setup + Offline Mode

**Goal:** App installable, works offline for dashboard view.

**Tasks:**

1. **`vite.config.ts`** — VitePWA configuration with workbox cache strategies
2. **`public/manifest.json`** — PWA manifest
3. **`public/icons/`** — Generate 192px and 512px icons
4. **`public/offline.html`** — Offline fallback page

**PWA verification:**
```bash
# Build production bundle
npm run build
npm run preview   # http://localhost:4173

# In Chrome DevTools → Application → Service Workers
# Verify: Service Worker is "activated and running"
# Verify: Cache Storage has "assets-cache", "asset-detail-cache"

# Simulate offline: Network tab → set throttle to "Offline"
# Verify: Dashboard loads from cache
# Verify: Offline.html shown for non-cached pages
# Verify: Query page shows "You are offline — connect to query assets"
```

**Checkpoint ✅:** App installs to desktop, dashboard works offline.

---

### Hour 60–64: Error States + Loading States

**Goal:** Every possible failure mode has a graceful UI state.

**States to implement and test:**

| Scenario | Expected Behavior |
|---|---|
| Backend offline | "Backend unavailable" banner, cached data still shows |
| Voice permission denied | Toast: "Microphone permission denied. Use text input instead." |
| Query with no results | "No thread found for [asset]. Upload related documents first." |
| Claude API timeout | "Query is taking longer than expected. Retrying..." → after 2 retries: error |
| ChromaDB empty (fresh start) | Empty state: "No assets yet. Upload documents to get started." |
| Guru session expired | "This session has ended. Start a new session." |
| File type not supported | "Only PDF, DOCX, and image files are supported." |
| File too large (>50MB) | "File size limit is 50MB per upload." |

**Checkpoint ✅:** No crash possible across the demo flow. Every error shows a clear, non-technical message.

---

### Hour 64–68: Performance & Animation Polish

**Goal:** App feels premium. Every transition is smooth.

**Tasks:**

**Framer Motion animations:**
- [ ] Asset cards `fadeInUp` stagger on Dashboard load (40ms per card)
- [ ] Debt Score Ring animates from 0 on mount (600ms ease-out)
- [ ] CRITICAL card border pulses (1.5s infinite)
- [ ] Asset Drawer slides in from right (300ms ease-out)
- [ ] Toast notifications slide in from top-right, fade out
- [ ] Guru score arc smoothly decrements on answer submission

**Performance checks:**
- [ ] Lighthouse score: Performance ≥ 80, Accessibility ≥ 90
- [ ] First Contentful Paint < 2 seconds on localhost (production build)
- [ ] 3D graph: 30fps+ with 20 nodes (Chrome DevTools → Performance → FPS meter)
- [ ] Query response time logged to console — verify < 8s for demo queries

**Checkpoint ✅:** The app feels production-ready. Animations are smooth, not janky.

---

### Hour 68–70: Demo Data Pre-loading

**Goal:** All demo assets are pre-loaded. Queries are cached. Cold start works.

**Tasks:**

1. **Create `scripts/seed_demo_data.py`:**

```python
"""
Run this script BEFORE the demo to pre-load all required data.
Usage: python scripts/seed_demo_data.py
"""
import asyncio
from pathlib import Path
from app.db.chroma import init_chroma
from app.db.graph import init_graph
from app.services.ingestion.pipeline import run_ingestion
from app.config import settings

DEMO_DOCS = [
    Path("test_docs/Railtel_CDC_Level2_March.docx"),
    Path("test_docs/schneider_ups_manual.pdf"),
    Path("test_docs/Maintenance_Log_Feb.pdf"),
    Path("test_docs/Incident_Report_Jan.docx"),
]

async def seed():
    init_chroma(settings.CHROMA_PERSIST_DIR)
    init_graph()
    
    for doc_path in DEMO_DOCS:
        if not doc_path.exists():
            print(f"⚠️  Document not found: {doc_path}")
            continue
        print(f"📄 Ingesting: {doc_path.name}...")
        result = await run_ingestion(
            file_path=doc_path,
            document_name=doc_path.name,
        )
        print(f"   ✅ {result.total_items_added} items added for: {result.tags_created + result.tags_updated}")
    
    print("\n✅ Demo data seeding complete!")
    print("T-101, UPS-01, P-207 threads should now be populated.")

asyncio.run(seed())
```

2. **Pre-warm Claude response cache:**
```bash
python scripts/warm_demo_cache.py
# Runs all 5 demo queries once and stores responses locally
```

3. **Verify demo state:**
```bash
python scripts/verify_demo_ready.py
# Checks: all assets loaded, T-101 is CRITICAL, UPS-01 is OK, queries return in <5s
```

**Checkpoint ✅:** Cold start (kill all processes → restart) loads demo-ready state in under 10 seconds.

---

### Hour 70–72: Final Demo Run + Contingency Setup

**Goal:** Run the full 15-minute demo script 3 times without issues.

**Final checklist:**

**Backend:**
- [ ] `.env` populated with valid `OPENROUTER_API_KEY`
- [ ] ChromaDB data seeded and persisted to disk
- [ ] Server starts in < 5 seconds: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
- [ ] `/health` returns `{"status": "ok"}`
- [ ] `/api/assets` returns T-101 (CRITICAL), P-207 (WARNING), UPS-01 (OK)

**Frontend:**
- [ ] `npm run build && npm run preview` serves correctly
- [ ] PWA install prompt appears in Chrome (for fallback if internet drops)
- [ ] Voice query works in Chrome (tested with Hindi/Hinglish)
- [ ] 3D graph renders and rotates

**Contingency:**
- [ ] Pre-cached query responses saved as JSON files
- [ ] `scripts/run_cached_query.py [query]` — returns cached response if API fails
- [ ] Demo video recording saved (30s clip of each flow) for catastrophic failure

---

## Contingency Plans

### Plan A: Live Demo (Preferred)
Full stack running. Real API calls. Real voice input.

### Plan B: API Fails Mid-Demo
```python
# In app/api/query.py — toggle DEMO_MODE in .env
if settings.DEMO_MODE:
    return load_cached_response(request.query)
# Return pre-cached JSON responses. Latency: <100ms. Audience can't tell.
```

### Plan C: Full Infrastructure Failure
- Switch to pre-recorded 3-minute screen recording
- Narrate live over the recording, highlighting specific UI elements
- Continue with slides for architecture explanation

### Plan D: Voice Recognition Fails
- Switch to text input
- Pre-type demo queries in a text file, copy-paste during demo
- Voice recognition failure is a recoverable, not show-stopping, issue

---

## Task Dependencies Graph

```
config.py ──► main.py ──► All routers
   │
   ▼
chroma.py ──► extractor.py ──► tag_extractor.py ──► pipeline.py ──► ws.py
                                        │
                                  claude/client.py ──► prompts/*.py
                                                              │
                                                    scorer.py ◄─┘
                                                         │
                                                    assets.py
                                                         │
                                          retriever.py ──► engine.py ──► query.py
                                                                             │
                                                          guru/session.py ──► guru.py
```

---

## Hour-by-Hour Summary Table

| Hours | Focus | Deliverable | Risk |
|---|---|---|---|
| 0–2 | Scaffolding | Both servers running | Low |
| 2–6 | Data layer | ChromaDB + models | Low |
| 6–12 | Ingestion | PDF → ChromaDB | **HIGH** (Claude API) |
| 12–18 | APIs + Scoring | Assets endpoint with debt | Medium |
| 18–24 | RAG engine | Query working | **HIGH** (prompt quality) |
| 24–28 | Guru backend | Session API | Medium |
| 28–36 | Dashboard UI | Cards + score rings | Medium |
| 36–40 | Asset drawer | Thread item view | Low |
| 40–44 | Voice query | Hinglish demo flow | **HIGH** (browser API) |
| 44–48 | 3D graph | R3F rendering | Medium |
| 48–52 | Guru frontend | Full session UI | Low |
| 52–56 | Upload UI | Drag-drop + WS progress | Low |
| 56–60 | PWA | Installable, offline | Low |
| 60–64 | Error states | Graceful failures | Low |
| 64–68 | Polish | Animations, performance | Low |
| 68–70 | Demo data | Seeded, cached | Low |
| 70–72 | Rehearsal | 3 full demo runs | **CRITICAL** |

---

## Definition of Done

The prototype is demo-ready when:

1. ✅ Document ingestion flow (Flow 1) runs in < 45 seconds for a 50-page PDF
2. ✅ Voice query "UPS-01 mein last month kya issues aaye?" returns correct Hinglish answer in < 8 seconds
3. ✅ T-101 shows CRITICAL on dashboard on first load (no manual setup needed)
4. ✅ Guru Mode session reduces T-101 score by at least 10 points in 3 answers
5. ✅ 3D graph shows all assets, T-101 pulses red, nodes are clickable
6. ✅ App loads in < 2 seconds on production build
7. ✅ No crashes across 3 full demo runs

---

*Document version 1.0 — SMRITI Implementation Roadmap — ET AI Hackathon 2026*
