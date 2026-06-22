# SMRITI — Product Requirements Document

**Product Name:** SMRITI (Smart Maintenance & Retrieval Intelligence)  
**Tagline:** *Every machine has a story. SMRITI never forgets.*  
**Version:** 1.0 — Hackathon Prototype  
**Event:** ET AI Hackathon 2026  
**Author:** Project Lead  
**Date:** June 2026

---

## 1. Executive Summary

Industrial plants bleed institutional knowledge every time a senior technician retires, a maintenance record stays undigitized, or a voice note never gets filed. Existing CMMS (Computerized Maintenance Management Systems) and document platforms treat knowledge as a pile of text to search through. SMRITI treats it as something fundamentally different — a living memory organized around equipment identity.

SMRITI introduces **Asset-Thread RAG**: every physical asset in a plant (UPS-01, Transformer T-101, Pump P-207) owns its own continuously-updated knowledge thread. When you ask about an asset, SMRITI doesn't search documents — it pulls that asset's complete knowledge history and reasons across it. This is a fundamentally different retrieval architecture that no existing platform has built.

---

## 2. Problem Statement

### 2.1 The Gap

Every major industrial AI platform today — Siemens Copilot, Fogwing CMMS AI, Aquant, Microsoft Copilot for Field Service, Salesforce Agentforce — is **document-centric**. The query hits a vector search over document chunks. The equipment has no identity inside the system.

This creates three unsolved problems:

**Problem 1 — No per-equipment memory**  
Ask "what issues has UPS-01 had in the last 6 months?" and the system searches documents mentioning "UPS-01" — it doesn't have a thread for UPS-01 that aggregates everything about it across all sources.

**Problem 2 — Knowledge walk-out**  
When expert Ramesh retires, every undocumented thing he knows about Transformer T-101 walks out with him. No system currently measures this risk or acts on it.

**Problem 3 — No knowledge risk metric**  
CFOs and plant managers have no visibility into which equipment is a "single point of failure" from a knowledge perspective. There is no score, no dashboard, no alert.

### 2.2 Who Suffers

- **Field technicians** waste time hunting through document portals for asset history
- **Engineers** lose context when they join a team mid-lifecycle of a machine
- **Plant managers** are blindsided when a retiring expert was the only person who knew why a pump behaves oddly during monsoon season

---

## 3. Goals & Non-Goals

### Goals (Hackathon Prototype)

- Demonstrate Asset-Thread RAG with real industrial data (Railtel CDC Noida documents)
- Build three complete demo flows end-to-end
- Show Knowledge Debt Score as a boardroom-ready metric
- Deliver Guru Mode as a functional AI interview system
- Achieve a working voice query in Hindi/Hinglish/English

### Non-Goals (Post-Hackathon)

- Full CMMS integration (SAP PM, Maximo)
- Multi-tenant enterprise auth
- Production-grade vector DB scaling
- IoT sensor stream ingestion
- Mobile app store publication

---

## 4. User Personas

### Persona A — Rajiv, Field Technician (28)

Works on the plant floor. Has grease on his hands. Uses the app on a mobile PWA while standing next to a machine. Needs answers in 10 seconds. Prefers voice. Speaks Hinglish.

**Core job:** "Tell me the last three issues with this pump, right now."

### Persona B — Priya, Maintenance Engineer (34)

Sits at a desk but also does floor rounds. Manages work orders. Needs to pull asset history for RCA (Root Cause Analysis) reports. Comfortable with structured data but not a data scientist.

**Core job:** "Give me everything we know about T-101 for the audit next week."

### Persona C — Arvind, Plant Manager (52)

Responsible for uptime and risk. Presents to board. Cares about which equipment is a liability. Wants a single-screen view he can show in a board deck.

**Core job:** "Which assets are we most vulnerable on if a key person leaves?"

---

## 5. Core Features

### 5.1 Asset-Thread RAG Engine

**What it is:** Every equipment tag extracted from ingested documents becomes a first-class entity with its own growing thread of knowledge items — document sections, work orders, incident reports, voice notes, expert interviews.

**How it works:**
1. Document uploaded → Claude API extracts all equipment tags via NLP
2. Each tag gets a ChromaDB collection seeded with relevant chunks
3. On query, the asset's thread is retrieved (not a flat vector search) and Claude reasons across the full thread history
4. Response includes source citations pointing to original documents

**Key differentiator:** Multi-hop reasoning across the asset's complete history, not keyword matching across a document corpus.

### 5.2 Guru Mode — Expert Knowledge Capture

