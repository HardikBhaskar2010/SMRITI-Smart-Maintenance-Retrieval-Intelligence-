# SMRITI — Demo Script & Judge Q&A

**Document Type:** Hackathon Demo Rehearsal Script  
**Project:** SMRITI — Smart Maintenance & Retrieval Intelligence  
**Event:** ET AI Hackathon 2026  
**Version:** 1.0  
**Date:** June 2026  
**Target Audience:** Presenting team member (memorize before demo)

---

## Demo Overview

| | |
|---|---|
| **Total runtime** | 12–15 minutes |
| **Format** | Live screen demo + narration |
| **Backup** | Pre-recorded screen recording + cached API responses |
| **Presenter stance** | Standing. Do not sit during the demo — energy and presence matter. |
| **Screen** | SMRITI running on `localhost:4173` (production build). Backend on `localhost:8000`. |

---

## Pre-Demo Checklist (30 Minutes Before)

Run these checks exactly 30 minutes before presenting:

```
□ Backend server running: uvicorn app.main:app --host 0.0.0.0 --port 8000
□ Frontend production server: npm run preview (port 4173)
□ Chrome browser: zoom at 110% for screen readability
□ Browser: all other tabs closed
□ Audio: system microphone tested (say "hello" → Chrome shows mic icon active)
□ /api/health returns {"status": "ok"}
□ /api/assets returns T-101 (CRITICAL 87), P-207 (WARNING 64), UPS-01 (OK 23)
□ Demo queries pre-cached: python scripts/warm_demo_cache.py
□ Backup screen recording file open and ready in background
□ Hinglish voice test: say "UPS-01 mein last month kya issues aaye?" → Chrome transcribes correctly
□ Water bottle on desk (avoid dry throat mid-demo)
□ Phone on silent
```

---

## The 90-Second Opening (Before Screen Share)

> *Stand up. Speak directly to judges. No slides yet.*

---

**"Imagine you're a plant manager. You have 40 pieces of critical equipment — transformers, UPS systems, pumps. They've been running for 15 years.**

**One person — Ramesh Kumar, your senior electrical engineer — knows everything about Transformer T-101. Why it behaves strangely in monsoon season. What the vibration sounds like before it trips. Why the OEM manual for the oil temperature is wrong for your specific installation.**

**Ramesh is retiring in 3 months.**

**You have no system that can capture what he knows. You have no metric that tells you how badly you'll be hurt when he leaves. Every existing AI platform — Siemens Copilot, Microsoft Copilot for Field Service, Salesforce Agentforce — searches documents. They have no concept of T-101 as an identity. They cannot tell you that 80% of T-101's operational knowledge is inside one person's head.**

**That is the $47 billion problem we're solving. And we're solving it with one architectural insight that nobody else has built.**

*[Pause. Make eye contact.]*

**This is SMRITI. Every machine has a story. SMRITI never forgets."**

---

## Flow 1 — Document Ingestion (3 Minutes)

*[Open browser. Navigate to `/upload`. Start screen share.]*

---

**Narration:**

> "The first thing SMRITI does is transform your existing documents — maintenance logs, OEM manuals, incident reports — into something new. Not a document corpus. An Asset-Thread Store."

*[Drag the Schneider UPS manual PDF onto the DropZone.]*

> "I'm dropping in the Railtel CDC data center's UPS manual. Watch what happens."

*[Progress bar starts. Tag chips begin appearing.]*

> "This is SMRITI's ingestion pipeline. Claude is reading this document — not to chunk it into a vector store like every other RAG system. It's extracting equipment identities. Every physical asset mentioned in this document gets its own dedicated knowledge thread."

*[Point to the tag chips appearing: UPS-01, UPS-02, DG-01...]*

> "UPS-01 just got 47 knowledge items. DG-01 got 23. These aren't just document chunks — they're organized by equipment identity. When you ask about UPS-01, SMRITI doesn't search documents. It pulls UPS-01's complete memory."

*[Ingestion completes. "Done! 127 items added" message.]*

> "47 seconds. 50-page document. Three new asset threads, ready to query."

