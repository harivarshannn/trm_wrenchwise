"""Candidate notes repository."""

from __future__ import annotations

from datetime import date
from typing import Optional, Sequence
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.candidate import Candidate
from app.models.note import CandidateNote


class NotesRepository:
    """Database access for candidate notes."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_by_candidate(self, candidate_id: uuid.UUID) -> Sequence[CandidateNote]:
        result = await self._session.execute(
            select(CandidateNote)
            .where(CandidateNote.candidate_id == candidate_id)
            .order_by(CandidateNote.created_at.desc())
        )
        return result.scalars().all()

    async def get_by_id(self, note_id: uuid.UUID) -> CandidateNote | None:
        result = await self._session.execute(
            select(CandidateNote).where(CandidateNote.id == note_id)
        )
        return result.scalar_one_or_none()

    async def create(self, note: CandidateNote) -> CandidateNote:
        self._session.add(note)
        await self._session.commit()
        await self._session.refresh(note)
        return note

    async def update(self, note: CandidateNote) -> CandidateNote:
        await self._session.commit()
        await self._session.refresh(note)
        return note

    async def delete(self, note: CandidateNote) -> None:
        await self._session.delete(note)
        await self._session.commit()

    async def list_followups(
        self,
        start_date: date,
        end_date: Optional[date] = None,
    ) -> Sequence[tuple[CandidateNote, Candidate]]:
        stmt = (
            select(CandidateNote, Candidate)
            .join(Candidate, Candidate.id == CandidateNote.candidate_id)
            .where(CandidateNote.followup_date.is_not(None))
            .where(CandidateNote.followup_date >= start_date)
            .order_by(CandidateNote.followup_date.asc())
        )
        if end_date:
            stmt = stmt.where(CandidateNote.followup_date <= end_date)
        result = await self._session.execute(stmt)
        return result.all()
