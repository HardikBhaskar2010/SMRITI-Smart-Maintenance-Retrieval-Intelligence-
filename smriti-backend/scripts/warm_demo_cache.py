#!/usr/bin/env python3
"""
SMRITI Demo Cache Warmer
Pre-loads the 5 demo queries so they respond from ChromaDB cache instantly.

Run: python scripts/warm_demo_cache.py
"""
import sys, os, asyncio, time

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

DEMO_QUERIES = [
    "UPS-01 mein last month kya issues aaye?",
    "T-101 ka maintenance history kya hai?",
    "What is the knowledge debt status of all assets?",
    "Pump P-207 last incident kab hua?",
    "Which assets have single expert dependency?",
]


async def warm():
    from app.db.chroma import init_chroma
    from app.db.graph import init_graph
    from app.services.rag.engine import run_query
    from app.models.query import QueryRequest

    init_chroma(persist_dir="./data/chromadb")
    init_graph()

    print("🔥 Warming demo query cache...\n")

    for i, query in enumerate(DEMO_QUERIES, 1):
        print(f"  [{i}/{len(DEMO_QUERIES)}] {query[:60]}...")
        t0 = time.time()
        try:
            result = await run_query(QueryRequest(query=query))
            elapsed = round(time.time() - t0, 1)
            print(f"      ✓ {elapsed}s — {result.thread_items_retrieved} items retrieved")
        except Exception as e:
            print(f"      ✗ ERROR: {e}")

    print("\n✅ Cache warm-up complete. Demo queries should respond < 3s now.")


if __name__ == "__main__":
    asyncio.run(warm())
