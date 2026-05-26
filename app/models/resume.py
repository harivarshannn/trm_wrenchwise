"""Domain models for resume parsing."""

from __future__ import annotations

from dataclasses import dataclass, field, asdict
from typing import List, Optional


@dataclass
class ExperienceItem:
    """Normalized experience entry."""

    company: Optional[str] = None
    role: Optional[str] = None
    years: Optional[str] = None


@dataclass
class EducationItem:
    """Normalized education entry."""

    degree: Optional[str] = None
    level: Optional[str] = None


@dataclass
class ParsedResume:
    """Structured resume data."""

    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    skills: List[str] = field(default_factory=list)
    education: List[EducationItem] = field(default_factory=list)
    experience: List[ExperienceItem] = field(default_factory=list)
    certifications: List[str] = field(default_factory=list)
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None

    def to_dict(self) -> dict:
        """Return a serializable representation."""
        return asdict(self)


@dataclass
class OCRResult:
    """OCR result with optional confidence."""

    text: str
    confidence: Optional[float]
