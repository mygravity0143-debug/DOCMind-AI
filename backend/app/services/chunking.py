import re
from typing import List, Dict, Any
from app.core.config import settings

class Chunker:
    @staticmethod
    def chunk_document_pages(
        pages: List[Dict[str, Any]],
        document_id: str,
        filename: str,
        chunk_size: int = settings.CHUNK_SIZE,
        chunk_overlap: int = settings.CHUNK_OVERLAP
    ) -> List[Dict[str, Any]]:
        """
        Split page texts into overlapping chunks with precise metadata.
        Each chunk contains:
          - chunk_index: global index for the document
          - page_number: exact page number where the chunk originates
          - document_id: parent document ID
          - filename: parent document name
          - content: sanitized text content
          - char_start, char_end: character positions on the page
        """
        chunks = []
        global_chunk_idx = 0

        for page in pages:
            page_num = page["page_number"]
            page_text = page["text"]

            if not page_text or len(page_text.strip()) == 0:
                continue

            page_chunks = Chunker._split_page_text(
                page_text=page_text,
                page_number=page_num,
                document_id=document_id,
                filename=filename,
                start_index=global_chunk_idx,
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap
            )

            chunks.extend(page_chunks)
            global_chunk_idx += len(page_chunks)

        return chunks

    @staticmethod
    def _split_page_text(
        page_text: str,
        page_number: int,
        document_id: str,
        filename: str,
        start_index: int,
        chunk_size: int,
        chunk_overlap: int
    ) -> List[Dict[str, Any]]:
        chunks = []
        text_len = len(page_text)

        if text_len <= chunk_size:
            clean_content = Chunker.sanitize_text(page_text)
            chunks.append({
                "chunk_index": start_index,
                "page_number": page_number,
                "document_id": document_id,
                "filename": filename,
                "content": clean_content,
                "char_start": 0,
                "char_end": text_len
            })
            return chunks

        start = 0
        idx = start_index

        while start < text_len:
            end = min(start + chunk_size, text_len)

            # If not at the end of text, attempt to find a clean sentence or paragraph boundary
            if end < text_len:
                # Look backwards for sentence end (.!?) or newline within the last 150 chars
                boundary_match = re.search(r'([.!?\n])\s+', page_text[max(start, end - 150):end])
                if boundary_match:
                    rel_pos = boundary_match.end()
                    end = max(start, end - 150) + rel_pos

            chunk_raw = page_text[start:end].strip()
            if len(chunk_raw) > 20:  # Ignore tiny slivers
                clean_content = Chunker.sanitize_text(chunk_raw)
                chunks.append({
                    "chunk_index": idx,
                    "page_number": page_number,
                    "document_id": document_id,
                    "filename": filename,
                    "content": clean_content,
                    "char_start": start,
                    "char_end": end
                })
                idx += 1

            if end >= text_len:
                break

            # Slide forward by chunk_size - overlap
            advance = max(chunk_size - chunk_overlap, 50)
            start = start + advance

        return chunks

    @staticmethod
    def sanitize_text(text: str) -> str:
        """
        Defend against prompt injection patterns embedded inside untrusted user documents.
        Escapes or neutralizes prompts like 'SYSTEM:', 'IGNORE PREVIOUS INSTRUCTIONS', etc.
        """
        if not text:
            return ""

        # Neutralize common prompt injection trigger phrases
        injection_patterns = [
            (r'(?i)\bignore\s+(all\s+)?(previous|prior|above)\s+instructions\b', '[FILTERED INSTRUCTION ATTEMPT]'),
            (r'(?i)\byou\s+are\s+now\s+(DAN|unrestricted|in\s+developer\s+mode)\b', '[FILTERED JAILBREAK ATTEMPT]'),
            (r'(?i)<system>.*?</system>', '[FILTERED SYSTEM TAG]'),
            (r'(?i)```system[\s\S]*?```', '[FILTERED SYSTEM BLOCK]'),
        ]

        cleaned = text
        for pattern, replacement in injection_patterns:
            cleaned = re.sub(pattern, replacement, cleaned)

        return cleaned
