"""API routes for resume upload and health checks."""

from __future__ import annotations

import asyncio
from fastapi import APIRouter, File, Request, UploadFile, HTTPException
from sqlalchemy import text

from app.schemas.resume import ParsedData, UploadResumeResponse
from app.utils.validators import is_pdf, read_upload_bytes, validate_upload_file


router = APIRouter()


@router.get("/health")
async def health_check(request: Request) -> dict:
    """Deep health check endpoint verifying database connectivity."""
    from app.db.session import AsyncSessionLocal
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database connection failed: {e}")


@router.post("/api/resume/upload", response_model=UploadResumeResponse)
async def upload_resume(request: Request, file: UploadFile = File(...)) -> UploadResumeResponse:
    """Handle resume upload, OCR, and parsing."""
    validate_upload_file(file.filename, file.content_type)
    settings = request.app.state.settings

    content = await read_upload_bytes(file, settings.max_file_size_mb * 1024 * 1024)
    await file.close()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    raw_text = ""
    ocr_confidence = None

    if is_pdf(file.filename, file.content_type):
        extractor = request.app.state.pdf_extractor
        direct_text = await asyncio.to_thread(extractor.extract_text, content)
        if len(direct_text.strip()) < settings.ocr_min_text_length:
            ocr_service = request.app.state.ocr_service
            ocr_result = await ocr_service.ocr_pdf_async(content, settings.ocr_dpi)
            raw_text = ocr_result.text
            ocr_confidence = ocr_result.confidence
        else:
            raw_text = direct_text
    else:
        ocr_service = request.app.state.ocr_service
        ocr_result = await ocr_service.ocr_images_async([content])
        raw_text = ocr_result.text
        ocr_confidence = ocr_result.confidence

    if not raw_text:
        raise HTTPException(status_code=422, detail="Unable to extract text from resume.")

    parser = request.app.state.parser
    parsed_resume = await asyncio.to_thread(parser.parse, raw_text)

    return UploadResumeResponse(
        success=True,
        raw_text=raw_text,
        parsed_data=ParsedData(**parsed_resume.to_dict()),
        ocr_confidence=ocr_confidence,
    )
