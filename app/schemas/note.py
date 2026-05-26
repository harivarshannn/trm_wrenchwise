"""Candidate note schemas."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class NoteCreate(BaseModel):
    """Create note payload."""

    note: str = Field(min_length=2, max_length=2000)
    created_by: Optional[str] = Field(default=None, max_length=255)


class NoteUpdate(BaseModel):
    """Update note payload."""

    note: str = Field(min_length=2, max_length=2000)


class NoteRead(BaseModel):
    """Note response."""

    id: uuid.UUID
    candidate_id: uuid.UUID
    note: str
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
