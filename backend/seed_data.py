"""
Seeds default documents and an initial conversation for demo@docmind.ai
"""
import shutil
from pathlib import Path
from app.core.database import SessionLocal, Base, engine
from app.models.user import User
from app.models.document import Document, DocumentChunk
from app.models.chat import ChatSession, ChatMessage
from app.services.pdf_service import PDFService
from app.services.chunking import Chunker
from app.services.vector_store import vector_store
from app.core.config import settings

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    demo_user = db.query(User).filter(User.email == "demo@docmind.ai").first()
    if not demo_user:
        print("Demo user not found.")
        return

    sample_dir = Path(__file__).parent / "sample_docs"
    docs_to_seed = [
        ("quantum_computing_advancements.pdf", "doc_qc_001"),
        ("distributed_systems_consensus.pdf", "doc_ds_002")
    ]

    seeded_doc_ids = []

    for filename, doc_id in docs_to_seed:
        src_path = sample_dir / filename
        dest_path = settings.UPLOAD_DIR / f"{doc_id}_{filename}"
        shutil.copyfile(src_path, dest_path)

        # Check existing
        existing = db.query(Document).filter(Document.id == doc_id).first()
        if not existing:
            pages, meta = PDFService.extract_text_and_metadata(str(dest_path))
            doc = Document(
                id=doc_id,
                user_id=demo_user.id,
                filename=filename,
                file_path=str(dest_path),
                file_size=dest_path.stat().st_size,
                page_count=meta.get("page_count", len(pages)),
                status="indexed"
            )
            db.add(doc)

            chunks = Chunker.chunk_document_pages(pages, doc_id, filename)
            for c in chunks:
                chunk_rec = DocumentChunk(
                    document_id=doc_id,
                    page_number=c["page_number"],
                    chunk_index=c["chunk_index"],
                    content=c["content"],
                    metadata_json="{}"
                )
                db.add(chunk_rec)

            vector_store.index_document_chunks(doc_id, chunks)
            seeded_doc_ids.append(doc_id)
            print(f"Seeded document: {filename}")

    db.commit()
    db.close()
    print("Database seeding completed.")

if __name__ == "__main__":
    seed()
