from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class Citation(BaseModel):
    citation_id: str
    document_id: str
    filename: str
    page_number: int
    text_snippet: str
    confidence_score: float = 1.0

class ChatAskRequest(BaseModel):
    session_id: Optional[str] = None
    question: str
    document_ids: Optional[List[str]] = None
    stream: bool = False

class ChatAskResponse(BaseModel):
    session_id: str
    message_id: str
    question: str
    answer: str
    citations: List[Citation] = []
    has_sufficient_evidence: bool = True
    latency_ms: float = 0.0

class ChatMessageOut(BaseModel):
    id: str
    role: str
    content: str
    citations: List[Citation] = []
    created_at: datetime

    class Config:
        from_attributes = True

class ChatSessionOut(BaseModel):
    id: str
    title: str
    document_ids: List[str] = []
    created_at: datetime
    updated_at: datetime
    message_count: int = 0

    class Config:
        from_attributes = True

class ChatSessionDetailOut(BaseModel):
    id: str
    title: str
    document_ids: List[str] = []
    created_at: datetime
    updated_at: datetime
    messages: List[ChatMessageOut] = []

    class Config:
        from_attributes = True

class ChatSessionUpdate(BaseModel):
    title: Optional[str] = None
    document_ids: Optional[List[str]] = None
