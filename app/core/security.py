"""JWT-ready security utilities (placeholder for future auth)."""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any, Dict


def create_access_token(payload: Dict[str, Any], expires_in_minutes: int = 60) -> Dict[str, Any]:
    """Prepare token payload with expiry (JWT signing to be added later)."""
    expiry = datetime.utcnow() + timedelta(minutes=expires_in_minutes)
    token_payload = payload.copy()
    token_payload["exp"] = int(expiry.timestamp())
    return token_payload
