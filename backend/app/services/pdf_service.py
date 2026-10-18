import os
import re
from typing import List, Dict, Any, Tuple
from pathlib import Path

# Try importing fitz (PyMuPDF) and pypdf
try:
    import fitz  # PyMuPDF
    HAS_PYMUPDF = True
except ImportError:
    HAS_PYMUPDF = False

try:
    import pypdf
    HAS_PYPDF = True
except ImportError:
    HAS_PYPDF = False

class PDFExtractionError(Exception):
    pass

class PDFService:
    @staticmethod
    def extract_text_and_metadata(file_path: str) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
        """
        Extract text page by page, preserving page numbers (1-indexed),
        and document metadata.
        Returns:
            pages: List[{"page_number": int, "text": str, "char_count": int, "is_scanned": bool}]
            metadata: {"page_count": int, "title": str, "author": str, "encrypted": bool}
        """
        path = Path(file_path)
        if not path.exists():
            raise PDFExtractionError(f"File not found: {file_path}")

        if HAS_PYMUPDF:
            try:
                return PDFService._extract_with_pymupdf(file_path)
            except Exception as e:
                # Fallback to pypdf if PyMuPDF encounters an unexpected error
                if HAS_PYPDF:
                    return PDFService._extract_with_pypdf(file_path)
                raise PDFExtractionError(f"PyMuPDF error: {str(e)}")
        elif HAS_PYPDF:
            return PDFService._extract_with_pypdf(file_path)
        else:
            raise PDFExtractionError("Neither PyMuPDF nor pypdf is installed.")

    @staticmethod
    def _extract_with_pymupdf(file_path: str) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
        doc = fitz.open(file_path)
        page_count = len(doc)
        meta = doc.metadata or {}

        metadata = {
            "page_count": page_count,
            "title": meta.get("title", "") or Path(file_path).name,
            "author": meta.get("author", ""),
            "encrypted": doc.is_encrypted,
        }

        pages = []
        for page_idx in range(page_count):
            page_num = page_idx + 1
            page = doc[page_idx]
            raw_text = page.get_text("text")

            # Clean whitespace and control characters
            cleaned_text = PDFService.clean_text(raw_text)
            is_scanned = len(cleaned_text.strip()) < 30 and len(page.get_images()) > 0

            pages.append({
                "page_number": page_num,
                "text": cleaned_text,
                "char_count": len(cleaned_text),
                "is_scanned": is_scanned,
            })

        doc.close()
        return pages, metadata

    @staticmethod
    def _extract_with_pypdf(file_path: str) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
        reader = pypdf.PdfReader(file_path)
        page_count = len(reader.pages)
        meta = reader.metadata or {}

        metadata = {
            "page_count": page_count,
            "title": str(meta.get("/Title", "") or Path(file_path).name),
            "author": str(meta.get("/Author", "")),
            "encrypted": reader.is_encrypted,
        }

        pages = []
        for page_idx in range(page_count):
            page_num = page_idx + 1
            page = reader.pages[page_idx]
            raw_text = page.extract_text() or ""
            cleaned_text = PDFService.clean_text(raw_text)

            pages.append({
                "page_number": page_num,
                "text": cleaned_text,
                "char_count": len(cleaned_text),
                "is_scanned": len(cleaned_text.strip()) < 30,
            })

        return pages, metadata

    @staticmethod
    def clean_text(text: str) -> str:
        if not text:
            return ""
        # Remove null bytes and non-printable characters
        text = text.replace("\x00", "")
        # Normalize carriage returns and excessive newlines
        text = text.replace("\r\n", "\n").replace("\r", "\n")
        # Collapse 3+ consecutive newlines into 2
        text = re.sub(r"\n{3,}", "\n\n", text)
        # Collapse multiple horizontal whitespace
        text = re.sub(r"[ \t]+", " ", text)
        return text.strip()
