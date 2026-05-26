"""Email and template database repository."""

from __future__ import annotations

import os
from typing import Optional, Sequence
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.candidate_email import CandidateEmail
from app.models.email_template import EmailTemplate


class EmailRepository:
    """Database access for emails and templates."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create_email_log(self, email: CandidateEmail) -> CandidateEmail:
        self._session.add(email)
        await self._session.commit()
        await self._session.refresh(email)
        return email

    async def update_email_status(self, email_id: uuid.UUID, status: str) -> Optional[CandidateEmail]:
        result = await self._session.execute(
            select(CandidateEmail).where(CandidateEmail.id == email_id)
        )
        email = result.scalar_one_or_none()
        if email:
            email.email_status = status
            await self._session.commit()
            await self._session.refresh(email)
        return email

    async def get_email_history_by_candidate(self, candidate_id: uuid.UUID) -> Sequence[CandidateEmail]:
        result = await self._session.execute(
            select(CandidateEmail)
            .where(CandidateEmail.candidate_id == candidate_id)
            .order_by(CandidateEmail.sent_at.desc())
        )
        return result.scalars().all()

    async def get_template_by_key(self, template_key: str) -> Optional[EmailTemplate]:
        result = await self._session.execute(
            select(EmailTemplate).where(EmailTemplate.template_key == template_key)
        )
        return result.scalar_one_or_none()

    async def list_templates(self) -> Sequence[EmailTemplate]:
        result = await self._session.execute(
            select(EmailTemplate).order_by(EmailTemplate.template_name.asc())
        )
        return result.scalars().all()

    async def seed_default_templates(self) -> None:
        """Seed pre-configured recruiter email templates if empty."""
        result = await self._session.execute(select(EmailTemplate).limit(1))
        if result.scalar_one_or_none() is not None:
            return  # Already seeded

        # Default templates definition
        defaults = [
            {
                "template_name": "Initial Outreach",
                "template_key": "initial_outreach",
                "subject": "Career Opportunity: Technical Trainer Role",
                "filename": "initial_outreach.html"
            },
            {
                "template_name": "Interview Invitation",
                "template_key": "interview_invitation",
                "subject": "Technical Interview Invitation: Trainer Position",
                "filename": "interview_invitation.html"
            },
            {
                "template_name": "Follow Up",
                "template_key": "follow_up",
                "subject": "Following up on your Application Status",
                "filename": "follow_up.html"
            },
            {
                "template_name": "Application Rejected",
                "template_key": "rejection",
                "subject": "Update on your Trainer Application",
                "filename": "rejection.html"
            },
            {
                "template_name": "Selection Offer",
                "template_key": "selection",
                "subject": "Congratulations! Offer for Trainer Position",
                "filename": "selection.html"
            }
        ]

        # Read template HTML from app/templates/emails/
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        templates_dir = os.path.join(base_dir, "templates", "emails")

        for tmpl in defaults:
            html_content = ""
            filepath = os.path.join(templates_dir, tmpl["filename"])
            if os.path.exists(filepath):
                with open(filepath, "r", encoding="utf-8") as f:
                    html_content = f.read()
            else:
                # Basic HTML fallback in case files are missing
                html_content = f"<html><body><p>Hello {{{{ candidate_name }}}},</p><p>This is a default template message.</p></body></html>"

            entity = EmailTemplate(
                template_name=tmpl["template_name"],
                template_key=tmpl["template_key"],
                subject=tmpl["subject"],
                html_content=html_content
            )
            self._session.add(entity)

        await self._session.commit()
