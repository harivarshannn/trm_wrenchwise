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
        skills: Optional[list[str]] = None,
        education: Optional[list[dict]] = None,
        experience: Optional[list[dict]] = None,
        certifications: Optional[list[str]] = None,
        job_opening_id: Optional[uuid.UUID] = None,
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
            skills=skills,
            education=education,
            experience=experience,
            certifications=certifications,
            job_opening_id=job_opening_id,
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
        self,
        candidate_id: uuid.UUID,
        status: CandidateStatus,
        selection_salary_per_month: Optional[str] = None,
        selection_role: Optional[str] = None,
        selection_duration_months: Optional[int] = None,
        rejection_reason: Optional[str] = None,
        rejection_snooze_until: Optional[datetime] = None,
        updated_by: Optional[str] = None,
    ) -> Candidate:
        candidate = await self._repo.get_by_id(candidate_id)
        if not candidate:
            raise NotFoundError("Candidate not found.")
            
        candidate.status = status
        log_desc = f"Status updated to {status.value}"
        
        if status == CandidateStatus.SELECTED:
            candidate.selection_salary_per_month = selection_salary_per_month
            candidate.selection_role = selection_role
            candidate.selection_duration_months = selection_duration_months
            candidate.rejection_reason = None
            candidate.rejection_snooze_until = None
            
            details = []
            if selection_role:
                details.append(f"Role: {selection_role}")
            if selection_salary_per_month:
                details.append(f"Salary: {selection_salary_per_month}/mo")
            if selection_duration_months:
                details.append(f"Duration: {selection_duration_months} mos")
            if details:
                log_desc += f" ({', '.join(details)})"
                
        elif status == CandidateStatus.REJECTED:
            candidate.rejection_reason = rejection_reason
            candidate.rejection_snooze_until = rejection_snooze_until
            candidate.selection_salary_per_month = None
            candidate.selection_role = None
            candidate.selection_duration_months = None
            
            details = []
            if rejection_reason:
                details.append(f"Reason: {rejection_reason}")
            if rejection_snooze_until:
                details.append(f"Snoozed until: {rejection_snooze_until.strftime('%b %d, %Y %I:%M %p')}")
            if details:
                log_desc += f" ({', '.join(details)})"
                
        else:
            candidate.selection_salary_per_month = None
            candidate.selection_role = None
            candidate.selection_duration_months = None
            candidate.rejection_reason = None
            candidate.rejection_snooze_until = None

        await self._repo._session.commit()
        await self._repo._session.refresh(candidate)

        await self._activity.log(
            candidate_id=candidate.id,
            action_type="status_updated",
            description=log_desc,
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
            "skills": candidate.skills,
            "education": candidate.education,
            "experience": candidate.experience,
            "certifications": candidate.certifications,
            "job_opening_id": str(candidate.job_opening_id) if candidate.job_opening_id else None,
            "selection_salary_per_month": candidate.selection_salary_per_month,
            "selection_role": candidate.selection_role,
            "selection_duration_months": candidate.selection_duration_months,
            "rejection_reason": candidate.rejection_reason,
            "rejection_snooze_until": candidate.rejection_snooze_until.isoformat() if candidate.rejection_snooze_until else None,
            "created_at": candidate.created_at.isoformat() if candidate.created_at else None,
        }
