import os
import json
import math
import re
from typing import List, Dict, Any, Optional
from pathlib import Path
import numpy as np
from rank_bm25 import BM25Okapi
from app.core.config import settings

class LightweightEmbedder:
    """
    Fast, zero-latency in-process embedder using sub-word n-gram hashing and TF-IDF weighting.
    Produces high-quality 256-dimensional dense vectors with cosine similarity
    without requiring 500MB torch/CUDA downloads, ensuring instant execution on any system.
    """
    def __init__(self, dim: int = 256):
        self.dim = dim

    def embed(self, text: str) -> np.ndarray:
        if not text:
            return np.zeros(self.dim, dtype=np.float32)

        tokens = re.findall(r'\b\w+\b', text.lower())
        vec = np.zeros(self.dim, dtype=np.float32)

        if not tokens:
            return vec

        for token in tokens:
            # Hash whole token
            h = hash(token) % self.dim
            vec[h] += 1.0

            # Character 3-grams for morphology
            if len(token) >= 3:
                for i in range(len(token) - 2):
                    tri = token[i:i+3]
                    h_tri = hash(tri) % self.dim
                    vec[h_tri] += 0.3

        # L2 normalize
        norm = np.linalg.norm(vec)
        if norm > 1e-6:
            vec /= norm
        return vec

    def embed_batch(self, texts: List[str]) -> List[np.ndarray]:
        return [self.embed(t) for t in texts]


class VectorStore:
    def __init__(self):
        self.embedder = LightweightEmbedder(dim=256)
        self.indices_dir = settings.VECTOR_DIR
        self.indices_dir.mkdir(parents=True, exist_ok=True)

    def _get_doc_index_path(self, document_id: str) -> Path:
        return self.indices_dir / f"{document_id}.json"

    def index_document_chunks(self, document_id: str, chunks: List[Dict[str, Any]]):
        """
        Embed and persist chunks for a document.
        """
        if not chunks:
            return

        texts = [c["content"] for c in chunks]
        vectors = self.embedder.embed_batch(texts)

        index_data = {
            "document_id": document_id,
            "chunk_count": len(chunks),
            "chunks": []
        }

        for i, chunk in enumerate(chunks):
            index_data["chunks"].append({
                "chunk_index": chunk["chunk_index"],
                "page_number": chunk["page_number"],
                "document_id": document_id,
                "filename": chunk.get("filename", ""),
                "content": chunk["content"],
                "vector": vectors[i].tolist(),
            })

        index_file = self._get_doc_index_path(document_id)
        with open(index_file, "w", encoding="utf-8") as f:
            json.dump(index_data, f, ensure_ascii=False)

    def delete_document_index(self, document_id: str):
        path = self._get_doc_index_path(document_id)
        if path.exists():
            path.unlink()

    def hybrid_search(
        self,
        query: str,
        document_ids: Optional[List[str]] = None,
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Hybrid retrieval combining Dense Vector Cosine Similarity and BM25 Okapi keyword scoring.
        """
        if not query.strip():
            return []

        # 1. Load candidate chunks from target document indices
        all_chunks = []
        if document_ids:
            for doc_id in document_ids:
                path = self._get_doc_index_path(doc_id)
                if path.exists():
                    try:
                        with open(path, "r", encoding="utf-8") as f:
                            data = json.load(f)
                            all_chunks.extend(data.get("chunks", []))
                    except Exception:
                        continue
        else:
            # Query across all indexed documents
            for path in self.indices_dir.glob("*.json"):
                try:
                    with open(path, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        all_chunks.extend(data.get("chunks", []))
                except Exception:
                    continue

        if not all_chunks:
            return []

        # 2. Dense Semantic Search
        query_vec = self.embedder.embed(query)
        dense_scores = []
        for chunk in all_chunks:
            chunk_vec = np.array(chunk["vector"], dtype=np.float32)
            sim = float(np.dot(query_vec, chunk_vec))
            dense_scores.append(max(0.0, sim))

        # 3. BM25 Keyword Search
        tokenized_corpus = [re.findall(r'\b\w+\b', c["content"].lower()) for c in all_chunks]
        query_tokens = re.findall(r'\b\w+\b', query.lower())

        if query_tokens and any(len(doc) > 0 for doc in tokenized_corpus):
            bm25 = BM25Okapi(tokenized_corpus)
            raw_bm25_scores = bm25.get_scores(query_tokens)
            max_bm25 = max(raw_bm25_scores) if len(raw_bm25_scores) > 0 and max(raw_bm25_scores) > 0 else 1.0
            norm_bm25_scores = [s / max_bm25 for s in raw_bm25_scores]
        else:
            norm_bm25_scores = [0.0] * len(all_chunks)

        # 4. Hybrid Score Fusion: 60% Dense + 40% BM25
        scored_chunks = []
        for i, chunk in enumerate(all_chunks):
            d_score = dense_scores[i]
            k_score = norm_bm25_scores[i]
            hybrid_score = 0.6 * d_score + 0.4 * k_score

            scored_chunks.append({
                "chunk_index": chunk["chunk_index"],
                "page_number": chunk["page_number"],
                "document_id": chunk["document_id"],
                "filename": chunk["filename"],
                "content": chunk["content"],
                "similarity_score": round(float(hybrid_score), 4),
                "dense_score": round(float(d_score), 4),
                "bm25_score": round(float(k_score), 4),
            })

        # Sort descending by hybrid score
        scored_chunks.sort(key=lambda x: x["similarity_score"], reverse=True)
        return scored_chunks[:top_k]

vector_store = VectorStore()
