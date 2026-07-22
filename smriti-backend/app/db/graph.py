
import networkx as nx

_graph: nx.Graph | None = None


def init_graph() -> None:
    global _graph
    _graph = nx.Graph()


def get_graph() -> nx.Graph:
    if _graph is None:
        raise RuntimeError("Graph not initialized — call init_graph() first")
    return _graph
