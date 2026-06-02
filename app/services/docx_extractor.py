"""DOCX text extraction service."""

from __future__ import annotations

import io
import zipfile
import xml.etree.ElementTree as ET

from app.utils.logger import get_logger


class DocxTextExtractor:
    """Extract text from Microsoft Word .docx files using pure Python xml parsing."""

    def __init__(self) -> None:
        self._logger = get_logger(self.__class__.__name__)

    def extract_text(self, docx_bytes: bytes) -> str:
        """Extract text content from raw .docx bytes."""
        try:
            with zipfile.ZipFile(io.BytesIO(docx_bytes)) as docx:
                xml_content = docx.read("word/document.xml")
                root = ET.fromstring(xml_content)
                
                text_pieces = []
                for elem in root.iter():
                    # Extract raw text nodes (w:t)
                    if elem.tag.endswith("}t"):
                        if elem.text:
                            text_pieces.append(elem.text)
                    # Preserve paragraph boundary breaks (w:p)
                    elif elem.tag.endswith("}p"):
                        text_pieces.append("\n")
                    # Preserve line breaks (w:br)
                    elif elem.tag.endswith("}br"):
                        text_pieces.append("\n")
                    # Preserve tab elements (w:tab)
                    elif elem.tag.endswith("}tab"):
                        text_pieces.append("\t")

                raw_text = "".join(text_pieces)
                # Clean up and normalize whitespace
                lines = [line.strip() for line in raw_text.splitlines()]
                return "\n".join([line for line in lines if line])
        except Exception as e:
            self._logger.error(f"Docx text extraction failed: {e}")
            raise ValueError(f"Failed to extract text from DOCX document: {e}")
