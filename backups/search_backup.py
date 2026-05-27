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
        page=page,
        limit=limit,
    )
    total_pages = max(1, (total + limit - 1) // limit)
    payload = {
        "items": [CandidateRead.model_validate(item) for item in items],
        "pagination": PaginationMeta(total=total, page=page, limit=limit, total_pages=total_pages),
    }
    return APIResponse(success=True, message="Candidates fetched", data=payload)