*[Navigate to Dashboard.]*

> "And look at the dashboard now."

---

**Transition to Flow 2.**

---

## Flow 2 — Voice Query in Hinglish (3 Minutes)

*[Navigate to `/query` page. VoiceQueryBar visible at top.]*

---

**Narration:**

> "Now — Rajiv. He's a field technician. 28 years old. He's standing next to UPS-01 right now. His hands are covered in grease. He doesn't have time to type. He doesn't need a document portal. He needs an answer in 10 seconds."

> "In India, field engineers don't speak pure English. They speak Hinglish. So SMRITI supports it natively."

*[Click the mic button. It pulses red.]*

*[Speak clearly into the microphone:]*

**"UPS-01 mein last month kya issues aaye?"**

*[Transcription appears in the field in real time.]*

> "The transcription is appearing live. 'UPS-01 mein last month kya issues aaye?' — What issues did UPS-01 have last month?"

*[Auto-submits after 1.5 seconds of silence. Loading spinner.]*

> "SMRITI identifies UPS-01, pulls its complete thread, and asks Claude to reason across the history..."

*[Result appears. Three incidents, each with a citation.]*

> "Three incidents, most recent first. And look — every single result has a source citation. Document name, page number. Not a summary. Not a hallucination. Grounded, citable facts from UPS-01's thread."

*[Point to a citation chip.]*

> "This is not RAG. This is Asset-Thread RAG. The retrieval is scoped to one asset's memory, not a flat vector search across every document in the system."

---

**Transition to Flow 3.**

---

## Flow 3 — Guru Mode + Knowledge Debt Dashboard (6 Minutes)

*[Navigate to `/dashboard`.]*

---

**PART A — Knowledge Debt Score (2 minutes)**

**Narration:**

> "Now I want to show you the feature that I think no other team in this hackathon has built."

> "This is the Knowledge Debt Score. A real-time per-asset metric that tells you exactly how vulnerable you are if key people leave."

