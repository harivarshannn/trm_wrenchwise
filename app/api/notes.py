"""Candidate notes endpoints."""

from __future__ import annotations

import uuid
from datetime import date, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.schemas.common import APIResponse
from app.schemas.note import NoteCreate, NoteRead, NoteUpdate, ReminderRead
from app.services.notes_service import NotesService


router = APIRouter(prefix="/api", tags=["Notes"])


@router.get("/candidates/{candidate_id}/notes", response_model=APIResponse[list[NoteRead]])
async def list_notes(candidate_id: uuid.UUID, session: AsyncSession = Depends(get_session)):
    notes = await NotesService(session).list_notes(candidate_id)
    return APIResponse(success=True, message="Notes fetched", data=notes)


@router.post("/candidates/{candidate_id}/notes", response_model=APIResponse[NoteRead])
async def create_note(
    candidate_id: uuid.UUID,
    payload: NoteCreate,
    session: AsyncSession = Depends(get_session),
):
    note = await NotesService(session).create_note(
        candidate_id,
        payload.note,
        payload.created_by,
        payload.followup_date,
    )
    return APIResponse(success=True, message="Note created", data=note)


@router.patch("/notes/{note_id}", response_model=APIResponse[NoteRead])
async def update_note(
    note_id: uuid.UUID,
    payload: NoteUpdate,
    session: AsyncSession = Depends(get_session),
):
    note = await NotesService(session).update_note(note_id, payload.note)
    return APIResponse(success=True, message="Note updated", data=note)


@router.delete("/notes/{note_id}", response_model=APIResponse[dict])
async def delete_note(note_id: uuid.UUID, session: AsyncSession = Depends(get_session)):
    await NotesService(session).delete_note(note_id)
    return APIResponse(success=True, message="Note deleted", data={})


@router.get("/notes/reminders", response_model=APIResponse[list[ReminderRead]])
async def list_reminders(
    days: int = Query(30, ge=1, le=365),
    session: AsyncSession = Depends(get_session),
):
    start_date = date.today()
    end_date = start_date + timedelta(days=days)
    reminders = await NotesService(session).list_reminders(start_date, end_date)
    return APIResponse(success=True, message="Reminders fetched", data=reminders)
