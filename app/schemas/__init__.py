"""Pydantic schema package."""

from app.schemas.candidate import CandidateCreate, CandidateRead, CandidateUpdateStatus
from app.schemas.note import NoteCreate, NoteRead, NoteUpdate
from app.schemas.activity import ActivityLogRead
from app.schemas.common import APIResponse
from app.schemas.pagination import PaginationMeta

__all__ = [
    "CandidateCreate",
    "CandidateRead",
    "CandidateUpdateStatus",
    "NoteCreate",
    "NoteRead",
    "NoteUpdate",
    "ActivityLogRead",
    "APIResponse",
    "PaginationMeta",
]
