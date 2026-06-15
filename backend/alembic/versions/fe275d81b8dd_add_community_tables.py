"""add_community_tables

Revision ID: fe275d81b8dd
Revises: 19c7700178a8
Create Date: 2026-06-04 11:31:34.019312

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fe275d81b8dd'
down_revision: Union[str, Sequence[str], None] = '19c7700178a8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create clubs
    op.create_table(
        'clubs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('invite_code', sa.String(length=50), nullable=False),
        sa.Column('owner_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_clubs_id'), 'clubs', ['id'], unique=False)
    op.create_index(op.f('ix_clubs_invite_code'), 'clubs', ['invite_code'], unique=True)

    # Create club_members
    op.create_table(
        'club_members',
        sa.Column('club_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('role', sa.String(length=20), nullable=False),
        sa.Column('points_earned', sa.Integer(), nullable=False),
        sa.Column('joined_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['club_id'], ['clubs.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('club_id', 'user_id')
    )

    # Create club_tasks
    op.create_table(
        'club_tasks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('club_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('task_type', sa.String(length=50), nullable=False),
        sa.Column('xp_reward', sa.Integer(), nullable=False),
        sa.Column('due_date', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['club_id'], ['clubs.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_club_tasks_id'), 'club_tasks', ['id'], unique=False)

    # Create club_task_completions
    op.create_table(
        'club_task_completions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('club_task_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('completed_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['club_task_id'], ['club_tasks.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_club_task_completions_id'), 'club_task_completions', ['id'], unique=False)

    # Create club_feed_messages
    op.create_table(
        'club_feed_messages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('club_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('is_achievement', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['club_id'], ['clubs.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_club_feed_messages_id'), 'club_feed_messages', ['id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_club_feed_messages_id'), table_name='club_feed_messages')
    op.drop_table('club_feed_messages')
    op.drop_index(op.f('ix_club_task_completions_id'), table_name='club_task_completions')
    op.drop_table('club_task_completions')
    op.drop_index(op.f('ix_club_tasks_id'), table_name='club_tasks')
    op.drop_table('club_tasks')
    op.drop_table('club_members')
    op.drop_index(op.f('ix_clubs_invite_code'), table_name='clubs')
    op.drop_index(op.f('ix_clubs_id'), table_name='clubs')
    op.drop_table('clubs')
