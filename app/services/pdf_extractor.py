"""PDF text extraction service."""

from __future__ import annotations

import io

import fitz  # PyMuPDF

from app.utils.logger import get_logger


class PdfTextExtractor:
    """Extract text from PDF using multiple strategies."""

    def __init__(self, min_text_length: int) -> None:
        self._min_text_length = min_text_length
        self._logger = get_logger(self.__class__.__name__)

    def extract_text(self, pdf_bytes: bytes) -> str:
        """Extract text from PDF bytes, with optional fallback."""
        primary_text = ""
        try:
            primary_text = self._extract_with_pymupdf(pdf_bytes)
            if len(primary_text.strip()) >= self._min_text_length:
                return primary_text
        except Exception as e:
            self._logger.error(f"PyMuPDF text extraction failed: {e}")

        try:
            fallback_text = self._extract_with_pdfplumber(pdf_bytes)
            if len(fallback_text.strip()) > len(primary_text.strip()):
                return fallback_text
        except Exception as e:
            self._logger.error(f"pdfplumber text extraction failed: {e}")

        return primary_text

    def _extract_with_pymupdf(self, pdf_bytes: bytes) -> str:
        text_chunks: list[str] = []
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        try:
            for page in doc:
                text_chunks.append(page.get_text("text"))
        finally:
            doc.close()
        return "\n".join(text_chunks)

    def _extract_with_pdfplumber(self, pdf_bytes: bytes) -> str:
        try:
            import pdfplumber  # local import to reduce startup cost
        except ImportError:
            self._logger.warning("pdfplumber not available; skipping fallback.")
            return ""

        text_chunks: list[str] = []
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            for page in pdf.pages:
                text_chunks.append(page.extract_text() or "")
        return "\n".join(text_chunks)
