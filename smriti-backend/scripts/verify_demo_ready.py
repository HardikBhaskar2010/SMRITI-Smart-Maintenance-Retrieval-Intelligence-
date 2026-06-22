#!/usr/bin/env python3
"""
SMRITI Demo Readiness Verifier
Checks all systems are go before the hackathon demo.

Run: python scripts/verify_demo_ready.py
"""
import sys, os, time, asyncio

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))


def check(label: str, fn) -> bool:
    try:
        result = fn()
        print(f"  ✓ {label}: {result}")
        return True
    except Exception as e:
        print(f"  ✗ {label}: FAILED — {e}")
        return False


def main():
    print("🔍 SMRITI Demo Readiness Check\n")
    results = []

    # 1. Env file
    results.append(check("ENV file", lambda: ".env found" if os.path.exists(".env") else (_ for _ in ()).throw(FileNotFoundError(".env missing"))))

    # 2. Data dirs
    for d in ["./data/chromadb", "./data/uploads", "./data/sessions"]:
        results.append(check(f"Dir {d}", lambda d=d: "exists" if os.path.exists(d) else (_ for _ in ()).throw(FileNotFoundError(f"{d} missing"))))

    # 3. ChromaDB + demo collections
    from app.db.chroma import init_chroma, get_chroma
    init_chroma(persist_dir="./data/chromadb")
    chroma = get_chroma()

    collections = chroma.list_collections()
    col_names = [c.name for c in collections]
    results.append(check("ChromaDB collections", lambda: f"{len(collections)} collections found"))

    required_assets = ["asset__ups_01", "asset__t_101", "asset__pump_p_207"]
    for col in required_assets:
        if col in col_names:
            c = chroma.get_collection(col)
            results.append(check(f"Collection {col}", lambda c=c: f"{c.count()} items"))
        else:
            print(f"  ✗ Collection {col}: NOT FOUND — run seed_demo_data.py first")
            results.append(False)

    # 4. API key
    from app.config import settings
    key = settings.OPENROUTER_API_KEY
    results.append(check("OpenRouter API key", lambda: "SET" if key and key != "sk-or-your-key-here" else (_ for _ in ()).throw(ValueError("API key not configured"))))

    # Summary
    passed = sum(1 for r in results if r)
    total = len(results)
    print(f"\n{'='*40}")
    if passed == total:
        print(f"🚀 ALL {total} CHECKS PASSED — Demo ready!")
    else:
        print(f"⚠️  {passed}/{total} checks passed — Fix failures above before demo")
    print('='*40)


if __name__ == "__main__":
    main()
