"""API routes for Job Openings."""

from __future__ import annotations

import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.models.job_opening import JobOpening
from app.models.candidate import Candidate, CandidateStatus
from app.schemas.common import APIResponse
from app.schemas.job import JobOpeningCreate, JobOpeningUpdate, JobOpeningRead

router = APIRouter(prefix="/api/jobs", tags=["Jobs"])


@router.get("", response_model=APIResponse[list[JobOpeningRead]])
async def list_jobs(session: AsyncSession = Depends(get_session)):
    """List all job openings with total and accepted candidate counts."""
    try:
        # Total candidates count subquery
        total_sub = (
            select(Candidate.job_opening_id, func.count(Candidate.id).label("total"))
            .group_by(Candidate.job_opening_id)
            .subquery()
        )
        # Accepted candidates count subquery
        accepted_sub = (
            select(Candidate.job_opening_id, func.count(Candidate.id).label("accepted"))
            .where(Candidate.status == CandidateStatus.SELECTED)
            .group_by(Candidate.job_opening_id)
            .subquery()
        )

        stmt = (
            select(
                JobOpening,
                func.coalesce(total_sub.c.total, 0).label("total_candidates"),
                func.coalesce(accepted_sub.c.accepted, 0).label("accepted_candidates")
            )
            .outerjoin(total_sub, JobOpening.id == total_sub.c.job_opening_id)
            .outerjoin(accepted_sub, JobOpening.id == accepted_sub.c.job_opening_id)
            .order_by(JobOpening.created_at.desc())
        )
        result = await session.execute(stmt)
        
        jobs = []
        for row in result.all():
            job_obj, total, accepted = row
            jobs.append(
                JobOpeningRead(
                    id=job_obj.id,
                    title=job_obj.title,
                    description=job_obj.description,
                    status=job_obj.status,
                    vacancies=job_obj.vacancies,
                    created_at=job_obj.created_at,
                    updated_at=job_obj.updated_at,
                    total_candidates=total,
                    accepted_candidates=accepted
                )
            )
        return APIResponse(success=True, message="Jobs list fetched.", data=jobs)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch job openings: {str(e)}"
        )


@router.post("", response_model=APIResponse[JobOpeningRead])
async def create_job(payload: JobOpeningCreate, session: AsyncSession = Depends(get_session)):
    """Create a new job opening."""
    try:
        new_job = JobOpening(
            title=payload.title,
            description=payload.description,
            status=payload.status,
            vacancies=payload.vacancies
        )
        session.add(new_job)
        await session.commit()
        await session.refresh(new_job)

        read_obj = JobOpeningRead(
            id=new_job.id,
            title=new_job.title,
            description=new_job.description,
            status=new_job.status,
            vacancies=new_job.vacancies,
            created_at=new_job.created_at,
            updated_at=new_job.updated_at,
            total_candidates=0,
            accepted_candidates=0
        )
        return APIResponse(success=True, message="Job opening created successfully.", data=read_obj)
    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create job opening: {str(e)}"
        )


@router.patch("/{job_id}", response_model=APIResponse[JobOpeningRead])
async def update_job(
    job_id: uuid.UUID,
    payload: JobOpeningUpdate,
    session: AsyncSession = Depends(get_session)
):
    """Update an existing job opening."""
    try:
        stmt = select(JobOpening).where(JobOpening.id == job_id)
        result = await session.execute(stmt)
        job_obj = result.scalar_one_or_none()
        if not job_obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job opening not found."
            )

        update_data = payload.model_dump(exclude_unset=True)
        for key, val in update_data.items():
            setattr(job_obj, key, val)

        await session.commit()
        await session.refresh(job_obj)

        # Recalculate counts
        total_stmt = select(func.count(Candidate.id)).where(Candidate.job_opening_id == job_id)
        accepted_stmt = select(func.count(Candidate.id)).where(
            and_(Candidate.job_opening_id == job_id, Candidate.status == CandidateStatus.SELECTED)
        )
        
        total_res = await session.execute(total_stmt)
        accepted_res = await session.execute(accepted_stmt)

        read_obj = JobOpeningRead(
            id=job_obj.id,
            title=job_obj.title,
            description=job_obj.description,
            status=job_obj.status,
            vacancies=job_obj.vacancies,
            created_at=job_obj.created_at,
            updated_at=job_obj.updated_at,
            total_candidates=total_res.scalar_one(),
            accepted_candidates=accepted_res.scalar_one()
        )
        return APIResponse(success=True, message="Job opening updated successfully.", data=read_obj)
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update job opening: {str(e)}"
        )


@router.delete("/{job_id}", response_model=APIResponse[dict])
async def delete_job(job_id: uuid.UUID, session: AsyncSession = Depends(get_session)):
    """Delete a job opening."""
    try:
        stmt = select(JobOpening).where(JobOpening.id == job_id)
        result = await session.execute(stmt)
        job_obj = result.scalar_one_or_none()
        if not job_obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job opening not found."
            )

        # Unlink candidates applied to this job (set job_opening_id to null)
        unlink_stmt = select(Candidate).where(Candidate.job_opening_id == job_id)
        cand_res = await session.execute(unlink_stmt)
        for cand in cand_res.scalars().all():
            cand.job_opening_id = None

        await session.delete(job_obj)
        await session.commit()
        return APIResponse(success=True, message="Job opening deleted successfully.", data={})
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete job opening: {str(e)}"
        )
