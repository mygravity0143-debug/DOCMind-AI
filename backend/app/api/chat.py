import json
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.chat import ChatSession, ChatMessage
from app.models.analytics import QueryLog
from app.schemas.chat import (
    ChatAskRequest,
    ChatAskResponse,
    ChatSessionOut,
    ChatSessionDetailOut,
    ChatSessionUpdate,
    ChatMessageOut,
    Citation
)
from app.api.deps import get_current_user
from app.services.rag_engine import rag_engine

router = APIRouter(prefix="/chat", tags=["Research Chat"])

@router.post("/ask", response_model=ChatAskResponse)
async def ask_question(
    req: ChatAskRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Resolve or create chat session
    session = None
    if req.session_id:
        session = db.query(ChatSession).filter(
            ChatSession.id == req.session_id,
            ChatSession.user_id == current_user.id
        ).first()

    if not session:
        session = ChatSession(
            id=req.session_id or str(uuid.uuid4()),
            user_id=current_user.id,
            title=req.question[:60] + "..." if len(req.question) > 60 else req.question,
            document_ids_json=json.dumps(req.document_ids or [])
        )
        db.add(session)
        db.commit()
        db.refresh(session)

    # 2. Add user message
    user_msg = ChatMessage(
        session_id=session.id,
        role="user",
        content=req.question,
        citations_json="[]"
    )
    db.add(user_msg)
    db.commit()

    # 3. Parse user API keys and preferred model from user settings
    user_settings = json.loads(current_user.settings_json or "{}")

    # 4. Run RAG Engine
    rag_result = await rag_engine.ask(
        question=req.question,
        document_ids=req.document_ids,
        api_keys=user_settings,
        preferred_model=user_settings.get("preferred_model")
    )

    citations_data = rag_result.get("citations", [])

    # 5. Add assistant message
    asst_msg = ChatMessage(
        session_id=session.id,
        role="assistant",
        content=rag_result["answer"],
        citations_json=json.dumps(citations_data)
    )
    db.add(asst_msg)

    # 6. Log telemetry in QueryLog
    query_log = QueryLog(
        user_id=current_user.id,
        query_text=req.question,
        latency_ms=rag_result.get("latency_ms", 0.0),
        top_k_retrieved=len(citations_data),
        document_ids_json=json.dumps(req.document_ids or [])
    )
    db.add(query_log)
    db.commit()
    db.refresh(asst_msg)

    citation_objs = [Citation(**c) for c in citations_data]

    return ChatAskResponse(
        session_id=session.id,
        message_id=asst_msg.id,
        question=req.question,
        answer=rag_result["answer"],
        citations=citation_objs,
        has_sufficient_evidence=rag_result.get("has_sufficient_evidence", True),
        latency_ms=rag_result.get("latency_ms", 0.0)
    )


@router.get("/sessions", response_model=List[ChatSessionOut])
def get_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sessions = db.query(ChatSession).filter(
        ChatSession.user_id == current_user.id
    ).order_by(ChatSession.updated_at.desc()).all()

    out = []
    for s in sessions:
        doc_ids = json.loads(s.document_ids_json or "[]")
        msg_count = len(s.messages)
        out.append(ChatSessionOut(
            id=s.id,
            title=s.title,
            document_ids=doc_ids,
            created_at=s.created_at,
            updated_at=s.updated_at,
            message_count=msg_count
        ))
    return out


@router.post("/sessions", response_model=ChatSessionOut)
def create_session(
    update_data: ChatSessionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sess_id = str(uuid.uuid4())
    doc_ids = update_data.document_ids or []
    session = ChatSession(
        id=sess_id,
        user_id=current_user.id,
        title=update_data.title or "New Research Session",
        document_ids_json=json.dumps(doc_ids)
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    return ChatSessionOut(
        id=session.id,
        title=session.title,
        document_ids=doc_ids,
        created_at=session.created_at,
        updated_at=session.updated_at,
        message_count=0
    )


@router.get("/sessions/{session_id}", response_model=ChatSessionDetailOut)
def get_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found.")

    doc_ids = json.loads(session.document_ids_json or "[]")
    messages_out = []

    for msg in session.messages:
        cites = [Citation(**c) for c in json.loads(msg.citations_json or "[]")]
        messages_out.append(ChatMessageOut(
            id=msg.id,
            role=msg.role,
            content=msg.content,
            citations=cites,
            created_at=msg.created_at
        ))

    return ChatSessionDetailOut(
        id=session.id,
        title=session.title,
        document_ids=doc_ids,
        created_at=session.created_at,
        updated_at=session.updated_at,
        messages=messages_out
    )


@router.put("/sessions/{session_id}", response_model=ChatSessionOut)
def update_session(
    session_id: str,
    update_data: ChatSessionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found.")

    if update_data.title is not None:
        session.title = update_data.title
    if update_data.document_ids is not None:
        session.document_ids_json = json.dumps(update_data.document_ids)

    db.commit()
    db.refresh(session)

    doc_ids = json.loads(session.document_ids_json or "[]")
    return ChatSessionOut(
        id=session.id,
        title=session.title,
        document_ids=doc_ids,
        created_at=session.created_at,
        updated_at=session.updated_at,
        message_count=len(session.messages)
    )


@router.delete("/sessions/{session_id}")
def delete_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found.")

    db.delete(session)
    db.commit()
    return {"status": "success", "message": "Chat session deleted successfully."}
