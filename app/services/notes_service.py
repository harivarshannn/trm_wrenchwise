"""Recruiter notes service."""

from __future__ import annotations

from datetime import date
from typing import Optional
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models.candidate import Candidate
from app.models.note import CandidateNote
from app.repositories.notes_repository import NotesRepository
from app.services.activity_service import ActivityService


class NotesService:
    """Business logic for candidate notes."""

    def __init__(self, session: AsyncSession) -> None:
        self._repo = NotesRepository(session)
        self._activity = ActivityService(session)

    async def list_notes(self, candidate_id: uuid.UUID):
        return await self._repo.list_by_candidate(candidate_id)

    async def create_note(
        self,
        candidate_id: uuid.UUID,
        note: str,
        created_by: Optional[str] = None,
        followup_date: Optional[date] = None,
    ) -> CandidateNote:
        note_entity = CandidateNote(
            candidate_id=candidate_id,
            note=note,
            created_by=created_by,
            followup_date=followup_date,
        )
        note_entity = await self._repo.create(note_entity)
        await self._activity.log(
            candidate_id=candidate_id,
            action_type="note_added",
            description="Note added",
            created_by=created_by,
        )
        return note_entity

    async def update_note(self, note_id: uuid.UUID, note: str) -> CandidateNote:
        note_entity = await self._repo.get_by_id(note_id)
        if not note_entity:
            raise NotFoundError("Note not found.")
        note_entity.note = note
        note_entity = await self._repo.update(note_entity)
        await self._activity.log(
            candidate_id=note_entity.candidate_id,
            action_type="note_updated",
            description="Note updated",
        )
        return note_entity

    async def delete_note(self, note_id: uuid.UUID) -> None:
        note_entity = await self._repo.get_by_id(note_id)
        if not note_entity:
            raise NotFoundError("Note not found.")
        await self._repo.delete(note_entity)
        await self._activity.log(
            candidate_id=note_entity.candidate_id,
            action_type="note_deleted",
            description="Note deleted",
        )

    async def list_reminders(self, start_date: date, end_date: Optional[date] = None):
        rows = await self._repo.list_followups(start_date, end_date)
        reminders = []
        for note, candidate in rows:
            reminders.append(
                {
                    "note_id": note.id,
                    "candidate_id": note.candidate_id,
                    "candidate_name": candidate.name if candidate else None,
                    "candidate_email": candidate.email if candidate else None,
                    "candidate_status": candidate.status.value if candidate else None,
                    "note": note.note,
                    "followup_date": note.followup_date,
                    "created_by": note.created_by,
                    "created_at": note.created_at,
                }
            )
        return reminders
