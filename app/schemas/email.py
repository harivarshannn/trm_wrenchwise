"""Email Pydantic schemas."""

from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class EmailSendRequest(BaseModel):
    """Payload to send an email to a candidate."""

    candidate_id: uuid.UUID
    template_type: str = Field(..., description="Key of the email template to use (e.g. interview_invitation)")
    custom_subject: Optional[str] = Field(default=None, max_length=255)
    custom_body: Optional[str] = Field(default=None, description="Optional custom rich text message to inject or use as body")
    variables: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Variables to render the Jinja2 template with")
    followup_date: Optional[date] = None


class EmailTemplateRead(BaseModel):
    """Email template serialization."""

    id: uuid.UUID
    template_name: str
    template_key: str
    subject: str
    html_content: str

    class Config:
        from_attributes = True


class EmailHistoryRead(BaseModel):
    """Email communication log history serialization."""

    id: uuid.UUID
    candidate_id: uuid.UUID
    recipient_email: str
    subject: str
    body: str
    template_type: Optional[str] = None
    email_status: str
    sent_by: Optional[str] = None
    sent_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True
