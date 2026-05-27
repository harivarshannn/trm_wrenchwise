"""add new candidate columns

Revision ID: a0c102a2468b
Revises: 9b1b5e6dfc4a
Create Date: 2026-05-27 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a0c102a2468b"
down_revision: Union[str, Sequence[str], None] = "9b1b5e6dfc4a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("candidates", sa.Column("location", sa.String(length=255), nullable=True))
    op.add_column("candidates", sa.Column("engagement_mode", sa.String(length=50), nullable=True))
    op.add_column("candidates", sa.Column("salary_expectations", sa.String(length=255), nullable=True))
    op.add_column("candidates", sa.Column("availability", sa.String(length=255), nullable=True))
    op.add_column("candidates", sa.Column("resume_url", sa.Text(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("candidates", "resume_url")
    op.drop_column("candidates", "availability")
    op.drop_column("candidates", "salary_expectations")
    op.drop_column("candidates", "engagement_mode")
    op.drop_column("candidates", "location")
