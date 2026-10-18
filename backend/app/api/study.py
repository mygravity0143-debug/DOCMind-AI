import json
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.study import StudyItem
from app.schemas.study import StudyGenerateRequest, StudyItemOut
from app.api.deps import get_current_user
from app.services.study_engine import StudyEngine

router = APIRouter(prefix="/study", tags=["AI Study Tools"])

@router.post("/generate", response_model=StudyItemOut)
def generate_study_content(
    req: StudyGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not req.document_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one document ID must be selected to generate study material."
        )

    result_data = StudyEngine.generate_study_material(
        item_type=req.item_type,
        document_ids=req.document_ids,
        topic_focus=req.topic_focus,
        count=req.count
    )

    type_titles = {
        "mcq": "Interactive Multiple-Choice Quiz",
        "flashcard": "Concept Flashcards Deck",
        "interview": "Technical Interview Questions",
        "summary": "Chapter Revision Notes"
    }

    item_id = str(uuid.uuid4())
    doc_ref = req.document_ids[0] if len(req.document_ids) == 1 else "multi"

    study_item = StudyItem(
        id=item_id,
        user_id=current_user.id,
        document_id=doc_ref,
        item_type=req.item_type,
        title=f"{type_titles.get(req.item_type, 'Study Tool')} ({len(result_data.get('items', []))} items)",
        payload_json=json.dumps(result_data)
    )
    db.add(study_item)
    db.commit()
    db.refresh(study_item)

    return StudyItemOut(
        id=study_item.id,
        user_id=study_item.user_id,
        document_id=study_item.document_id,
        item_type=study_item.item_type,
        title=study_item.title,
        payload=result_data,
        created_at=study_item.created_at
    )


@router.get("/items", response_model=List[StudyItemOut])
def get_study_items(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    items = db.query(StudyItem).filter(
        StudyItem.user_id == current_user.id
    ).order_by(StudyItem.created_at.desc()).all()

    out = []
    for item in items:
        payload = json.loads(item.payload_json or "{}")
        out.append(StudyItemOut(
            id=item.id,
            user_id=item.user_id,
            document_id=item.document_id,
            item_type=item.item_type,
            title=item.title,
            payload=payload,
            created_at=item.created_at
        ))
    return out


@router.delete("/items/{item_id}")
def delete_study_item(
    item_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = db.query(StudyItem).filter(
        StudyItem.id == item_id,
        StudyItem.user_id == current_user.id
    ).first()

    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Study deck not found.")

    db.delete(item)
    db.commit()
    return {"status": "success", "message": "Study deck deleted."}
