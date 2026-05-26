"""Activity log repository."""

from __future__ import annotations

import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.activity import CandidateActivityLog


class ActivityRepository:
    """Database access for activity logs."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, activity: CandidateActivityLog) -> CandidateActivityLog:
        self._session.add(activity)
        await self._session.commit()
        await self._session.refresh(activity)
        return activity

    async def list_by_candidate(self, candidate_id: uuid.UUID) -> list[CandidateActivityLog]:
        result = await self._session.execute(
            select(CandidateActivityLog)
            .where(CandidateActivityLog.candidate_id == candidate_id)
            .order_by(CandidateActivityLog.created_at.desc())
        )
        return list(result.scalars().all())
