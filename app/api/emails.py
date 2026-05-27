"""Email communication API endpoints."""

from __future__ import annotations

import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.schemas.common import APIResponse
from app.schemas.email import EmailHistoryRead, EmailSendRequest, EmailTemplateRead
from app.services.email_service import EmailService

router = APIRouter(prefix="/api", tags=["Email Communications"])


@router.get("/email/templates", response_model=APIResponse[list[EmailTemplateRead]])
async def get_email_templates(session: AsyncSession = Depends(get_session)):
    """Fetch all available pre-configured recruiter email templates."""
    templates = await EmailService(session).list_templates()
    return APIResponse(
        success=True,
        message="Templates retrieved successfully",
        data=[EmailTemplateRead.model_validate(t) for t in templates],
    )


@router.get("/candidates/{candidate_id}/emails", response_model=APIResponse[list[EmailHistoryRead]])
async def get_candidate_email_history(
    candidate_id: uuid.UUID, session: AsyncSession = Depends(get_session)
):
    """Fetch communication logs for a specific candidate."""
    history = await EmailService(session).list_history(candidate_id)
    return APIResponse(
        success=True,
        message="Candidate email history retrieved",
        data=[EmailHistoryRead.model_validate(e) for e in history],
    )


@router.post("/emails/send", response_model=APIResponse[EmailHistoryRead])
async def send_email(
    payload: EmailSendRequest, session: AsyncSession = Depends(get_session)
):
    """Enqueue an email dispatch task to a candidate."""
    try:
        email_log = await EmailService(session).send_candidate_email(
            candidate_id=payload.candidate_id,
            template_type=payload.template_type,
            custom_subject=payload.custom_subject,
            custom_body=payload.custom_body,
            variables=payload.variables,
            sent_by="Jane Doe (HR Lead)",  # Recruiter default session
            followup_date=payload.followup_date,
        )
        return APIResponse(
            success=True,
            message="Email successfully enqueued for delivery",
            data=EmailHistoryRead.model_validate(email_log),
        )
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as e:
        # Check for specific service Exceptions if needed, otherwise generic 500/404
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to dispatch email communication: {e}")