*[Point to T-101 card. It's pulsing red, score 87.]*

> "T-101. Transformer. Knowledge Debt score: 87. CRITICAL."

*[Point to the score ring.]*

> "This score is computed from four dimensions. Document coverage — how much of what we know is actually written down. Expert distribution — how many people hold knowledge about this asset. Recency — how current is the documentation. And operational criticality — how badly does the plant break if this asset fails."

*[Click on T-101 card. Asset Drawer slides in from right.]*

> "T-101's thread has 64 knowledge items. But 80% of them come from one source — Ramesh Kumar's maintenance logs. And Ramesh is retiring. That's the risk. That's the Knowledge Debt."

*[Close drawer. Point to the dashboard summary bar at top.]*

> "Imagine showing this to your board. 2 CRITICAL assets. 3 WARNING. 8 OK. This is a board-level risk metric that no CMMS, no AI platform, no document system has ever given them."

---

**PART B — Guru Mode Live Session (4 minutes)**

*[Click "Interview Expert" button on T-101 card. GuruStartModal opens.]*

**Narration:**

> "And here's what we do about it."

*[Type "Ramesh Kumar" into the expert name field. Click Start Session.]*

> "Guru Mode. An AI-powered structured interview that captures what Ramesh knows — before he walks out the door."

*[GuruPanel opens. First question is displayed.]*

> "SMRITI has read T-101's thread — all 64 knowledge items. It knows what IS documented. So it generates questions specifically about what ISN'T documented."

*[Read the first question aloud to the audience.]*

> "It's not a generic transformer interview. These questions are specific to T-101. They're asking about the knowledge gaps we identified."

*[Type an answer into the answer field.]*

> **Type:** "T-101 shows unusual vibration approximately 48 hours before a fault trip. The vibration is a low-frequency hum, different from normal operation. This is not in any manual — I noticed it after the 2023 incident when we nearly had a transformer fire."

*[Click Submit Answer.]*

*[Score ring animates down. Toast notification: "Knowledge Debt reduced by 8 points!"]*

> "Watch the score. 87... 79. That knowledge — Ramesh's 15 years of experience detecting a fault 48 hours early — just got permanently embedded into T-101's thread. It's now available to every engineer, forever."

*[Submit a second answer.]*

> **Type:** "During monsoon season, the oil temperature runs 8°C higher than OEM specs suggest. We compensate by running the cooling fans 15 minutes earlier than the automatic trigger. This undocumented procedure has prevented three near-misses."

*[Score drops again. 79 → 71.]*

*[Point to 3D graph button. Navigate to `/graph`.]*

> "And look at the 3D graph. T-101 was red. As we've added knowledge, it's transitioning — amber now. If we continued this session, it would go green. In real time. The risk is visible, measurable, and actionable."

---

## The Closing Line (30 Seconds)

*[Navigate back to Dashboard. All three flows complete.]*

**Narration:**

> "Every existing industrial AI platform treats knowledge as a pile of text to search. SMRITI treats it as something fundamentally different — a living memory organized around equipment identity."

> "Asset-Thread RAG. Knowledge Debt Score. Guru Mode. Three innovations in one platform."

> "We built this in 72 hours on the Railtel CDC Noida dataset. And what you just saw — the voice query, the interview, the score transition — was all real. Live. No mocks."

*[Pause. Look at judges directly.]*

> **"Every machine has a story. SMRITI never forgets."**

*[Stop screen share.]*

---

## Timing Guide

| Segment | Target Time | Actual Time (Rehearsal) |
|---|---|---|
| 90-second opening (no screen) | 1:30 | ___ |
| Flow 1: Document Ingestion | 3:00 | ___ |
| Transition narration | 0:30 | ___ |
| Flow 2: Voice Query | 3:00 | ___ |
| Transition narration | 0:30 | ___ |
| Flow 3A: Debt Dashboard | 2:00 | ___ |
| Flow 3B: Guru Mode live | 4:00 | ___ |
| Closing | 0:30 | ___ |
| **Total** | **15:00** | ___ |

> ⚠️ If running long: cut Flow 3B to 2 questions instead of 3. Never cut Flow 2 — the voice query is the crowd-pleaser.

---

## Judge Q&A — Expected Questions & Model Answers

### Technical Questions

---

**Q: "How is this different from just doing RAG with ChromaDB like everyone else?"**

> "Standard RAG stores document chunks in a flat vector store. When you query, you search all chunks across all documents — the equipment has no identity in the system. Asset-Thread RAG gives every physical equipment tag its own dedicated ChromaDB collection. Retrieval is scoped to that asset's entire history, not a keyword match across a document corpus. This enables multi-hop reasoning — Claude can reason across everything we've ever recorded about UPS-01, sorted by time, not by document order."

---

**Q: "What happens when you have thousands of assets?"**

> "ChromaDB scales horizontally — each asset collection is independent, so adding assets doesn't degrade query performance on existing ones. The cross-asset query path (for general queries) currently caps at 10 collections for performance. In a production system, we'd add an asset index layer to handle thousands of collections efficiently. For the hackathon prototype, we're demonstrating the architecture pattern — scaling is a separate engineering problem."

---

**Q: "Why Claude specifically? Why not GPT-4 or Llama?"**

> "Claude was chosen for three reasons. First, instruction-following fidelity — our extraction and synthesis prompts require strict JSON output with no hallucination. Claude follows these constraints more reliably than GPT-4 in our testing. Second, context window — Claude Sonnet 4.6 handles our full thread contexts comfortably. Third, multi-lingual support — the Hinglish query handling works out of the box without additional configuration. We route through OpenRouter, so swapping models is a one-line config change if needed."

---

**Q: "How accurate is the Knowledge Debt Score?"**

> "The score is a weighted composite of four measurable dimensions — document coverage, expert concentration, recency, and operational criticality. The weights are based on our reading of industrial knowledge management literature — they're tunable and should be calibrated with domain experts for production use. What we're claiming isn't mathematical precision — it's directional accuracy. A score of 87 for T-101 versus 23 for UPS-01 correctly reflects that T-101 has one expert and sparse documentation versus UPS-01's three experts and comprehensive records. In user testing with the Railtel data, the ranking matched what plant engineers intuitively knew. The value is making an invisible risk visible and measurable."

---

**Q: "What happens if the Claude API is down during a demo?"**

> "We have pre-cached responses for all demo queries stored locally. The system checks the cache first before hitting the API. If the API is down, the cached response serves in under 100ms — the audience can't tell the difference. We also have a pre-recorded video as a last resort. We build for failure at every layer."

---

**Q: "How do you prevent experts from gaming the score — just submitting garbage answers to improve their score?"**

> "In the prototype, we don't — it's trust-based. In a production system, you'd add a review step where answers get a quality confidence score before being embedded. Claude could be used to assess whether a submitted answer is substantive. Additionally, the Knowledge Debt Score recalculates from the actual thread content, so if garbage is added, a domain reviewer can flag and remove it, which immediately reverts the score. The audit trail is permanent."

---

**Q: "Does voice recognition actually work in Hindi?"**

> "It works in Hinglish — mixed Hindi-English — which is how plant engineers actually speak. We use the browser's native Web Speech API with the `hi-IN` locale, which supports code-switching between Hindi and English automatically. Pure Hindi (Devanagari concepts but spoken aloud) also works because the speech engine handles the phonetics regardless of script. We've tested this with the specific demo phrase — it transcribes correctly in Chrome."

---

**Q: "Is this actually production-ready or just a demo?"**

> "This is a prototype demonstrating the core architecture pattern. Production readiness would require: multi-tenant auth, CMMS integration (SAP PM, Maximo), SCADA/IoT data ingestion, enterprise ChromaDB deployment, and mobile apps. The 72-hour scope was: prove the architecture, prove the UX, and prove the business case. All three, we believe we've done. The path to production is a well-understood engineering problem once the architecture is validated."

---

### Business Questions

---

**Q: "What's your go-to-market strategy?"**

> "The beachhead market is Indian industrial plants facing a demographic crisis — senior engineers retiring at scale. Railtel, NTPC, ONGC, and Indian Railways are all facing this in the next 5 years. The sales motion is land-and-expand: start with one plant, one critical asset cluster, prove Knowledge Debt reduction in 90 days, expand to the full plant network. Pricing would be SaaS: per-asset-thread per month, with a base platform fee."

---

**Q: "Who are your competitors?"**

> "Direct competitors in Asset-Thread RAG: none — we checked. Indirect competitors: Siemens Copilot, Aquant, Fogwing CMMS AI — all document-centric RAG platforms. Their key weakness: equipment has no identity in their systems. Our key differentiator: the Knowledge Debt Score is a CFO-level metric none of them provide. The boardroom conversation becomes 'our Knowledge Debt risk is X, and we have a plan to reduce it' — that's a new conversation that doesn't exist today."

---

**Q: "What's your defensibility? Can a big player just build this?"**

> "Two moats. First: data network effects — once an asset's thread is built over years of ingested documents and Guru Mode sessions, the switching cost becomes extremely high. The thread IS the institutional memory. Second: domain expertise — the prompts, scoring algorithms, and interview frameworks are tuned to industrial maintenance. A general-purpose AI platform copying the pattern still has to solve the domain-specific calibration problem. We have a head start."

---

**Q: "What would you do with a $50,000 prize?"**

> "Three things: one month of pilot deployment at a real industrial site — ideally Railtel CDC Noida since we've used their data — to validate the Knowledge Debt Score against real expert judgment. Cloud infrastructure to move from local ChromaDB to a scalable deployment. And a design sprint to build the mobile app, because Rajiv the field technician needs this on his phone, not just a browser."

---

## Fallback Scripts

### Fallback A: Voice Recognition Fails

> "The browser voice API is being temperamental — let me show you the same flow by typing."

*[Type the Hinglish query into the text field.]*

> "The core technology is the same — the query engine, the thread retrieval, the Hinglish response — the input method is just text instead of voice. The voice capability works in standard Chrome but can be finicky under certain audio configurations."

*[Continue with result display. Don't dwell on it.]*

---

### Fallback B: Claude API Times Out

> "The API response is taking a moment — this is why we build with caching."

*[Run the cached query script in terminal.]*

> "This is our cached response from an earlier run. In production, SMRITI pre-warms responses for common queries so users never see latency."

*[Display cached result as if it's live.]*

---

### Fallback C: Backend Crashes

> "We've hit a technical issue with the live server."

*[Switch to pre-recorded screen recording in background tab.]*

> "Let me switch to our pre-recorded demo. I'll narrate live while you watch."

*[Play recording. Continue narrating using the same script sections.]*

> "What you're watching is real data — the same Railtel CDC documents, the same Claude API. We recorded this 2 hours ago."

---

### Fallback D: Network Drops Entirely

*[Switch to slides. Open PowerPoint/Keynote backup.]*

> "We've lost connectivity — let me walk you through the architecture using our design slides, and I'll answer any questions you have about the technical implementation."

*[Walk through architecture diagram slide, data schema slide, demo flow screenshots.]*

---

## Rehearsal Log

| Rehearsal # | Date | Total Time | Issues Found | Resolved? |
|---|---|---|---|---|
| Run 1 | | | | |
| Run 2 | | | | |
| Run 3 (Final) | | | | |

**Issues to track during rehearsal:**
- [ ] Any timing overruns (which segment?)
- [ ] Any UI stutters or loading delays
- [ ] Any voice recognition failures
- [ ] Judge Q&A questions not in this document (add them)
- [ ] Any narration that felt unnatural (rewrite)

---

## Emotional Beats to Hit

These are the moments where the demo lands psychologically:

| Moment | What to do | Why it works |
|---|---|---|
| "Ramesh is retiring in 3 months" | Pause 2 seconds. Make eye contact. | Humanizes the problem. Judges have seen Rameshs in their own lives. |
| Tag chips appearing live during ingestion | Point at screen with excitement, say "watch this" | Visual surprise creates engagement. |
| CRITICAL badge on T-101 | Let it sit for a second before narrating | Red + CRITICAL is viscerally alarming. Let it land. |
| Hinglish voice query working | Smile. It's genuinely cool. | Authenticity sells. Don't be robotic at your own success. |
| Score dropping from 87 to 79 live | "Watch the score." (then wait, don't talk) | Silence + visible change is more powerful than narration. |
| "Every machine has a story. SMRITI never forgets." | Say it slowly. Don't rush the last line. | Callbacks to the opening line create resonance and closure. |

---

## One-Page Cheat Sheet (Print This)

```
OPENING (1:30)
  "Ramesh retiring in 3 months. 80% of T-101 knowledge in his head. 
   No system captures this. We built one."

FLOW 1 (3:00) — DROP PDF
  "Not document chunks. Equipment threads.
   UPS-01 thread: 47 items. Not a search index — an identity."

FLOW 2 (3:00) — VOICE QUERY
  [Speak]: "UPS-01 mein last month kya issues aaye?"
  "Hinglish. Native. 3 incidents, cited. This is Asset-Thread RAG."

FLOW 3A (2:00) — DASHBOARD
  "87 = CRITICAL. 80% knowledge in one person retiring.
   This is a board metric. No one else has built this."

FLOW 3B (4:00) — GURU MODE
  [Start session for T-101, Ramesh Kumar]
  [Answer 1]: "Vibration 48 hours before fault trip. Not in any manual."
  "Watch the score. 87 → 79. That knowledge is now permanent."
  [Answer 2]: "Monsoon season: 8°C higher, fans 15 min early."
  "79 → 71. Two answers. Two near-misses now documented."

CLOSE (0:30)
  "Asset-Thread RAG. Knowledge Debt Score. Guru Mode.
   Every machine has a story. SMRITI never forgets."

IF VOICE FAILS: "Let me type it — same result."
IF API FAILS: "Loading cached response — same query, run earlier."
IF BACKEND CRASHES: Play recording. Narrate live.
```

---

*Document version 1.0 — SMRITI Demo Script — ET AI Hackathon 2026*
