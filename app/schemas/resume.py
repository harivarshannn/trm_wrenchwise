"""Pydantic schemas for API responses."""

from __future__ import annotations

from typing import List, Optional
from pydantic import BaseModel, Field


class ExperienceItem(BaseModel):
    """Structured experience item."""

    company: Optional[str] = None
    role: Optional[str] = None
    years: Optional[str] = None


class EducationItem(BaseModel):
    """Structured education item."""

    degree: Optional[str] = None
    level: Optional[str] = Field(default=None, description="UG or PG")


class ParsedData(BaseModel):
    """Structured resume payload."""

    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    education: List[EducationItem] = Field(default_factory=list)
    experience: List[ExperienceItem] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None


class UploadResumeResponse(BaseModel):
    """Upload response schema."""

    success: bool
    raw_text: str
    parsed_data: ParsedData
    ocr_confidence: Optional[float] = None
