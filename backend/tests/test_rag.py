import pytest
import asyncio
from pathlib import Path
from app.services.pdf_service import PDFService
from app.services.chunking import Chunker
from app.services.vector_store import vector_store
from app.services.rag_engine import rag_engine

SAMPLE_DIR = Path(__file__).parent.parent / "sample_docs"

@pytest.fixture(scope="module", autouse=True)
def setup_vector_indices():
    # Index sample documents
    for name in ["quantum_computing_advancements.pdf", "distributed_systems_consensus.pdf"]:
        p = SAMPLE_DIR / name
        doc_id = f"test_{name[:8]}"
        pages, _ = PDFService.extract_text_and_metadata(str(p))
        chunks = Chunker.chunk_document_pages(pages, doc_id, name)
        vector_store.index_document_chunks(doc_id, chunks)

def test_hybrid_search_retrieval():
    results = vector_store.hybrid_search("coherence time superconducting qubits", top_k=3)
    assert len(results) > 0
    top = results[0]
    assert "quantum_computing_advancements.pdf" in top["filename"]
    assert top["page_number"] in [1, 2]
    assert "similarity_score" in top
    assert top["similarity_score"] > 0.1

def test_rag_answering_with_citations():
    async def _run():
        question = "What is the coherence time of the 128 physical qubit superconducting processor?"
        return await rag_engine.ask(question=question)

    res = asyncio.run(_run())
    assert res["has_sufficient_evidence"] is True
    assert "140 microseconds" in res["answer"].lower()
    assert len(res["citations"]) > 0

    # Ensure citation references Page 1
    cited_pages = [c["page_number"] for c in res["citations"]]
    assert 1 in cited_pages

def test_insufficient_evidence_handling():
    async def _run():
        question = "What are the quantum supremacy properties of the Raft protocol?"
        return await rag_engine.ask(question=question)

    res = asyncio.run(_run())
    assert "not contain sufficient" in res["answer"].lower()
    assert res["has_sufficient_evidence"] is False
    assert len(res["citations"]) == 0
