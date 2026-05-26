"""Duplicate detection service."""

from __future__ import annotations

from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.candidate import Candidate
from app.repositories.candidate_repository import CandidateRepository
from app.utils.fuzzy import partial_phone_match, similarity_ratio


class DuplicateService:
    """Detect duplicate candidates."""

    def __init__(self, session: AsyncSession) -> None:
        self._repo = CandidateRepository(session)

    async def find_exact_duplicate(
        self, email: Optional[str], phone: Optional[str], linkedin_url: Optional[str]
    ) -> Optional[Candidate]:
        return await self._repo.find_by_identifiers(email, phone, linkedin_url)

    def has_soft_match(self, candidate: Candidate, name: Optional[str], phone: Optional[str]) -> bool:
        if name and candidate.name and similarity_ratio(name, candidate.name) > 0.85:
            return True
        if phone and candidate.phone and partial_phone_match(phone, candidate.phone):
            return True
        return False
