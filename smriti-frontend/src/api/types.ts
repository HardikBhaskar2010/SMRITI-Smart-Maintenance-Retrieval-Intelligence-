export type Severity = 'OK' | 'WARNING' | 'CRITICAL'

export interface AssetSummary {
  asset_id: string
  asset_type: string
  display_name: string
  debt_score: number
  severity: Severity
  item_count: number
  expert_count: number
  last_updated: string
  breakdown: {
    doc_penalty: number
    expert_penalty: number
    recency_penalty: number
    crit_penalty: number
  }
}

export interface ThreadItem {
  id: string
  content: string
  source_document: string
  source_page: number
  source_section: string
  added_by: string
  added_at: string
  expert_attributed: boolean
}

export interface AssetDetail extends AssetSummary {
  thread_items: ThreadItem[]
}

export interface Citation {
  source_document: string
  source_page?: number
  source_section?: string
  item_id: string
}

export interface QueryResponse {
  answer: string
  asset_ids_used: string[]
  citations: Citation[]
  thread_items_retrieved: number
  response_time_ms: number
}

export interface GuruSession {
  session_id: string
  asset_id: string
  expert_name: string
  started_at: string
  messages: GuruMessage[]
  questions_asked: number
  knowledge_added: number
  initial_debt_score: number
  current_debt_score: number
  status: 'active' | 'completed' | 'abandoned'
}

export interface GuruMessage {
  role: 'interviewer' | 'expert'
  content: string
  timestamp: string
}

export interface GraphNode {
  id: string
  asset_type: string
  item_count: number
  debt_score: number
  severity: Severity
}

export interface GraphEdge {
  source: string
  target: string
  strength: number
}

export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export interface IngestProgress {
  stage: 'extracting' | 'tagging' | 'embedding' | 'done' | 'error'
  document_name: string
  pages_processed?: number
  total_pages?: number
  tags_found?: string[]
  items_embedded?: number
  error?: string
}