**What it is:** An AI-powered structured interview system that captures tacit knowledge from domain experts before they leave.

**How it works:**
1. System detects which asset threads have dangerous knowledge concentration (1 expert, low doc coverage)
2. Admin initiates Guru Mode session for that expert + asset pair
3. Claude conducts a targeted interview — asking specific questions derived from the knowledge gaps in that asset's thread
4. Responses are structured, embedded, and permanently added to the asset thread
5. Knowledge Debt Score for that asset updates live

**Emotional hook:** The retiring expert sees their knowledge preserved. The plant knows nothing was lost.

### 5.3 Knowledge Debt Score

**What it is:** A real-time per-asset metric that quantifies how vulnerable the organization is if key people leave or documents are lost.

**Scoring dimensions:**
- Document coverage (what % of known issues are documented)
- Expert distribution (how many people hold knowledge about this asset)
- Recency (how current is the documented knowledge)
- Operational criticality (how critical is this asset to plant uptime)

**Output:** A score from 0–100 (100 = maximum debt/risk) with a color-coded severity label: OK / WARNING / CRITICAL

**Example:** "Transformer T-101 — Knowledge Debt: CRITICAL (87). 80% of operational knowledge resides with 1 expert retiring in 3 months."

### 5.4 Voice Query Interface

**What it is:** Browser-native voice input using Web Speech API, supporting Hindi, Hinglish, and English queries.

**Example query:** "UPS-01 mein last month kya issues aaye?"  
**Response:** Last 3 incidents from UPS-01's thread, with source citations and timestamps.

No third-party dependency. Zero extra infrastructure. Works on PWA.

### 5.5 3D Knowledge Graph Visualization

**What it is:** A React Three Fiber 3D graph where nodes are equipment tags, edges represent knowledge relationships, and node color/size encodes Knowledge Debt Score.

**Interaction:** Click a node → asset thread detail panel opens. Nodes pulse red when CRITICAL. Nodes turn green in real time as Guru Mode adds knowledge.

---

## 6. Demo Flows (Hackathon)

### Flow 1 — Document Ingestion → Thread Build
1. Drop Schneider UPS manual PDF onto the upload zone
2. Live animation: Claude extracts tags, threads spin up, knowledge count increments per tag
3. Asset-Thread Store populates: UPS-01 (127 items), Pump P-207 (83 items), T-101 (64 items)

### Flow 2 — Voice Query (Crowd Pleaser)
1. Press mic button, speak: "UPS-01 mein last month kya issues aaye?"
2. SMRITI pulls UPS-01's thread, returns 3 most recent incidents
3. Each result shows: date, issue summary, source citation (document + page)

### Flow 3 — Guru Mode + Knowledge Debt Dashboard
1. Open dashboard: T-101 glowing red (CRITICAL), UPS-01 green (OK)
2. Click "Interview Expert" on T-101
3. AI conducts structured interview — questions auto-generated from knowledge gaps
4. Watch T-101's score improve live as answers are embedded
5. 3D graph node color transitions from red → amber → green

---

## 7. Success Metrics (Hackathon)

| Metric | Target |
|---|---|
| Document ingestion to thread build time | < 30 seconds for a 50-page PDF |
| Voice query response time | < 5 seconds end to end |
| Knowledge Debt Score accuracy | Judges find it intuitive and credible |
| Demo stability | Zero crashes across 3 full demo runs |
| Wow factor | At least one judge asks "does this actually exist?" |

---

## 8. Constraints

- **Time:** Hackathon timeline (72 hours build)
- **Infrastructure:** No paid cloud infra — ChromaDB local, OpenRouter API for LLM calls
- **Team size:** Solo or small team
- **Data:** Must use real industrial documents for demo credibility (Railtel CDC Noida UPS manuals, SLDs, cable schedules)
- **Connectivity:** Demo environment may have unstable internet — PWA offline mode required for core UI

---

## 9. Out of Scope

- Real-time IoT sensor integration
- SAP/Maximo CMMS connectors
- Multi-plant / multi-tenant architecture
- Hardware OCR pipelines for printed P&IDs
- Native iOS / Android apps

---

## 10. Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Claude API latency spikes during demo | Medium | Pre-cache demo queries; use streaming responses |
| Voice recognition accuracy in Hindi | Medium | Fallback to text input; test Web Speech API with Hindi locale |
| ChromaDB cold start too slow | Low | Pre-load demo asset threads before presentation |
| Judges unfamiliar with CMMS domain | Medium | Open with 30-second plant floor video showing the problem |

---

*Document version 1.0 — SMRITI PRD — ET AI Hackathon 2026*
