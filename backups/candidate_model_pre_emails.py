"""Candidate database model."""

from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, Index, String, Text, func
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
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    notes = relationship("CandidateNote", back_populates="candidate", cascade="all, delete-orphan")
    activity_logs = relationship("CandidateActivityLog", back_populates="candidate", cascade="all, delete-orphan")


Index("ix_candidates_email", Candidate.email)
Index("ix_candidates_phone", Candidate.phone)
Index("ix_candidates_linkedin", Candidate.linkedin_url)
Index("ix_candidates_github", Candidate.github_url)
