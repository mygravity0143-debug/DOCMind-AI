import os
import shutil
import uuid
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks, status, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.models.document import Document, DocumentChunk
from app.schemas.document import DocumentOut, DocumentDetailOut, DocumentChunkOut
from app.api.deps import get_current_user
from app.services.pdf_service import PDFService
from app.services.chunking import Chunker
from app.services.vector_store import vector_store

router = APIRouter(prefix="/documents", tags=["Documents"])

def process_document_pipeline(document_id: str, file_path: str, user_id: str, db_session_factory):
    """
    Background or synchronous extraction, chunking, and embedding pipeline.
    """
    db = db_session_factory()
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        db.close()
        return

    try:
        doc.status = "processing"
        db.commit()

        # 1. Text & metadata extraction
        pages, meta = PDFService.extract_text_and_metadata(file_path)
        doc.page_count = meta.get("page_count", len(pages))

        # 2. Chunking
        chunks_data = Chunker.chunk_document_pages(
            pages=pages,
            document_id=document_id,
            filename=doc.filename
        )

        # 3. Store chunks in database
        db.query(DocumentChunk).filter(DocumentChunk.document_id == document_id).delete()
        for c in chunks_data:
            chunk_rec = DocumentChunk(
                document_id=document_id,
                page_number=c["page_number"],
                chunk_index=c["chunk_index"],
                content=c["content"],
                metadata_json="{}"
            )
            db.add(chunk_rec)

        # 4. Generate vectors and index in vector store
        vector_store.index_document_chunks(document_id=document_id, chunks=chunks_data)

        doc.status = "indexed"
        doc.error_message = None
        db.commit()

    except Exception as e:
        doc.status = "error"
        doc.error_message = str(e)
        db.commit()
    finally:
        db.close()


@router.get("", response_model=List[DocumentOut])
def list_documents(
    q: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Document).filter(Document.user_id == current_user.id)
    if q:
        query = query.filter(Document.filename.ilike(f"%{q}%"))
    if status_filter:
        query = query.filter(Document.status == status_filter)

    docs = query.order_by(Document.created_at.desc()).all()
    return docs


@router.post("/upload", response_model=List[DocumentOut])
async def upload_documents(
    files: List[UploadFile] = File(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.core.database import SessionLocal

    created_docs = []

    for file in files:
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file '{file.filename}'. Only PDF documents are supported."
            )

        doc_id = str(uuid.uuid4())
        safe_filename = f"{doc_id}_{Path(file.filename).name}"
        dest_path = settings.UPLOAD_DIR / safe_filename

        # Write uploaded file
        content = await file.read()
        file_size = len(content)

        if file_size > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File '{file.filename}' exceeds maximum allowed size of {settings.MAX_FILE_SIZE_MB}MB."
            )

        with open(dest_path, "wb") as f:
            f.write(content)

        doc = Document(
            id=doc_id,
            user_id=current_user.id,
            filename=file.filename,
            file_path=str(dest_path),
            file_size=file_size,
            page_count=0,
            status="uploaded"
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
        created_docs.append(doc)

        # Process immediately or via background task
        # Synchronous processing provides instant readiness for uploads
        process_document_pipeline(doc_id, str(dest_path), current_user.id, SessionLocal)
        db.refresh(doc)

    return created_docs


@router.get("/{document_id}", response_model=DocumentDetailOut)
def get_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()

    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    chunks = db.query(DocumentChunk).filter(DocumentChunk.document_id == document_id).order_by(DocumentChunk.chunk_index).all()
    chunk_outs = [
        DocumentChunkOut(
            id=c.id,
            page_number=c.page_number,
            chunk_index=c.chunk_index,
            content=c.content
        )
        for c in chunks
    ]

    return DocumentDetailOut(
        id=doc.id,
        filename=doc.filename,
        file_size=doc.file_size,
        page_count=doc.page_count,
        status=doc.status,
        error_message=doc.error_message,
        created_at=doc.created_at,
        updated_at=doc.updated_at,
        chunks=chunk_outs
    )


@router.get("/{document_id}/file")
def get_document_file(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()

    if not doc or not Path(doc.file_path).exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PDF file not found on server.")

    return FileResponse(
        path=doc.file_path,
        media_type="application/pdf",
        filename=doc.filename
    )


@router.post("/{document_id}/reprocess", response_model=DocumentOut)
def reprocess_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.core.database import SessionLocal

    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()

    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    process_document_pipeline(document_id, doc.file_path, current_user.id, SessionLocal)
    db.refresh(doc)
    return doc


@router.delete("/{document_id}")
def delete_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()

    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    # Remove physical file
    if Path(doc.file_path).exists():
        try:
            os.remove(doc.file_path)
        except Exception:
            pass

    # Remove vector index
    vector_store.delete_document_index(document_id)

    # Delete from DB
    db.delete(doc)
    db.commit()

    return {"status": "success", "message": f"Document '{doc.filename}' deleted successfully."}
