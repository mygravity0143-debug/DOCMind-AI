from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.document import Document
from app.schemas.study import MultiDocCompareRequest, MultiDocCompareResponse, MultiDocSummarizeRequest
from app.api.deps import get_current_user
from app.services.study_engine import StudyEngine

router = APIRouter(prefix="/documents", tags=["Multi-Document Intelligence"])

@router.post("/compare", response_model=MultiDocCompareResponse)
def compare_documents(
    req: MultiDocCompareRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not req.document_ids or len(req.document_ids) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please select at least 2 documents to perform a comparative analysis."
        )

    # Fetch document names
    docs = db.query(Document).filter(
        Document.id.in_(req.document_ids),
        Document.user_id == current_user.id
    ).all()

    if len(docs) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least 2 valid uploaded documents are required for comparison."
        )

    doc_names_map = {d.id: d.filename for d in docs}
    result = StudyEngine.compare_documents(
        document_ids=req.document_ids,
        doc_names_map=doc_names_map,
        focus_topic=req.focus_topic
    )
    return result


@router.post("/summarize")
def summarize_multi_documents(
    req: MultiDocSummarizeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not req.document_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one document ID is required to generate a summary."
        )

    docs = db.query(Document).filter(
        Document.id.in_(req.document_ids),
        Document.user_id == current_user.id
    ).all()

    doc_titles = [d.filename for d in docs]
    study_data = StudyEngine.generate_study_material(
        item_type="summary",
        document_ids=req.document_ids,
        count=req.max_sections
    )

    return {
        "documents_analyzed": doc_titles,
        "executive_summary": f"Comprehensive multi-document synthesis synthesizing findings across: {', '.join(doc_titles)}.",
        "sections": study_data.get("items", [])
    }
