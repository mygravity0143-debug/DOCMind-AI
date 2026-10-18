import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class StudyItem(Base):
    __tablename__ = "study_items"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    document_id = Column(String(36), nullable=True)  # Can be specific doc or multi-doc
    item_type = Column(String(50), nullable=False)   # mcq, flashcard, summary, interview, notes
    title = Column(String(255), nullable=False)
    payload_json = Column(Text, nullable=False)       # JSON data structure
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="study_items")
