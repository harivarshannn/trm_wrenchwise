"""Candidate service layer."""

from __future__ import annotations

from typing import Optional
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import DuplicateCandidateError, NotFoundError
from app.models.candidate import Candidate, CandidateStatus
from app.repositories.candidate_repository import CandidateRepository
from app.services.activity_service import ActivityService
from app.services.duplicate_service import DuplicateService


class CandidateService:
    """Business logic for candidates."""

    def __init__(self, session: AsyncSession) -> None:
        self._repo = CandidateRepository(session)
        self._duplicates = DuplicateService(session)
        self._activity = ActivityService(session)

    async def create_candidate(
        self,
        name: Optional[str],
        email: Optional[str],
        phone: Optional[str],
        linkedin_url: Optional[str],
        github_url: Optional[str],
        resume_text: Optional[str],
        created_by: Optional[str] = None,
    ) -> Candidate:
        existing = await self._duplicates.find_exact_duplicate(email, phone, linkedin_url)
        if existing:
            raise DuplicateCandidateError(existing_candidate=self._to_dict(existing))

        candidate = Candidate(
            name=name,
            email=email,
            phone=phone,
            linkedin_url=linkedin_url,
            github_url=github_url,
            resume_text=resume_text,
            status=CandidateStatus.IN_PROGRESS,
        )
        candidate = await self._repo.create(candidate)
        await self._activity.log(
            candidate_id=candidate.id,
            action_type="resume_upload",
            description="Resume uploaded",
            created_by=created_by,
        )
        return candidate

    async def update_status(
        self, candidate_id: uuid.UUID, status: CandidateStatus, updated_by: Optional[str] = None
    ) -> Candidate:
        candidate = await self._repo.get_by_id(candidate_id)
        if not candidate:
            raise NotFoundError("Candidate not found.")
        candidate = await self._repo.update_status(candidate, status)
        await self._activity.log(
            candidate_id=candidate.id,
            action_type="status_updated",
            description=f"Status updated to {status.value}",
            created_by=updated_by,
        )
        return candidate

    async def delete_candidate(
        self, candidate_id: uuid.UUID, deleted_by: Optional[str] = None
    ) -> uuid.UUID:
        candidate = await self._repo.get_by_id(candidate_id)
        if not candidate:
            raise NotFoundError("Candidate not found.")
        await self._repo.delete(candidate)
        return candidate_id

    @staticmethod
    def _to_dict(candidate: Candidate) -> dict:
        return {
            "id": str(candidate.id),
            "name": candidate.name,
            "email": candidate.email,
            "phone": candidate.phone,
            "linkedin_url": candidate.linkedin_url,
            "github_url": candidate.github_url,
            "status": candidate.status.value,
            "created_at": candidate.created_at.isoformat() if candidate.created_at else None,
        }
