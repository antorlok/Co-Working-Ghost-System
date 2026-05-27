"""add role column

Revision ID: a6fbc62be112
Revises: 4f8837bbbed7
Create Date: 2026-05-27 11:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = 'a6fbc62be112'
down_revision: Union[str, Sequence[str], None] = '4f8837bbbed7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'users',
        sa.Column('role', sa.String(length=50), nullable=False, server_default='member')
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'role')
