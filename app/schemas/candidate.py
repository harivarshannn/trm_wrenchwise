"""Candidate schemas."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field

from app.models.candidate import CandidateStatus


class CandidateBase(BaseModel):
    """Base candidate fields."""

    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(default=None, max_length=50)
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    location: Optional[str] = None
    engagement_mode: Optional[str] = None
    salary_expectations: Optional[str] = None
    availability: Optional[str] = None
    resume_url: Optional[str] = None
    skills: Optional[list[str]] = None
    education: Optional[list[dict]] = None
    experience: Optional[list[dict]] = None
    certifications: Optional[list[str]] = None
    job_opening_id: Optional[uuid.UUID] = None


class CandidateCreate(CandidateBase):
    """Payload for candidate creation."""

    resume_text: Optional[str] = None


class CandidateUpdate(BaseModel):
    """Payload to update candidate details."""

    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(default=None, max_length=50)
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    location: Optional[str] = None
    engagement_mode: Optional[str] = None
    salary_expectations: Optional[str] = None
    availability: Optional[str] = None
    resume_url: Optional[str] = None
    skills: Optional[list[str]] = None
    education: Optional[list[dict]] = None
    experience: Optional[list[dict]] = None
    certifications: Optional[list[str]] = None
    job_opening_id: Optional[uuid.UUID] = None


class CandidateUpdateStatus(BaseModel):
    """Payload for status updates."""

    status: CandidateStatus
    selection_salary_per_month: Optional[str] = None
    selection_role: Optional[str] = None
    selection_duration_months: Optional[int] = None
    rejection_reason: Optional[str] = None
    rejection_snooze_until: Optional[datetime] = None


# Lazy import to avoid circular dependency
from app.schemas.job import JobOpeningRead


class CandidateRead(CandidateBase):
    """Candidate response."""

    id: uuid.UUID
    status: CandidateStatus
    selection_salary_per_month: Optional[str] = None
    selection_role: Optional[str] = None
    selection_duration_months: Optional[int] = None
    rejection_reason: Optional[str] = None
    rejection_snooze_until: Optional[datetime] = None
    job_opening: Optional[JobOpeningRead] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
