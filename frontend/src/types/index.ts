export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  is_active: boolean;
  created_at: string;
  settings?: {
    gemini_api_key?: string;
    openai_api_key?: string;
    preferred_model?: string;
    theme_preference?: string;
  };
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface DocumentItem {
  id: string;
  filename: string;
  file_size: number;
  page_count: number;
  status: 'uploaded' | 'processing' | 'indexed' | 'error';
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentChunk {
  id: string;
  page_number: number;
  chunk_index: number;
  content: string;
}

export interface DocumentDetail extends DocumentItem {
  chunks: DocumentChunk[];
}

export interface Citation {
  citation_id: string;
  document_id: string;
  filename: string;
  page_number: number;
  text_snippet: string;
  confidence_score: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations: Citation[];
  created_at: string;
}

export interface ChatSession {
  id: string;
  title: string;
  document_ids: string[];
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface ChatSessionDetail extends ChatSession {
  messages: ChatMessage[];
}

export interface AskResponse {
  session_id: string;
  message_id: string;
  question: string;
  answer: string;
  citations: Citation[];
  has_sufficient_evidence: boolean;
  latency_ms: number;
}

export interface MCQOption {
  key: string;
  text: string;
}

export interface MCQItem {
  id: string;
  question: string;
  options: MCQOption[];
  correct_key: string;
  explanation: string;
  source_citation?: string;
  page_number?: number;
}

export interface FlashcardItem {
  id: string;
  front_prompt: string;
  back_answer: string;
  category: string;
  source_citation?: string;
  page_number?: number;
}

export interface RevisionTopic {
  topic: string;
  summary: string;
  key_takeaways: string[];
  source_page?: number;
}

export interface InterviewQuestion {
  question: string;
  expected_answer: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  source_citation?: string;
}

export interface StudyItem {
  id: string;
  user_id: string;
  document_id?: string;
  item_type: 'mcq' | 'flashcard' | 'summary' | 'interview';
  title: string;
  payload: {
    item_type: string;
    items: any[];
  };
  created_at: string;
}

export interface QueryLogItem {
  id: string;
  query_text: string;
  latency_ms: number;
  top_k_retrieved: number;
  created_at: string;
}

export interface AnalyticsSummary {
  total_documents: number;
  total_pages: number;
  total_chunks: number;
  total_conversations: number;
  total_queries: number;
  avg_latency_ms: number;
  recent_queries: QueryLogItem[];
  status_distribution: Record<string, number>;
  daily_activity: { day: string; queries: number; documents: number }[];
}

export interface MultiDocCompareResult {
  topic: string;
  summary: string;
  comparison_matrix: Array<Record<string, any>>;
  contradictions_and_differences: string[];
  synthesized_conclusions: string;
  citations: Array<{ document_id: string; filename: string; page_number: number; dimension: string }>;
}
