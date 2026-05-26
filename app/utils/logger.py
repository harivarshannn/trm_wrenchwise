"""Logging utilities for the application."""

from __future__ import annotations

import logging


def configure_logging(level: str) -> None:
    """Configure global logging settings."""
    logging.basicConfig(
        level=level.upper(),
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    )


def get_logger(name: str) -> logging.Logger:
    """Get a logger instance."""
    return logging.getLogger(name)
