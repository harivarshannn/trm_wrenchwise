"""Input validation helpers."""

from __future__ import annotations

import os
from fastapi import HTTPException, UploadFile


ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
}

ALLOWED_EXTENSIONS = {
    ".pdf",
    ".jpg",
    ".jpeg",
    ".png",
}


def validate_upload_file(filename: str | None, content_type: str | None) -> None:
    """Validate file name and MIME type."""
    if not filename or not content_type:
        raise HTTPException(status_code=400, detail="Invalid file metadata.")

    extension = os.path.splitext(filename)[1].lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Unsupported file extension.")

    if content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported file type.")


async def read_upload_bytes(upload: UploadFile, max_bytes: int) -> bytes:
    """Read an uploaded file with a hard size limit."""
    chunks: list[bytes] = []
    total = 0

    while True:
        chunk = await upload.read(1024 * 1024)
        if not chunk:
            break
        total += len(chunk)
        if total > max_bytes:
            raise HTTPException(status_code=413, detail="File exceeds size limit.")
        chunks.append(chunk)

    return b"".join(chunks)


def is_pdf(filename: str | None, content_type: str | None) -> bool:
    """Check whether a file is a PDF."""
    if content_type == "application/pdf":
        return True
    if not filename:
        return False
    return filename.lower().endswith(".pdf")
