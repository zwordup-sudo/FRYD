"""Add profile_focus to user

Revision ID: e0debdaa6895
Revises: 5f8b9ad18165
Create Date: 2026-06-21 20:40:02.122557

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e0debdaa6895'
down_revision: Union[str, Sequence[str], None] = '5f8b9ad18165'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('users', sa.Column('profile_focus', sa.String(), nullable=True, server_default='personal'))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'profile_focus')
