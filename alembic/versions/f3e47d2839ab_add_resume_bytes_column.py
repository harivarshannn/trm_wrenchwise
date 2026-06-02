"""add_resume_bytes_column

Revision ID: f3e47d2839ab
Revises: e2b47d2839aa
Create Date: 2026-06-02 10:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f3e47d2839ab'
down_revision: Union[str, Sequence[str], None] = 'e2b47d2839aa'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('candidates', sa.Column('resume_bytes', sa.LargeBinary(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('candidates', 'resume_bytes')
