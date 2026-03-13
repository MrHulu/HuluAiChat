"""Add model_id, regenerated_from, regenerated_at to messages table

Revision ID: 005_add_message_model_info
Revises: 004_add_session_source
Create Date: 2026-03-13

This migration adds fields to support multi-model replay feature:
- model_id: The model used to generate this message (for AI messages)
- regenerated_from: Original message ID if this is a regenerated response
- regenerated_at: Timestamp when this message was regenerated

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '005_add_message_model_info'
down_revision: Union[str, None] = '004_add_session_source'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add model_id column - the model used to generate this message
    op.add_column(
        'messages',
        sa.Column('model_id', sa.String(255), nullable=True)
    )

    # Add regenerated_from column - original message ID if regenerated
    op.add_column(
        'messages',
        sa.Column('regenerated_from', sa.String(36), nullable=True)
    )

    # Add regenerated_at column - when the message was regenerated
    op.add_column(
        'messages',
        sa.Column('regenerated_at', sa.DateTime(), nullable=True)
    )

    # Create indexes for efficient queries
    op.create_index('ix_messages_model_id', 'messages', ['model_id'])
    op.create_index('ix_messages_regenerated_from', 'messages', ['regenerated_from'])


def downgrade() -> None:
    op.drop_index('ix_messages_regenerated_from', 'messages')
    op.drop_index('ix_messages_model_id', 'messages')
    op.drop_column('messages', 'regenerated_at')
    op.drop_column('messages', 'regenerated_from')
    op.drop_column('messages', 'model_id')
