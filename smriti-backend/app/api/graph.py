"""GET /api/graph — NetworkX graph as node+edge JSON for R3F visualization"""
from fastapi import APIRouter
from app.db.graph import get_graph

router = APIRouter()


@router.get("/graph")
def get_knowledge_graph():
    graph = get_graph()
    nodes = []
    for node_id, data in graph.nodes(data=True):
        nodes.append({
            "id":         node_id,
            "asset_type": data.get("asset_type", "UNKNOWN"),
            "item_count": data.get("item_count", 0),
            "debt_score": data.get("debt_score", 0),
            "severity":   data.get("severity", "OK"),
        })

    edges = []
    for u, v, data in graph.edges(data=True):
        edges.append({
            "source":   u,
            "target":   v,
            "strength": data.get("strength", 1),
        })

    return {"nodes": nodes, "edges": edges}
