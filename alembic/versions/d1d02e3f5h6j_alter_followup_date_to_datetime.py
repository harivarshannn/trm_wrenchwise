"""alter followup_date to datetime

Revision ID: d1d02e3f5h6j
Revises: c1d02e3f4g5h
Create Date: 2026-05-27 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "d1d02e3f5h6j"
down_revision: Union[str, Sequence[str], None] = "c1d02e3f4g5h"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.alter_column(
        "candidate_notes",
        "followup_date",
        existing_type=sa.Date(),
        type_=sa.DateTime(timezone=True),
        existing_nullable=True,
        postgresql_using="followup_date::timestamp with time zone"
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column(
        "candidate_notes",
        "followup_date",
        existing_type=sa.DateTime(timezone=True),
        type_=sa.Date(),
        existing_nullable=True,
        postgresql_using="followup_date::date"
    )
