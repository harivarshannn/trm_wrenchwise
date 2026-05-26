"""Activity log service."""

from __future__ import annotations

from typing import Optional
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.activity import CandidateActivityLog
from app.repositories.activity_repository import ActivityRepository


class ActivityService:
    """Service for logging candidate activity."""

    def __init__(self, session: AsyncSession) -> None:
        self._repo = ActivityRepository(session)

    async def log(
        self,
        candidate_id: uuid.UUID,
        action_type: str,
        description: Optional[str] = None,
        created_by: Optional[str] = None,
    ) -> CandidateActivityLog:
        activity = CandidateActivityLog(
            candidate_id=candidate_id,
            action_type=action_type,
            description=description,
            created_by=created_by,
        )
        return await self._repo.create(activity)

    async def get_timeline(self, candidate_id: uuid.UUID) -> list[CandidateActivityLog]:
        return await self._repo.list_by_candidate(candidate_id)
