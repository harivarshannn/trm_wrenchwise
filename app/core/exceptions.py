"""Custom exception types for API flow control."""

from __future__ import annotations

from typing import Any, Optional


class NotFoundError(Exception):
    """Raised when an entity is not found."""

    def __init__(self, message: str = "Resource not found.") -> None:
        super().__init__(message)
        self.message = message


class DuplicateCandidateError(Exception):
    """Raised when a duplicate candidate is detected."""

    def __init__(self, existing_candidate: Optional[dict[str, Any]] = None) -> None:
        super().__init__("Candidate already exists.")
        self.message = "Candidate already exists"
        self.existing_candidate = existing_candidate or {}
