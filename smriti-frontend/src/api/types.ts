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
  breakdown?: {
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
  source_page: number | null
  source_section: string | null
  added_by: 'ingestion_pipeline' | 'guru_mode' | 'manual'
  added_at: string
  expert_attributed: boolean
  content_hash?: string
}

export interface AssetThread extends AssetSummary {
  thread_items: ThreadItem[]
  experts?: string[]
  created_at?: string
}

/** Alias: used by hooks that call /api/assets/{id} */
export type AssetDetail = AssetThread

export interface Citation {
  source_document: string
  source_page: number | null
  source_section: string | null
  item_id: string
}

export interface QueryRequest {
  query: string
  max_results?: number
  asset_id?: string
}

export interface QueryResponse {
  answer: string
  asset_ids_used: string[]
  citations: Citation[]
  thread_items_retrieved: number
  response_time_ms: number
}

export interface GuruMessage {
  role: 'interviewer' | 'expert' | 'system'
  content: string
  timestamp: string
  embedded: boolean
  item_id: string | null
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

export interface GuruRespondResult {
  next_question: string | null
  knowledge_added: number
  current_debt_score: number
  debt_change: number
  session: GuruSession
}

export interface GraphNode {
  id: string
  label: string
  asset_type: string
  item_count: number
  debt_score: number
  severity: Severity
}

export interface GraphEdge {
  source: string
  target: string
  type: string
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
  error?: string | null
}

export interface IngestResult {
  document_name: string
  tags_created: string[]
  tags_updated: string[]
  total_items_added: number
  duration_seconds: number
  duplicate_items_skipped: number
}
