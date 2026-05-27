"""Activity log repository."""

from __future__ import annotations

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
