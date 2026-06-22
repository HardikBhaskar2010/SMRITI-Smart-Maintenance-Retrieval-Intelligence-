#!/usr/bin/env python3
"""
SMRITI Demo Data Seeder
Seeds ChromaDB with realistic demo data for:
  - UPS-01     (OK, score ~23)       — 3 experts, 45 items
  - T-101      (CRITICAL, score ~87) — 1 expert, 12 items
  - Pump P-207 (WARNING, score ~64)  — 1 expert, 22 items

Run: python scripts/seed_demo_data.py
"""
import sys, os, uuid
from datetime import datetime, timezone, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.db.chroma import init_chroma, get_chroma
from app.db.graph import init_graph, get_graph

CHROMA_DIR = "./data/chromadb"

# ── Demo items ────────────────────────────────────────────────────

DEMO_ASSETS = {
    "UPS-01": {
        "asset_type": "UPS",
        "expert_names": ["Suresh Nair", "Priya Sharma", "Vikas Mehta"],
        "items": [
            ("Railtel_CDC_Level2_March.docx", 14, "3.2 Maintenance Log",
             "UPS-01 underwent scheduled bypass maintenance on 2026-03-12. Input voltage dropped to 380V during the transition window. System recovered within 45 seconds."),
            ("Railtel_UPS_Manual_v3.pdf", 22, "Battery Specifications",
             "UPS-01 battery bank: 120V DC, 200Ah. Manufacturer: Exide. Last replaced: 2024-06-15. Expected life: 5 years. Next replacement due: 2029-06."),
            ("Maintenance_Log_Feb.pdf", 6, "Incident Record",
             "2026-02-28: Battery health check showed cell #7 degraded to 78% capacity. Monitoring interval increased to weekly. No immediate replacement needed."),
            ("Incident_Report_Jan.docx", 2, "Incident Summary",
             "2026-01-15: Input voltage dip to 365V recorded at 03:22 IST. UPS transferred to battery for 8 minutes. Root cause: grid fluctuation from substation maintenance."),
            ("CDC_Noida_SLD_2025.pdf", 45, "Single Line Diagram",
             "UPS-01 feeds: Server Room A (critical load 12kVA), NOC equipment (8kVA), emergency lighting (2kVA). Total protected load: 22kVA of 30kVA rated capacity."),
            ("Annual_Report_2025.docx", 12, "Maintenance Summary",
             "UPS-01 annual uptime: 99.94%. Two incidents in 2025: voltage dip (Jan) and bypass maintenance (Mar). Both resolved within SLA. Battery life 92% of rated."),
            ("Work_Order_WO2026_034.pdf", 1, "Work Order",
             "WO-2026-034: Quarterly PM. Performed by Suresh Nair. Checked: battery cells (all green except cell 7), breaker contacts, cooling fans, display panel. Result: Pass."),
        ],
    },
    "T-101": {
        "asset_type": "TRANSFORMER",
        "expert_names": ["Ramesh Kumar"],
        "items": [
            ("Legacy_Maintenance_Notes.pdf", 3, "Expert Notes",
             "T-101 has a tendency to vibrate slightly during monsoon season due to moisture ingress in the bushings. Ramesh manually tightens bushing clamps every June before monsoon."),
            ("Inspection_Report_2025.docx", 8, "Inspection",
             "T-101 oil temperature trending 5°C above baseline since December 2025. Possible cause: cooling fan #2 intermittent. Manual inspection shows bearing wear."),
            ("CDC_Equipment_Register.xlsx", 1, "Equipment Register",
             "T-101: 1000 kVA, 33kV/11kV, Delta-Star, ONAN cooling, manufactured 2015, commissioned 2016. MSEDCL registration: MH-TRANS-2016-4478."),
        ],
    },
    "Pump P-207": {
        "asset_type": "PUMP",
        "expert_names": ["Santosh Rane"],
        "items": [
            ("HVAC_Maintenance_Log.pdf", 4, "Maintenance Log",
             "Pump P-207 seal replacement performed on 2026-01-20. New mechanical seal installed. Flow rate restored to 45 m3/hr. Santosh notes: always prime with 30% speed before full load."),
            ("Pump_Spec_Sheet.pdf", 1, "Specifications",
             "P-207: Kirloskar submersible pump, 15kW, 3-phase 415V. Design flow: 48 m3/hr at 25m head. Impeller: stainless steel 316L. Wear ring clearance: 0.3mm."),
            ("Quarterly_PM_Q1_2026.docx", 7, "PM Report",
             "P-207 vibration reading: 4.2 mm/s RMS (baseline 2.8). Slightly elevated. Santosh recommends bearing inspection at next scheduled PM (April 2026)."),
            ("Incident_Log_2025.pdf", 15, "Incident",
             "P-207 tripped on overload 2025-11-08 at 14:33. Root cause: debris in suction strainer causing cavitation. Cleared in 45 minutes. Strainer cleaning interval changed to weekly."),
        ],
    },
}


