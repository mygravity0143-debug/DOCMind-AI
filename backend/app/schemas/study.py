from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class MCQOption(BaseModel):
    key: str  # A, B, C, D
    text: str

class MCQItem(BaseModel):
    id: str
    question: str
    options: List[MCQOption]
    correct_key: str
    explanation: str
    source_citation: Optional[str] = None
    page_number: Optional[int] = None

class FlashcardItem(BaseModel):
    id: str
    front_prompt: str
    back_answer: str
    category: str = "Concept"
    source_citation: Optional[str] = None
    page_number: Optional[int] = None

class RevisionTopic(BaseModel):
    topic: str
    summary: str
    key_takeaways: List[str]
    source_page: Optional[int] = None

class InterviewQuestion(BaseModel):
    question: str
    expected_answer: str
    difficulty: str  # Beginner, Intermediate, Advanced
    source_citation: Optional[str] = None

class StudyGenerateRequest(BaseModel):
    document_ids: List[str]
    item_type: str  # "mcq", "flashcard", "summary", "interview"
    topic_focus: Optional[str] = None
    count: int = 5

class StudyItemOut(BaseModel):
    id: str
    user_id: str
    document_id: Optional[str] = None
    item_type: str
    title: str
    payload: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True

class MultiDocCompareRequest(BaseModel):
    document_ids: List[str]
    aspects: Optional[List[str]] = None
    focus_topic: Optional[str] = None

class MultiDocCompareResponse(BaseModel):
    topic: str
    summary: str
    comparison_matrix: List[Dict[str, Any]]
    contradictions_and_differences: List[str]
    synthesized_conclusions: str
    citations: List[Dict[str, Any]]

class MultiDocSummarizeRequest(BaseModel):
    document_ids: List[str]
    max_sections: int = 5
