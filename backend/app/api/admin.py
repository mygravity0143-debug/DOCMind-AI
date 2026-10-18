import os
import shutil
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.models.document import Document
from app.models.chat import ChatSession
from app.models.analytics import QueryLog
from app.api.deps import get_current_user

router = APIRouter(prefix="/admin", tags=["Admin Dashboard"])

@router.get("/stats")
def get_admin_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    total_users = db.query(User).count()
    total_docs = db.query(Document).count()
    total_sessions = db.query(ChatSession).count()
    total_queries = db.query(QueryLog).count()

    # Disk usage in uploads
    upload_size = sum(f.stat().st_size for f in settings.UPLOAD_DIR.glob("*") if f.is_file())
    vector_files_count = len(list(settings.VECTOR_DIR.glob("*.json")))

    return {
        "total_users": total_users,
        "total_documents": total_docs,
        "total_sessions": total_sessions,
        "total_queries": total_queries,
        "storage_used_bytes": upload_size,
        "storage_used_mb": round(upload_size / (1024 * 1024), 2),
        "vector_indices_count": vector_files_count,
        "active_llm_provider": settings.DEFAULT_LLM_PROVIDER,
        "system_status": "Healthy"
    }

@router.get("/users")
def get_admin_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    users = db.query(User).all()
    out = []
    for u in users:
        doc_count = db.query(Document).filter(Document.user_id == u.id).count()
        chat_count = db.query(ChatSession).filter(ChatSession.user_id == u.id).count()
        out.append({
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "is_active": u.is_active,
            "document_count": doc_count,
            "chat_count": chat_count,
            "created_at": u.created_at.strftime("%Y-%m-%d %H:%M")
        })
    return out
