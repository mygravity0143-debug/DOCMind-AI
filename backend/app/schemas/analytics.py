from typing import List, Dict, Any
from pydantic import BaseModel

class QueryLogItem(BaseModel):
    id: str
    query_text: str
    latency_ms: float
    top_k_retrieved: int
    created_at: str

class AnalyticsSummaryOut(BaseModel):
    total_documents: int
    total_pages: int
    total_chunks: int
    total_conversations: int
    total_queries: int
    avg_latency_ms: float
    recent_queries: List[QueryLogItem]
    status_distribution: Dict[str, int]
    daily_activity: List[Dict[str, Any]]
