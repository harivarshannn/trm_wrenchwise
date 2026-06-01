"""Job Opening Pydantic schemas."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class JobOpeningBase(BaseModel):
    """Base Job Opening fields."""

    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    status: str = Field("active", max_length=50)  # "active" or "closed"


class JobOpeningCreate(JobOpeningBase):
    """Payload to create a new job opening."""
    pass


class JobOpeningUpdate(BaseModel):
    """Payload to update an existing job opening."""

    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    status: Optional[str] = Field(None, max_length=50)


class JobOpeningRead(JobOpeningBase):
    """Job Opening response schema."""

    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    total_candidates: int = 0
    accepted_candidates: int = 0

    class Config:
        from_attributes = True
