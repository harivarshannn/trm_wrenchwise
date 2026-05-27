"""Candidate repository."""

from __future__ import annotations

from datetime import datetime
from typing import Optional, Sequence
import uuid

from sqlalchemy import Select, func, or_, select, cast, String
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.candidate import Candidate, CandidateStatus


class CandidateRepository:
    """Database access for candidates."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_id(self, candidate_id: uuid.UUID) -> Optional[Candidate]:
        result = await self._session.execute(
            select(Candidate).where(Candidate.id == candidate_id)
        )
        return result.scalar_one_or_none()

    async def find_by_identifiers(
        self, email: Optional[str], phone: Optional[str], linkedin_url: Optional[str]
    ) -> Optional[Candidate]:
        filters = []
        if email:
            filters.append(Candidate.email == email)
        if phone:
            filters.append(Candidate.phone == phone)
        if linkedin_url:
            filters.append(Candidate.linkedin_url == linkedin_url)
        if not filters:
            return None
        result = await self._session.execute(select(Candidate).where(or_(*filters)))
        return result.scalars().first()

    async def create(self, candidate: Candidate) -> Candidate:
        self._session.add(candidate)
        await self._session.commit()
        await self._session.refresh(candidate)
        return candidate

    async def update_status(self, candidate: Candidate, status: CandidateStatus) -> Candidate:
        candidate.status = status
        await self._session.commit()
        await self._session.refresh(candidate)
        return candidate

    async def search(
        self,
        query: Optional[str],
        status: Optional[CandidateStatus],
        has_linkedin: Optional[bool],
        has_github: Optional[bool],
        uploaded_from: Optional[datetime],
        uploaded_to: Optional[datetime],
        offset: int,
        limit: int,
        location: Optional[str] = None,
        skills: Optional[str] = None,
        engagement_mode: Optional[str] = None,
    ) -> tuple[Sequence[Candidate], int]:
        statement = select(Candidate)
        statement = self._apply_filters(
            statement, query, status, has_linkedin, has_github, uploaded_from, uploaded_to,
            location=location, skills=skills, engagement_mode=engagement_mode
        )
        total_statement = select(func.count()).select_from(
            self._apply_filters(
                select(Candidate), query, status, has_linkedin, has_github, uploaded_from, uploaded_to,
                location=location, skills=skills, engagement_mode=engagement_mode
            ).subquery()
        )

        result = await self._session.execute(statement.offset(offset).limit(limit))
        total_result = await self._session.execute(total_statement)

        items = result.scalars().all()
        total = int(total_result.scalar_one())
        return items, total

    @staticmethod
    def _apply_filters(
        statement: Select,
        query: Optional[str],
        status: Optional[CandidateStatus],
        has_linkedin: Optional[bool],
        has_github: Optional[bool],
        uploaded_from: Optional[datetime],
        uploaded_to: Optional[datetime],
        location: Optional[str] = None,
        skills: Optional[str] = None,
        engagement_mode: Optional[str] = None,
    ) -> Select:
        if query:
            like_query = f"%{query}%"
            statement = statement.where(
                or_(
                    Candidate.name.ilike(like_query),
                    Candidate.email.ilike(like_query),
                    Candidate.phone.ilike(like_query),
                    Candidate.linkedin_url.ilike(like_query),
                    Candidate.github_url.ilike(like_query),
                    Candidate.resume_text.ilike(like_query),
                    Candidate.location.ilike(like_query),
                    cast(Candidate.skills, String).ilike(like_query),
                )
            )
        if status:
            statement = statement.where(Candidate.status == status)
        if has_linkedin is True:
            statement = statement.where(Candidate.linkedin_url.isnot(None))
        if has_linkedin is False:
            statement = statement.where(Candidate.linkedin_url.is_(None))
        if has_github is True:
            statement = statement.where(Candidate.github_url.isnot(None))
        if has_github is False:
            statement = statement.where(Candidate.github_url.is_(None))
        if location:
            statement = statement.where(Candidate.location.ilike(f"%{location}%"))
        if engagement_mode:
            statement = statement.where(Candidate.engagement_mode == engagement_mode)
        if skills:
            statement = statement.where(
                or_(
                    Candidate.resume_text.ilike(f"%{skills}%"),
                    cast(Candidate.skills, String).ilike(f"%{skills}%"),
                )
            )
        if uploaded_from:
            statement = statement.where(Candidate.created_at >= uploaded_from)
        if uploaded_to:
            statement = statement.where(Candidate.created_at <= uploaded_to)
        return statement

    async def delete(self, candidate: Candidate) -> None:
        await self._session.delete(candidate)
        await self._session.commit()
