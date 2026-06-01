"""Candidate search endpoints."""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.models.candidate import CandidateStatus
from app.schemas.candidate import CandidateRead
from app.schemas.common import APIResponse
from app.schemas.pagination import PaginationMeta
from app.services.search_service import SearchService


router = APIRouter(prefix="/api/candidates", tags=["Candidates"])


def _parse_datetime(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    return datetime.fromisoformat(value)


@router.get("/search", response_model=APIResponse[dict])
async def search_candidates(
    q: Optional[str] = Query(default=None),
    status: Optional[CandidateStatus] = Query(default=None),
    has_linkedin: Optional[bool] = Query(default=None),
    has_github: Optional[bool] = Query(default=None),
    uploaded_from: Optional[str] = Query(default=None),
    uploaded_to: Optional[str] = Query(default=None),
    location: Optional[str] = Query(default=None),
    skills: Optional[str] = Query(default=None),
    engagement_mode: Optional[str] = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    session: AsyncSession = Depends(get_session),
):
    service = SearchService(session)
    items, total = await service.search(
        query=q,
        status=status,
        has_linkedin=has_linkedin,
        has_github=has_github,
        uploaded_from=_parse_datetime(uploaded_from),
        uploaded_to=_parse_datetime(uploaded_to),
        location=location,
        skills=skills,
        engagement_mode=engagement_mode,
        page=page,
        limit=limit,
    )
    total_pages = max(1, (total + limit - 1) // limit)
    payload = {
        "items": [CandidateRead.model_validate(item) for item in items],
        "pagination": PaginationMeta(total=total, page=page, limit=limit, total_pages=total_pages),
    }
    return APIResponse(success=True, message="Candidates fetched", data=payload)


import uuid
from app.schemas.candidate import CandidateCreate, CandidateUpdate, CandidateUpdateStatus
from app.schemas.activity import ActivityLogRead
from app.services.candidate_service import CandidateService
from app.services.activity_service import ActivityService


@router.post("", response_model=APIResponse[CandidateRead])
async def create_candidate(
    payload: CandidateCreate,
    session: AsyncSession = Depends(get_session),
):
    candidate = await CandidateService(session).create_candidate(
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        linkedin_url=payload.linkedin_url,
        github_url=payload.github_url,
        resume_text=payload.resume_text,
        location=payload.location,
        engagement_mode=payload.engagement_mode,
        salary_expectations=payload.salary_expectations,
        availability=payload.availability,
        resume_url=payload.resume_url,
        skills=payload.skills,
        education=payload.education,
        experience=payload.experience,
        certifications=payload.certifications,
    )
    return APIResponse(success=True, message="Candidate created", data=CandidateRead.model_validate(candidate))


@router.patch("/{candidate_id}", response_model=APIResponse[CandidateRead])
async def update_candidate(
    candidate_id: uuid.UUID,
    payload: CandidateUpdate,
    session: AsyncSession = Depends(get_session),
):
    candidate = await CandidateService(session).update_candidate(candidate_id, payload)
    return APIResponse(success=True, message="Candidate updated", data=CandidateRead.model_validate(candidate))


@router.patch("/{candidate_id}/status", response_model=APIResponse[CandidateRead])
async def update_candidate_status(
    candidate_id: uuid.UUID,
    payload: CandidateUpdateStatus,
    session: AsyncSession = Depends(get_session),
):
    candidate = await CandidateService(session).update_status(
        candidate_id=candidate_id,
        status=payload.status,
        selection_salary_per_month=payload.selection_salary_per_month,
        selection_role=payload.selection_role,
        selection_duration_months=payload.selection_duration_months,
        rejection_reason=payload.rejection_reason,
        rejection_snooze_until=payload.rejection_snooze_until,
        job_opening_id=payload.job_opening_id,
    )
    return APIResponse(success=True, message="Status updated", data=CandidateRead.model_validate(candidate))


@router.delete("/{candidate_id}", response_model=APIResponse[dict])
async def delete_candidate(
    candidate_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
):
    await CandidateService(session).delete_candidate(candidate_id)
    return APIResponse(success=True, message="Candidate deleted", data={})


@router.get("/{candidate_id}/timeline", response_model=APIResponse[list[ActivityLogRead]])
async def get_candidate_timeline(
    candidate_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
):
    events = await ActivityService(session).get_timeline(candidate_id)
    return APIResponse(
        success=True,
        message="Timeline fetched",
        data=[ActivityLogRead.model_validate(ev) for ev in events],
    )
