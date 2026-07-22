<div align="center">
  <img src="https://raw.githubusercontent.com/HardikBhaskar2010/SMRITI-Smart-Maintenance-Retrieval-Intelligence-/master/assets/logo.png" alt="SMRITI Logo" width="120">
  <h1>SMRITI — Phase 2</h1>
  <p><b>Smart Maintenance Retrieval Intelligence</b></p>
  <p><i>Quantifying, Predicting, and Eliminating Industrial Knowledge Debt.</i></p>

  [![Phase 2](https://img.shields.io/badge/Hackathon-Phase_2_Selected-gold?style=for-the-badge)](https://hackathon.economictimes.com/)
  [![CI](https://github.com/HardikBhaskar2010/SMRITI-Smart-Maintenance-Retrieval-Intelligence-/actions/workflows/ci.yml/badge.svg)](https://github.com/HardikBhaskar2010/SMRITI-Smart-Maintenance-Retrieval-Intelligence-/actions)
  [![FastAPI](https://img.shields.io/badge/FastAPI-2.0-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
  [![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
  [![Gemini](https://img.shields.io/badge/Gemini_2.0_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://openrouter.ai/)
</div>

---

## 🏆 Phase 2 Upgrades at a Glance

| Area | Phase 1 | Phase 2 |
|------|---------|---------|
| **LLM** | Llama 3.3 70B (slow, rate-limited) | **Gemini 2.0 Flash** (1M ctx, streaming) |
| **Responses** | Full response after 3-5s | **Token-by-token streaming** via SSE |
| **Analytics** | Score only | **Predictive 30-day forecasting** |
| **Alerts** | None | **Real-time WebSocket push alerts** |
| **Auth** | None | **JWT role-based (admin/engineer/viewer)** |
| **Export** | None | **PDF + Excel knowledge reports** |
| **Tests** | None | **Unit + integration test suite** |
| **CI/CD** | Manual push | **GitHub Actions (lint + build + test)** |
| **Dashboard** | Asset cards only | **Portfolio health + expert flight risk** |

---

## 🏭 The Problem: "Knowledge Debt"

In industrial plants and critical data centers, senior technicians hold decades of unwritten "tribal knowledge." When they retire, that knowledge vanishes. We call this **Knowledge Debt**.

> A single unplanned outage at a data center costs **$9,000/minute** (Uptime Institute, 2023).  
> SMRITI reduces this risk by capturing, quantifying, and predicting knowledge loss.

---

## ✨ Key Features

### 📊 1. Predictive Knowledge Debt Analytics (NEW Phase 2)
- **Portfolio Health Score** — Single weighted index across all assets
- **30-day debt trajectory forecasting** — Linear regression on historical snapshots
- **SLA breach prediction** — *"T-101 will go CRITICAL in ~12 days"*
- **Expert Flight Risk** — Flags experts inactive 60-90+ days as departure risks

### 🔔 2. Real-Time Alert System (NEW Phase 2)
- WebSocket push alerts when an asset crosses into CRITICAL debt
- Expert inactivity alerts when key knowledge holders go quiet
- Notification bell with unread count badge + slide-in alert panel

### 🤖 3. Gemini 2.0 Flash + Streaming (NEW Phase 2)
- Upgraded from Llama 3.3 to **Google Gemini 2.0 Flash** (fastest available)
- **Streaming SSE endpoint** — Answers stream token-by-token like ChatGPT
- 1M token context window — fits entire maintenance history in one call
- 3-tier fallback: Gemini Flash → Llama 3.3 → Laguna XS.2

### 📄 4. Export Engine (NEW Phase 2)
- **PDF Knowledge Reports** — Full asset audit with score breakdown, trend, and thread items
- **Excel Workbooks** — Structured knowledge thread for data analysis

### 🔑 5. JWT Role-Based Authentication (NEW Phase 2)
- Roles: `admin` (full access) · `engineer` (read/write) · `viewer` (read-only)
- Demo credentials: `admin/smriti2026` · `engineer/engineer123` · `viewer/viewer123`

### 🧠 6. Guru Mode — Tribal Knowledge Capture
AI-powered expert interview — generates hyper-targeted questions based on knowledge gaps, watches debt score drop live as expert speaks.

### 🎙️ 7. Multilingual Voice RAG
Floor technicians query in **English, Hindi, or Hinglish** — SMRITI retrieves exact answers and cites sources.

### 🕸️ 8. 3D Knowledge Graph
React-Three-Fiber powered interactive 3D universe mapping all assets and relationships.

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend Core** | React 18, TypeScript 5, Vite 5 |
| **State** | Zustand (persist middleware for auth) |
| **Charts** | Recharts v3 |
| **3D Graphics** | React Three Fiber, Drei |
| **Animations** | Framer Motion |
| **Backend** | FastAPI 0.111, Python 3.11 |
| **Vector DB** | ChromaDB 0.5 (local persistent) |
| **Graph DB** | NetworkX (in-memory) |
| **Time-Series** | SQLite (analytics + alerts) |
| **LLM** | Google Gemini 2.0 Flash via OpenRouter |
| **Auth** | JWT (python-jose) |
| **Export** | reportlab (PDF), openpyxl (Excel) |
| **CI/CD** | GitHub Actions |

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+ · Python 3.11+ · [OpenRouter](https://openrouter.ai/) API Key

### Backend
```bash
cd smriti-backend
python -m venv venv && venv\Scripts\activate
pip install -r requirements.txt

# Configure
cp .env.example .env
# Edit .env — add OPENROUTER_API_KEY

# Seed demo data
python scripts/seed_demo_data.py
python scripts/warm_demo_cache.py

# Start
uvicorn app.main:app --reload
# API docs: http://localhost:8000/docs
```

### Frontend
```bash
cd smriti-frontend
npm install --legacy-peer-deps
npm run dev
# App: http://localhost:5173
# Login: admin / smriti2026
```

### Run Tests
```bash
cd smriti-backend
pytest tests/ -v
```

---

## 🎬 Phase 2 Demo Flow

1. **Login** → Sign in as `admin` with `smriti2026`
2. **Analytics Page** → See portfolio health gauge, flight risk experts, 30-day forecasts
3. **Dashboard** → T-101 pulsing red; animated counter shows debt trending up
4. **Alert Bell** → Ping! SMRITI detected T-101 crossed CRITICAL threshold
5. **Guru Mode** → Interview Ramesh Kumar; watch debt score drop in real-time
6. **Query (Streaming)** → Say *"T-101 ka fault history kya hai?"* — see answer stream token by token
7. **Export** → Download full Knowledge Debt Report PDF for T-101
8. **3D Graph** → Orbit, click nodes, see live debt scores

---

## 📁 Project Structure

```
SMRITI/
├── smriti-backend/
│   ├── app/
│   │   ├── api/          # assets, query, guru, analytics, alerts, auth, export
│   │   ├── services/
│   │   │   ├── llm/      # Gemini Flash client + SSE streaming
│   │   │   ├── rag/      # Vector retrieval engine
│   │   │   ├── debt/     # Debt score calculator
│   │   │   ├── analytics/# Trend forecasting + expert flight risk
│   │   │   ├── alerts/   # Background monitor + WebSocket push
│   │   │   └── export/   # PDF + Excel generators
│   │   └── db/           # ChromaDB, NetworkX, SQLite analytics store
│   └── tests/            # Unit + integration tests
├── smriti-frontend/
│   ├── src/
│   │   ├── pages/        # Dashboard, Analytics (NEW), Query, Graph, Guru, Upload, Login (NEW)
│   │   ├── components/
│   │   │   ├── alerts/   # AlertBell, AlertPanel (NEW)
│   │   │   ├── analytics/# Charts (NEW)
│   │   │   └── ui/       # AnimatedCounter, EmptyState (NEW)
│   │   ├── hooks/        # useAlerts, useStreamingQuery (NEW)
│   │   └── stores/       # authStore (NEW), uiStore, assetStore
└── .github/workflows/    # CI (lint + test + build)
```

---

## 🛡️ CI/CD

Every push to `master` automatically:
1. Runs **ruff** linting on Python code
2. Executes **pytest** unit tests
3. Runs **TypeScript** type-check on frontend  
4. Builds **Vite** production bundle

[![CI Status](https://github.com/HardikBhaskar2010/SMRITI-Smart-Maintenance-Retrieval-Intelligence-/actions/workflows/ci.yml/badge.svg)](https://github.com/HardikBhaskar2010/SMRITI-Smart-Maintenance-Retrieval-Intelligence-/actions)

---

## 🏆 License
Built with 🩵 for the **ET AI Hackathon 2026 — Phase 2**  
*Industrial precision meets digital intelligence.*
