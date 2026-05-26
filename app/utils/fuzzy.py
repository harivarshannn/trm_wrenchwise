"""Fuzzy matching helpers for duplicate detection."""

from __future__ import annotations

from difflib import SequenceMatcher


def similarity_ratio(a: str, b: str) -> float:
    """Compute similarity ratio between two strings."""
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()


def partial_phone_match(a: str, b: str) -> bool:
    """Check if the last 6 digits match for phone numbers."""
    digits_a = "".join(ch for ch in a if ch.isdigit())
    digits_b = "".join(ch for ch in b if ch.isdigit())
    if len(digits_a) < 6 or len(digits_b) < 6:
        return False
    return digits_a[-6:] == digits_b[-6:]
