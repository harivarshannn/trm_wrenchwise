"""create users table

Revision ID: c1d02e3f4g5h
Revises: b1d02c3d4f5e
Create Date: 2026-05-27 16:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "c1d02e3f4g5h"
down_revision: Union[str, Sequence[str], None] = "b1d02c3d4f5e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("username", sa.String(length=255), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=50), nullable=False, server_default="admin"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index(op.f("ix_users_username"), "users", ["username"], unique=True)

    # Seed superadmin
    import uuid
    user_id = str(uuid.uuid4())
    op.execute(
        f"INSERT INTO users (id, username, password_hash, role, is_active, created_at, updated_at) "
        f"VALUES ('{user_id}', 'wrenchwise', 'e461f5b045e3d7a8b9f0e1d2c3b4a59f:b2a656636dbcbae61071f4ca7dcba10c9ed9787ad72ab8decbcddfce94e59110', 'superior_admin', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f("ix_users_username"), table_name="users")
    op.drop_table("users")
