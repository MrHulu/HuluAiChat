"""Add composite indexes for common queries

Revision ID: 002_composite_indexes
Revises: 001_initial
Create Date: 2026-03-12

Performance optimization for:
- Messages: session_id + created_at (get messages by session, ordered by time)
- Session Tags: session_id + tag (check duplicate tags)
- Bookmarks: session_id + created_at (get bookmarks by session, ordered by time)
- Sessions: folder_id + updated_at (list sessions by folder, ordered by update time)
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '002_add_composite_indexes'
down_revision: Union[str, None] = '001_initial'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Messages: optimize session_id + created_at queries
    # Used for: fetching messages in a session, ordered by time
    op.create_index(
        'ix_messages_session_created',
        'messages',
        ['session_id', 'created_at']
    )

    # Session Tags: optimize session_id + tag queries
    # Used for: checking duplicate tags, listing tags by session
    op.create_index(
        'ix_session_tags_session_tag',
        'session_tags',
        ['session_id', 'tag']
    )

    # Bookmarks: optimize session_id + created_at queries
    # Used for: fetching bookmarks by session, ordered by time
    op.create_index(
        'ix_message_bookmarks_session_created',
        'message_bookmarks',
        ['session_id', 'created_at']
    )

    # Sessions: optimize folder_id + updated_at queries
    # Used for: listing sessions by folder, ordered by update time
    op.create_index(
        'ix_sessions_folder_updated',
        'sessions',
        ['folder_id', 'updated_at']
    )


def downgrade() -> None:
    op.drop_index('ix_sessions_folder_updated', 'sessions')
    op.drop_index('ix_message_bookmarks_session_created', 'message_bookmarks')
    op.drop_index('ix_session_tags_session_tag', 'session_tags')
    op.drop_index('ix_messages_session_created', 'messages')
