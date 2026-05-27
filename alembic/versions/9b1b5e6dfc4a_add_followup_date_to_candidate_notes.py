"""add_followup_date_to_candidate_notes

Revision ID: 9b1b5e6dfc4a
Revises: 6c9572582827
Create Date: 2026-05-27 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "9b1b5e6dfc4a"
down_revision: Union[str, Sequence[str], None] = "6c9572582827"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("candidate_notes", sa.Column("followup_date", sa.Date(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("candidate_notes", "followup_date")
