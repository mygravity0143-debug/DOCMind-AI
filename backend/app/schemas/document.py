from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class DocumentChunkOut(BaseModel):
    id: str
    page_number: int
    chunk_index: int
    content: str

    class Config:
        from_attributes = True

class DocumentOut(BaseModel):
    id: str
    filename: str
    file_size: int
    page_count: int
    status: str
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class DocumentDetailOut(DocumentOut):
    chunks: List[DocumentChunkOut] = []

class DocumentUploadResponse(BaseModel):
    id: str
    filename: str
    status: str
    message: str
