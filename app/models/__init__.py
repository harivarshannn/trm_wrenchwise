"""Domain models package."""

from app.models.candidate import Candidate, CandidateStatus
from app.models.note import CandidateNote
from app.models.activity import CandidateActivityLog
from app.models.candidate_email import CandidateEmail
from app.models.email_template import EmailTemplate

__all__ = [
    "Candidate",
    "CandidateStatus",
    "CandidateNote",
    "CandidateActivityLog",
    "CandidateEmail",
    "EmailTemplate",
]
