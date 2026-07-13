"""add_missing_timestamps

Revision ID: e6a8adc22c37
Revises: e0debdaa6895
Create Date: 2026-07-13 14:44:22.088071

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e6a8adc22c37'
down_revision: Union[str, Sequence[str], None] = 'e0debdaa6895'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('diary', schema=None) as batch_op:
        batch_op.alter_column('created_at', existing_type=sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP'))
        batch_op.alter_column('updated_at', existing_type=sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP'))
        batch_op.create_index(batch_op.f('ix_diary_id'), ['id'], unique=False)

    with op.batch_alter_table('habits', schema=None) as batch_op:
        batch_op.add_column(sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')))

    with op.batch_alter_table('tasks', schema=None) as batch_op:
        batch_op.add_column(sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')))
        batch_op.add_column(sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')))

    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.alter_column('hashed_password', existing_type=sa.String(), nullable=False)


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.alter_column('hashed_password', existing_type=sa.String(), nullable=True)

    with op.batch_alter_table('tasks', schema=None) as batch_op:
        batch_op.drop_column('updated_at')
        batch_op.drop_column('created_at')

    with op.batch_alter_table('habits', schema=None) as batch_op:
        batch_op.drop_column('updated_at')

    with op.batch_alter_table('diary', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_diary_id'))
        batch_op.alter_column('updated_at', existing_type=sa.DateTime(), nullable=True)
        batch_op.alter_column('created_at', existing_type=sa.DateTime(), nullable=True)
