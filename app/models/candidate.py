"""Candidate database model."""

from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, Index, String, Text, func, JSON, ForeignKey, LargeBinary
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class CandidateStatus(str, enum.Enum):
    """Candidate status values."""

    IN_PROGRESS = "in_progress"
    SELECTED = "selected"
    REJECTED = "rejected"


class Candidate(Base):
    """Candidate entity."""

    __tablename__ = "candidates"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str | None] = mapped_column(String(255))
    email: Mapped[str | None] = mapped_column(String(255))
    phone: Mapped[str | None] = mapped_column(String(50))
    linkedin_url: Mapped[str | None] = mapped_column(String(255))
    github_url: Mapped[str | None] = mapped_column(String(255))
    status: Mapped[CandidateStatus] = mapped_column(Enum(CandidateStatus), default=CandidateStatus.IN_PROGRESS)
    resume_text: Mapped[str | None] = mapped_column(Text)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    engagement_mode: Mapped[str | None] = mapped_column(String(50), nullable=True)
    salary_expectations: Mapped[str | None] = mapped_column(String(255), nullable=True)
    availability: Mapped[str | None] = mapped_column(String(255), nullable=True)
    resume_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    resume_bytes: Mapped[bytes | None] = mapped_column(LargeBinary, nullable=True)
    skills: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    education: Mapped[list[dict] | None] = mapped_column(JSON, nullable=True)
    experience: Mapped[list[dict] | None] = mapped_column(JSON, nullable=True)
    certifications: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Job opening association
    job_opening_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("job_openings.id"), nullable=True)

    # Selection Details
    selection_salary_per_month: Mapped[str | None] = mapped_column(String(255), nullable=True)
    selection_role: Mapped[str | None] = mapped_column(String(255), nullable=True)
    selection_duration_months: Mapped[int | None] = mapped_column(nullable=True)

    # Rejection Details
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    rejection_snooze_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    job_opening = relationship("JobOpening", back_populates="candidates")
    notes = relationship("CandidateNote", back_populates="candidate", cascade="all, delete-orphan")
    activity_logs = relationship("CandidateActivityLog", back_populates="candidate", cascade="all, delete-orphan")
    emails = relationship("CandidateEmail", back_populates="candidate", cascade="all, delete-orphan")


Index("ix_candidates_email", Candidate.email)
Index("ix_candidates_phone", Candidate.phone)
Index("ix_candidates_linkedin", Candidate.linkedin_url)
Index("ix_candidates_github", Candidate.github_url)
Index("ix_candidates_job_opening", Candidate.job_opening_id)
