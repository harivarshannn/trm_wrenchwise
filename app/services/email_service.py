"""Email service for centralized candidate communications."""

from __future__ import annotations

import asyncio
from datetime import date, datetime
import os
from typing import Any, Dict, Optional, Sequence
import uuid

from jinja2 import Template
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.db.session import AsyncSessionLocal
from app.models.candidate_email import CandidateEmail
from app.repositories.candidate_repository import CandidateRepository
from app.repositories.email_repository import EmailRepository
from app.services.activity_service import ActivityService
from app.services.notes_service import NotesService
from app.utils.config import get_settings
from app.utils.logger import get_logger

logger = get_logger("EmailService")

# Global thread-safe asynchronous queue for email sending tasks
email_queue: asyncio.Queue[Dict[str, Any]] = asyncio.Queue()


async def send_smtp_via_brevo(recipient_email: str, subject: str, html_body: str) -> bool:
    """Send SMTP email using Brevo SDK inside an async-safe threadpool."""
    settings = get_settings()

    if not settings.brevo_api_key:
        logger.info(
            f"[SANDBOX SIMULATOR] Email successfully routed to {recipient_email}.\n"
            f"Subject: {subject}\n"
            f"Body snippet: {html_body[:200]}..."
        )
        return True

    def _send_blocking():
        import sib_api_v3_sdk
        from sib_api_v3_sdk.rest import ApiException

        configuration = sib_api_v3_sdk.Configuration()
        configuration.api_key["api-key"] = settings.brevo_api_key

        api_instance = sib_api_v3_sdk.TransactionalEmailsApi(
            sib_api_v3_sdk.ApiClient(configuration)
        )

        send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
            to=[sib_api_v3_sdk.SendSmtpEmailTo(email=recipient_email)],
            sender=sib_api_v3_sdk.SendSmtpEmailSender(
                email=settings.brevo_sender_email, name=settings.brevo_sender_name
            ),
            subject=subject,
            html_content=html_body,
        )

        try:
            api_instance.send_transac_email(send_smtp_email)
            return True
        except ApiException as e:
            logger.error(f"Brevo API error: {e}")
            return False
        except Exception as ex:
            logger.error(f"Unexpected error in Brevo SDK: {ex}")
            return False

    return await asyncio.to_thread(_send_blocking)


async def email_queue_consumer_task() -> None:
    """Background loop consumer to fetch enqueued emails and dispatch them."""
    logger.info("Initializing background email consumer task.")
    while True:
        try:
            task_data = await email_queue.get()
            email_id = task_data["email_id"]
            recipient_email = task_data["recipient_email"]
            subject = task_data["subject"]
            body = task_data["body"]
            candidate_id = task_data["candidate_id"]
            candidate_name = task_data.get("candidate_name", "Candidate")
            template_name = task_data.get("template_name", "Email")

            logger.info(f"Processing email delivery task for candidate {candidate_id} ({recipient_email}).")
            success = await send_smtp_via_brevo(recipient_email, subject, body)
            status = "sent" if success else "failed"

            # Update email record status in database
            async with AsyncSessionLocal() as session:
                email_repo = EmailRepository(session)
                activity_service = ActivityService(session)
                
                await email_repo.update_email_status(email_id, status)
                
                # Log outcome activity audit trail
                await activity_service.log(
                    candidate_id=candidate_id,
                    action_type="email_sent" if success else "email_failed",
                    description=f"{template_name} email {status} to {candidate_name} ({recipient_email}). Subject: {subject}",
                    created_by=task_data.get("sent_by", "System"),
                )

            email_queue.task_done()
        except asyncio.CancelledError:
            logger.info("Background email consumer task cancelled.")
            break
        except Exception as e:
            logger.exception(f"Unexpected error in background email consumer loop: {e}")
            # Keep loop running even if an individual task crashes
            await asyncio.sleep(1)


class EmailService:
    """Orchestrates candidate communication logs, rendering, and async dispatch."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._email_repo = EmailRepository(session)
        self._candidate_repo = CandidateRepository(session)
        self._activity = ActivityService(session)

    async def list_templates(self) -> Sequence[Any]:
        """Fetch all configured recruiter email templates."""
        return await self._email_repo.list_templates()

    async def list_history(self, candidate_id: uuid.UUID) -> Sequence[CandidateEmail]:
        """Fetch communication history log for a specific candidate."""
        return await self._email_repo.get_email_history_by_candidate(candidate_id)

    async def send_candidate_email(
        self,
        candidate_id: uuid.UUID,
        template_type: str,
        custom_subject: Optional[str] = None,
        custom_body: Optional[str] = None,
        variables: Optional[Dict[str, Any]] = None,
        sent_by: Optional[str] = "Jane Doe (HR Lead)",
        followup_date: Optional[datetime] = None,
    ) -> CandidateEmail:
        """Render, validate, log, and enqueue candidate email delivery."""
        candidate = await self._candidate_repo.get_by_id(candidate_id)
        if not candidate:
            raise NotFoundError("Candidate not found.")

        if not candidate.email:
            raise ValueError(f"Candidate {candidate.name or candidate_id} has no email address configured.")

        template = await self._email_repo.get_template_by_key(template_type)
        if not template:
            raise NotFoundError(f"Email template key '{template_type}' not found.")

        # Determine email subject
        subject = custom_subject.strip() if (custom_subject and custom_subject.strip()) else template.subject

        # Build render variables context
        context = {
            "candidate_name": candidate.name or "Candidate",
            "recruiter_name": sent_by or "HR Manager",
            "company_name": "TRMS Recruitment",
            "role_name": "Technical Trainer",
            "interview_date": datetime.now().strftime("%B %d, %Y at %I:%M %p"),
        }
        if variables:
            context.update(variables)

        # Build email body
        raw_body_content = custom_body if (custom_body and custom_body.strip()) else template.html_content

        # Render any Jinja2 double-bracket variables in the template/body
        try:
            jinja_tmpl = Template(raw_body_content)
            body = jinja_tmpl.render(**context)
        except Exception as e:
            logger.error(f"Failed to render Jinja2 email template: {e}")
            body = raw_body_content  # Fallback to unrendered text

        # 1. Create a "pending" log entry inside db
        email_log = CandidateEmail(
            candidate_id=candidate_id,
            recipient_email=candidate.email,
            subject=subject,
            body=body,
            template_type=template_type,
            email_status="pending",
            sent_by=sent_by,
        )
        email_log = await self._email_repo.create_email_log(email_log)

        if followup_date:
            await NotesService(self._session).create_note(
                candidate_id=candidate_id,
                note=f"Follow-up scheduled after email: {subject}",
                created_by=sent_by,
                followup_date=followup_date,
            )

        # 2. Queue sending task to asyncio queue worker
        await email_queue.put(
            {
                "email_id": email_log.id,
                "candidate_id": candidate_id,
                "candidate_name": candidate.name or "Candidate",
                "recipient_email": candidate.email,
                "subject": subject,
                "body": body,
                "template_name": template.template_name,
                "sent_by": sent_by,
            }
        )

        # 3. Log initial "enqueued" event inside candidate activity log
        await self._activity.log(
            candidate_id=candidate_id,
            action_type="email_queued",
            description=f"Enqueued {template.template_name} email to {candidate.name or candidate.email}.",
            created_by=sent_by,
        )

        return email_log