def seed():
    os.makedirs(CHROMA_DIR, exist_ok=True)
    os.makedirs("./data/uploads", exist_ok=True)
    os.makedirs("./data/sessions", exist_ok=True)

    init_chroma(persist_dir=CHROMA_DIR)
    init_graph()
    chroma = get_chroma()
    graph = get_graph()

    base_time = datetime.now(timezone.utc)

    for asset_id, config in DEMO_ASSETS.items():
        from app.utils.tag_normalizer import normalize_asset_id
        col_name = normalize_asset_id(asset_id)

        # Get or create collection
        col = chroma.get_or_create_collection(
            name=col_name,
            metadata={"asset_id": asset_id, "asset_type": config["asset_type"]},
        )

        existing_count = col.count()
        added = 0

        for i, (doc_name, page, section, content) in enumerate(config["items"]):
            import hashlib
            content_hash = hashlib.sha256(content.encode()).hexdigest()
            existing = col.get(where={"content_hash": content_hash})
            if existing["ids"]:
                continue

            days_ago = len(config["items"]) - i
            timestamp = (base_time - timedelta(days=days_ago)).isoformat()

            col.add(
                ids=[str(uuid.uuid4())],
                documents=[content],
                metadatas=[{
                    "asset_id": asset_id,
                    "source_document": doc_name,
                    "source_page": page,
                    "source_section": section,
                    "added_by": "ingestion_pipeline",
                    "added_at": timestamp,
                    "expert_attributed": False,
                    "expert_name": "",
                    "content_hash": content_hash,
                }],
            )
            added += 1

        # Add extra items to reach target counts
        target_counts = {"UPS-01": 45, "T-101": 12, "Pump P-207": 22}
        target = target_counts.get(asset_id, 10)
        current = col.count()

        for j in range(max(0, target - current)):
            content = f"[Auto-generated knowledge item {j+1} for {asset_id}] Routine maintenance check completed. All parameters within specification."
            import hashlib
            content_hash = hashlib.sha256(content.encode()).hexdigest()
            timestamp = (base_time - timedelta(days=j)).isoformat()
            col.add(
                ids=[str(uuid.uuid4())],
                documents=[content],
                metadatas=[{
                    "asset_id": asset_id,
                    "source_document": f"AutoSeed_Record_{j}.pdf",
                    "source_page": j + 1,
                    "source_section": "Routine PM",
                    "added_by": "ingestion_pipeline",
                    "added_at": timestamp,
                    "expert_attributed": False,
                    "expert_name": "",
                    "content_hash": content_hash,
                }],
            )

        # Update graph
        if not graph.has_node(asset_id):
            graph.add_node(asset_id,
                item_count=col.count(),
                asset_type=config["asset_type"],
                experts=config["expert_names"],
            )
        else:
            graph.nodes[asset_id]["item_count"] = col.count()

        print(f"  ✓ {asset_id}: {col.count()} items, {len(config['expert_names'])} experts")

    # Add graph edges (assets co-appear in shared documents)
    edges = [("UPS-01", "T-101"), ("T-101", "Pump P-207"), ("UPS-01", "Pump P-207")]
    for src, tgt in edges:
        if not graph.has_edge(src, tgt):
            graph.add_edge(src, tgt, type="co_document")

    print("\n✅ Demo data seeding complete!")
    print("   UPS-01   → OK (score ~23)")
    print("   T-101    → CRITICAL (score ~87)")
    print("   P-207    → WARNING (score ~64)")
    print("\n   Run the backend: uvicorn app.main:app --reload")


if __name__ == "__main__":
    print("🌱 Seeding SMRITI demo data...")
    seed()
