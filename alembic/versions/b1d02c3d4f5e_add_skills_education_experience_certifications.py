"""add skills education experience certifications

Revision ID: b1d02c3d4f5e
Revises: a0c102a2468b
Create Date: 2026-05-27 15:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "b1d02c3d4f5e"
down_revision: Union[str, Sequence[str], None] = "a0c102a2468b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("candidates", sa.Column("skills", sa.JSON(), nullable=True))
    op.add_column("candidates", sa.Column("education", sa.JSON(), nullable=True))
    op.add_column("candidates", sa.Column("experience", sa.JSON(), nullable=True))
    op.add_column("candidates", sa.Column("certifications", sa.JSON(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("candidates", "certifications")
    op.drop_column("candidates", "experience")
    op.drop_column("candidates", "education")
    op.drop_column("candidates", "skills")
