"""add_vacancies_to_job_openings

Revision ID: f4e47d2839ac
Revises: f3e47d2839ab
Create Date: 2026-06-02 11:25:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f4e47d2839ac'
down_revision: Union[str, Sequence[str], None] = 'f3e47d2839ab'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('job_openings', sa.Column('vacancies', sa.Integer(), nullable=False, server_default='1'))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('job_openings', 'vacancies')
