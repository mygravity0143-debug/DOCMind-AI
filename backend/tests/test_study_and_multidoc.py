import pytest
from app.services.study_engine import StudyEngine

def test_mcq_generation():
    doc_ids = ["test_quantum_"]
    res = StudyEngine.generate_study_material(
        item_type="mcq",
        document_ids=doc_ids,
        count=3
    )

    assert "items" in res
    assert len(res["items"]) > 0
    mcq = res["items"][0]
    assert "question" in mcq
    assert "options" in mcq
    assert len(mcq["options"]) == 4
    assert mcq["correct_key"] in ["A", "B", "C", "D"]
    assert "explanation" in mcq
    assert "page_number" in mcq

def test_flashcard_generation():
    doc_ids = ["test_quantum_"]
    res = StudyEngine.generate_study_material(
        item_type="flashcard",
        document_ids=doc_ids,
        count=3
    )

    assert len(res["items"]) > 0
    fc = res["items"][0]
    assert "front_prompt" in fc
    assert "back_answer" in fc
    assert "page_number" in fc

def test_multi_document_comparison():
    doc_ids = ["test_quantum_", "test_distrib"]
    names_map = {
        "test_quantum_": "quantum_computing_advancements.pdf",
        "test_distrib": "distributed_systems_consensus.pdf"
    }

    comp = StudyEngine.compare_documents(
        document_ids=doc_ids,
        doc_names_map=names_map,
        focus_topic="Architecture Comparison"
    )

    assert "comparison_matrix" in comp
    assert len(comp["comparison_matrix"]) > 0
    assert "contradictions_and_differences" in comp
    assert "synthesized_conclusions" in comp
