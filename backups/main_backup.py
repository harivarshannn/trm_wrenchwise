"""FastAPI application entry point."""

from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import router
from app.services.ocr import VisionOCRService
from app.services.pdf_extractor import PdfTextExtractor
from app.services.parser import ResumeParser
from app.services.skills_llm import SkillsLLMService
from app.utils.config import get_settings, load_env
from app.utils.logger import configure_logging, get_logger
from app.utils.rate_limiter import RateLimiterMiddleware


def create_app() -> FastAPI:
    """Create and configure the FastAPI app."""
    load_env()
    settings = get_settings()
    configure_logging(settings.log_level)
    logger = get_logger("App")

    app = FastAPI(
        title="Resume OCR + Parsing API",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
    )
    app.state.settings = settings

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    if settings.rate_limit_enabled:
        app.add_middleware(
            RateLimiterMiddleware,
            max_requests=settings.rate_limit_requests,
            window_seconds=settings.rate_limit_window_seconds,
        )

    app.include_router(router)

    @app.on_event("startup")
    async def startup() -> None:
        logger.info("Starting services")
        app.state.ocr_service = VisionOCRService(
            api_key=settings.google_api_key,
            batch_size=settings.ocr_batch_size,
            max_concurrency=settings.ocr_max_concurrency,
            request_timeout=settings.request_timeout_seconds,
            request_retries=settings.request_retries,
            request_backoff_factor=settings.request_backoff_factor,
        )
        app.state.pdf_extractor = PdfTextExtractor(settings.ocr_min_text_length)

        skills_llm_service = None
        if settings.groq_api_key and (settings.skills_llm_enabled or settings.certifications_llm_enabled):
            skills_llm_service = SkillsLLMService(
                api_key=settings.groq_api_key,
                model=settings.groq_model,
                request_timeout=settings.request_timeout_seconds,
                request_retries=settings.request_retries,
                request_backoff_factor=settings.request_backoff_factor,
            )
        app.state.skills_llm_service = skills_llm_service
        app.state.parser = ResumeParser(
            skills_refiner=skills_llm_service.refine_skills if settings.skills_llm_enabled and skills_llm_service else None,
            certifications_refiner=(
                skills_llm_service.refine_certifications
                if settings.certifications_llm_enabled and skills_llm_service
                else None
            ),
        )

    @app.on_event("shutdown")
    async def shutdown() -> None:
        logger.info("Shutting down services")
        ocr_service = getattr(app.state, "ocr_service", None)
        if ocr_service:
            ocr_service.close()
        skills_llm_service = getattr(app.state, "skills_llm_service", None)
        if skills_llm_service:
            skills_llm_service.close()

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled error")
        return JSONResponse(status_code=500, content={"detail": "Internal server error."})

    return app


app = create_app()
