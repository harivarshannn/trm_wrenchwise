"""Pagination schemas."""

from __future__ import annotations

from pydantic import BaseModel, Field


class PaginationMeta(BaseModel):
    """Pagination metadata."""

    total: int
    page: int = Field(ge=1)
    limit: int = Field(ge=1, le=100)
    total_pages: int
