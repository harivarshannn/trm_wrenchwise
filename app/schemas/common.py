"""Common response schemas."""

from __future__ import annotations

from typing import Generic, Optional, TypeVar

from pydantic import BaseModel
from pydantic.generics import GenericModel


T = TypeVar("T")


class APIResponse(GenericModel, Generic[T]):
    """Standard API response wrapper."""

    success: bool
    message: str
    data: Optional[T] = None
