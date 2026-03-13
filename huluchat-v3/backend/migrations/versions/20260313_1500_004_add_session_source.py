"""Add source column to sessions table

Revision ID: 004_add_session_source
Revises: 003_add_images_files
Create Date: 2026-03-13

This migration adds a 'source' column to track where the session was created:
- 'main': Created from main application window
- 'quickpanel': Created from QuickPanel (global shortcut)

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '004_add_session_source'
down_revision: Union[str, None] = '003_add_images_files'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add source column with default value 'main'
    op.add_column(
        'sessions',
        sa.Column('source', sa.String(), nullable=False, server_default='main')
    )
    # Create index for filtering by source
    op.create_index('ix_sessions_source', 'sessions', ['source'])


def downgrade() -> None:
    op.drop_index('ix_sessions_source', 'sessions')
    op.drop_column('sessions', 'source')
