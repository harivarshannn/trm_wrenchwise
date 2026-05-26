"""Candidate search and filtering service."""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.candidate import CandidateStatus
from app.repositories.candidate_repository import CandidateRepository


class SearchService:
    """Service for candidate search."""

    def __init__(self, session: AsyncSession) -> None:
        self._repo = CandidateRepository(session)

    async def search(
        self,
        query: Optional[str],
        status: Optional[CandidateStatus],
        has_linkedin: Optional[bool],
        has_github: Optional[bool],
        uploaded_from: Optional[datetime],
        uploaded_to: Optional[datetime],
        page: int,
        limit: int,
    ):
        offset = (page - 1) * limit
        return await self._repo.search(
            query=query,
            status=status,
            has_linkedin=has_linkedin,
            has_github=has_github,
            uploaded_from=uploaded_from,
            uploaded_to=uploaded_to,
            offset=offset,
            limit=limit,
        )
