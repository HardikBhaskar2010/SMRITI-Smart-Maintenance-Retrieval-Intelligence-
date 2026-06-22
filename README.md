<div align="center">
  <img src="https://raw.githubusercontent.com/HardikBhaskar2010/SMRITI-Smart-Maintenance-Retrieval-Intelligence-/master/assets/logo.png" alt="SMRITI Logo" width="120" onerror="this.style.display='none'">
  <h1>SMRITI</h1>
  <p><b>Smart Maintenance Retrieval Intelligence</b></p>
  <p><i>Quantifying, Visualizing, and Eliminating Industrial Knowledge Debt.</i></p>

  [![Hackathon](https://img.shields.io/badge/ET_AI_Hackathon-2026-blueviolet?style=for-the-badge)](https://hackathon.economictimes.com/)
  [![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
  [![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
  [![ChromaDB](https://img.shields.io/badge/ChromaDB-FF4F4F?style=for-the-badge&logo=database)](https://www.trychroma.com/)
</div>

---

## 🏭 The Problem: "Knowledge Debt"
In industrial plants and critical data centers, senior technicians hold decades of unwritten "tribal knowledge" in their heads. When they retire, that knowledge vanishes. 
We call this **Knowledge Debt**. High knowledge debt leads to prolonged equipment downtime, safety risks, and operational paralysis.

## 💡 The Solution: SMRITI
**SMRITI** is an AI-powered industrial knowledge engine that prevents tribal knowledge loss. It auto-ingests maintenance manuals, quantifies the "Knowledge Debt" of every asset, visualizes dependencies in a 3D graph, and actively interviews experts to capture undocumented quirks before they leave.

---

## ✨ Key Features

### 📊 1. Knowledge Debt Dashboard
Calculates a real-time **Debt Score (0-100)** for every equipment piece (e.g., Transformers, UPS, Pumps). The score dynamically adjusts based on documentation coverage, recency, and reliance on single human experts. 
* *Green (OK)* | *Yellow (Warning)* | *Red (Critical Risk)*

### 🧠 2. Guru Mode (Tribal Knowledge Capture)
Instead of asking experts to fill out boring forms, SMRITI acts as an AI interviewer. It analyzes an asset's knowledge gaps and generates hyper-targeted questions. As the expert speaks, SMRITI structures their answers into the vector database, and you watch the **Debt Score drop in real-time**.

### 🎙️ 3. Multilingual Voice RAG
Floor technicians can hit a microphone button and ask questions in **English, Hindi, or Hinglish** *(e.g., "UPS-01 mein last month kya issues aaye?")*. SMRITI retrieves the exact maintenance log, cites the source, and speaks the answer back.

### 🕸️ 4. 3D Knowledge Graph
A React-Three-Fiber powered interactive 3D universe mapping out all assets and their relationships. Critical assets with high knowledge debt pulse in red, alerting managers instantly.

### 📂 5. Smart Automated Ingestion
Drag and drop PDFs, DOCX, or images. SMRITI automatically:
- Extracts equipment tags (e.g., `T-101`).
- Deduplicates data using SHA-256 hashing.
- Embeds knowledge into ChromaDB via real-time WebSocket streams.

---

## 🛠️ Technology Stack

**Frontend** (Industrial Dark Mode Aesthetics)
- **Core:** React 18, TypeScript, Vite
- **State Management:** Zustand
- **3D Graphics:** React Three Fiber (R3F), Drei
- **Animations:** Framer Motion, Vanilla CSS Modules

**Backend** (High-Performance RAG)
- **Core:** FastAPI, Python 3.11
- **Vector DB:** ChromaDB (Local persistent)
- **Graph DB:** NetworkX (In-memory)
- **LLM Routing:** OpenRouter API 
  - *RAG & Guru Mode:* `meta-llama/llama-3.3-70b-instruct`
  - *Data Extraction:* `cohere/north-mini-code`

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js v18+
- Python 3.11+
- An [OpenRouter](https://openrouter.ai/) API Key

### 1. Backend Setup
```bash
# Navigate to backend
cd smriti-backend

# Create virtual environment and install dependencies
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate # Mac/Linux
pip install -r requirements.txt

# Configure Environment
cp .env.example .env
# EDIT .env and add your OPENROUTER_API_KEY

# Seed the database with Demo Data (UPS-01, T-101, Pump P-207)
python scripts/seed_demo_data.py

# Warm up the cache for instant demo responses
python scripts/warm_demo_cache.py

# Start the FastAPI server
uvicorn app.main:app --reload
```
*Backend runs on `http://localhost:8000`*

### 2. Frontend Setup
```bash
# Navigate to frontend
cd smriti-frontend

# Install dependencies (legacy peer deps required for some 3D libs)
npm install --legacy-peer-deps

# Start Vite dev server
npm run dev
```
*Frontend runs on `http://localhost:5173`*

---

## 🎬 Demo Script

Want to see the magic? Follow this flow:
1. **Dashboard:** Notice `T-101` pulsing red. It has a high Knowledge Debt Score (87).
2. **Guru Mode:** Click "Start Interview" on `T-101`. SMRITI will ask *Ramesh Kumar* about monsoon vibration quirks. Answer the question and watch the Debt Score drop to 40!
3. **Query:** Go to the Query tab. Click the Mic and say: *"T-101 ka maintenance history kya hai?"*. See the AI instantly retrieve the answer in Hinglish with citations.
4. **Graph (3D):** Orbit around the 3D factory floor. Click on nodes to slide out their knowledge threads.

---

## 🛡️ License
Built with 🩵 for the **ET AI Hackathon 2026**. 
Industrial precision meets digital intelligence.
