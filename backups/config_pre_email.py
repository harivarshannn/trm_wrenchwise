"""Configuration and environment loading utilities."""

from __future__ import annotations

from dataclasses import dataclass, field
import os
from typing import List, Optional


def load_env(env_path: str | None = None) -> None:
    """Load environment variables from a .env file if present."""
    resolved_path = env_path or os.path.join(os.getcwd(), ".env")
    if not os.path.exists(resolved_path):
        return

    with open(resolved_path, "r", encoding="utf-8") as handle:
        for raw_line in handle:
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            os.environ.setdefault(key, value)


def _parse_bool(value: str | None, default: bool) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "y", "on"}


def _parse_int(value: str | None, default: int) -> int:
    if value is None:
        return default
    try:
        return int(value)
    except ValueError:
        return default


def _parse_float(value: str | None, default: float) -> float:
    if value is None:
        return default
    try:
        return float(value)
    except ValueError:
        return default


@dataclass(frozen=True)
class Settings:
    """Application settings derived from environment variables."""

    database_url: str
    google_api_key: str
    max_file_size_mb: int = 10
    ocr_min_text_length: int = 80
    ocr_batch_size: int = 8
    ocr_dpi: int = 200
    ocr_max_concurrency: int = 4
    cors_origins: List[str] = field(default_factory=lambda: ["*"])
    log_level: str = "INFO"
    rate_limit_enabled: bool = True
    rate_limit_requests: int = 60
    rate_limit_window_seconds: int = 60
    request_timeout_seconds: int = 20
    request_retries: int = 3
    request_backoff_factor: float = 0.5
    db_pool_size: int = 5
    db_max_overflow: int = 10
    jwt_secret: str = "change-me"
    jwt_algorithm: str = "HS256"
    groq_api_key: Optional[str] = None
    groq_model: str = "llama-3.1-70b-versatile"
    skills_llm_enabled: bool = True
    certifications_llm_enabled: bool = True


def get_settings() -> Settings:
    """Build settings from the current environment."""
    database_url = os.getenv("DATABASE_URL", "").strip()
    if not database_url:
        raise ValueError("DATABASE_URL is required for database access.")

    google_api_key = os.getenv("GOOGLE_API_KEY", "").strip()
    if not google_api_key:
        raise ValueError("GOOGLE_API_KEY is required for OCR requests.")

    cors_origins_raw = os.getenv("CORS_ORIGINS", "*")
    cors_origins = [origin.strip() for origin in cors_origins_raw.split(",") if origin.strip()]

    return Settings(
        database_url=database_url,
        google_api_key=google_api_key,
        max_file_size_mb=_parse_int(os.getenv("MAX_FILE_SIZE_MB"), 10),
        ocr_min_text_length=_parse_int(os.getenv("OCR_MIN_TEXT_LENGTH"), 80),
        ocr_batch_size=_parse_int(os.getenv("OCR_BATCH_SIZE"), 8),
        ocr_dpi=_parse_int(os.getenv("OCR_DPI"), 200),
        ocr_max_concurrency=_parse_int(os.getenv("OCR_MAX_CONCURRENCY"), 4),
        cors_origins=cors_origins or ["*"],
        log_level=os.getenv("LOG_LEVEL", "INFO"),
        rate_limit_enabled=_parse_bool(os.getenv("RATE_LIMIT_ENABLED"), True),
        rate_limit_requests=_parse_int(os.getenv("RATE_LIMIT_REQUESTS"), 60),
        rate_limit_window_seconds=_parse_int(os.getenv("RATE_LIMIT_WINDOW_SECONDS"), 60),
        request_timeout_seconds=_parse_int(os.getenv("REQUEST_TIMEOUT_SECONDS"), 20),
        request_retries=_parse_int(os.getenv("REQUEST_RETRIES"), 3),
        request_backoff_factor=_parse_float(os.getenv("REQUEST_BACKOFF_FACTOR"), 0.5),
        db_pool_size=_parse_int(os.getenv("DB_POOL_SIZE"), 5),
        db_max_overflow=_parse_int(os.getenv("DB_MAX_OVERFLOW"), 10),
        jwt_secret=os.getenv("JWT_SECRET", "change-me"),
        jwt_algorithm=os.getenv("JWT_ALGORITHM", "HS256"),
        groq_api_key=os.getenv("GROQ_API_KEY", "").strip() or None,
        groq_model=os.getenv("GROQ_MODEL", "llama-3.1-70b-versatile"),
        skills_llm_enabled=_parse_bool(os.getenv("SKILLS_LLM_ENABLED"), True),
        certifications_llm_enabled=_parse_bool(os.getenv("CERTIFICATIONS_LLM_ENABLED"), True),
    )
