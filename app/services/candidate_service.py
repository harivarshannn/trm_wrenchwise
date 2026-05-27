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
        location: Optional[str] = None,
        engagement_mode: Optional[str] = None,
        salary_expectations: Optional[str] = None,
        availability: Optional[str] = None,
        resume_url: Optional[str] = None,
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
            location=location,
            engagement_mode=engagement_mode,
            salary_expectations=salary_expectations,
            availability=availability,
            resume_url=resume_url,
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

    async def update_candidate(
        self, candidate_id: uuid.UUID, payload: Any, updated_by: Optional[str] = None
    ) -> Candidate:
        candidate = await self._repo.get_by_id(candidate_id)
        if not candidate:
            raise NotFoundError("Candidate not found.")

        update_data = payload.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(candidate, key, value)

        await self._repo._session.commit()
        await self._repo._session.refresh(candidate)

        await self._activity.log(
            candidate_id=candidate.id,
            action_type="candidate_updated",
            description="Candidate details updated",
            created_by=updated_by,
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
            "location": candidate.location,
            "engagement_mode": candidate.engagement_mode,
            "salary_expectations": candidate.salary_expectations,
            "availability": candidate.availability,
            "resume_url": candidate.resume_url,
            "created_at": candidate.created_at.isoformat() if candidate.created_at else None,
        }
