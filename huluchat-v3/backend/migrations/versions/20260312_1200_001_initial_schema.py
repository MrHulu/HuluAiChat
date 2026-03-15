"""Initial schema with all existing tables

Revision ID: 001_initial
Revises:
Create Date: 2026-03-12

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '001_initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create sessions table (includes source column from 004 migration)
    op.create_table(
        'sessions',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('folder_id', sa.String(), nullable=True),
        sa.Column('source', sa.String(), nullable=False, server_default='main'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_sessions_folder_id', 'sessions', ['folder_id'])
    op.create_index('ix_sessions_source', 'sessions', ['source'])

    # Create messages table (includes columns from 005 migration)
    op.create_table(
        'messages',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('session_id', sa.String(), nullable=False),
        sa.Column('role', sa.String(), nullable=False),
        sa.Column('content', sa.String(), nullable=False),
        sa.Column('images', sa.Text(), nullable=True),
        sa.Column('files', sa.Text(), nullable=True),
        sa.Column('model_id', sa.String(255), nullable=True),
        sa.Column('regenerated_from', sa.String(36), nullable=True),
        sa.Column('regenerated_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_messages_session_id', 'messages', ['session_id'])
    op.create_index('ix_messages_model_id', 'messages', ['model_id'])
    op.create_index('ix_messages_regenerated_from', 'messages', ['regenerated_from'])

    # Create folders table
    op.create_table(
        'folders',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    # Create prompt_templates table
    op.create_table(
        'prompt_templates',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('category', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    # Create session_tags table
    op.create_table(
        'session_tags',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('session_id', sa.String(), nullable=False),
        sa.Column('tag', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_session_tags_session_id', 'session_tags', ['session_id'])

    # Create message_bookmarks table
    op.create_table(
        'message_bookmarks',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('message_id', sa.String(), nullable=False),
        sa.Column('session_id', sa.String(), nullable=False),
        sa.Column('note', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_message_bookmarks_message_id', 'message_bookmarks', ['message_id'])
    op.create_index('ix_message_bookmarks_session_id', 'message_bookmarks', ['session_id'])


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_index('ix_message_bookmarks_session_id', 'message_bookmarks')
    op.drop_index('ix_message_bookmarks_message_id', 'message_bookmarks')
    op.drop_table('message_bookmarks')

    op.drop_index('ix_session_tags_session_id', 'session_tags')
    op.drop_table('session_tags')

    op.drop_table('prompt_templates')
    op.drop_table('folders')

    op.drop_index('ix_messages_regenerated_from', 'messages')
    op.drop_index('ix_messages_model_id', 'messages')
    op.drop_index('ix_messages_session_id', 'messages')
    op.drop_table('messages')

    op.drop_index('ix_sessions_source', 'sessions')
    op.drop_index('ix_sessions_folder_id', 'sessions')
    op.drop_table('sessions')
