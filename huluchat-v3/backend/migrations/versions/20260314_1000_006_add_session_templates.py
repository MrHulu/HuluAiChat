"""Add session_templates and custom_commands tables

Revision ID: 006_add_session_templates
Revises: 005_add_message_model_info
Create Date: 2026-03-14

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '006_add_session_templates'
down_revision: Union[str, None] = '005_add_message_model_info'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create session_templates table
    op.create_table(
        'session_templates',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('icon', sa.String(), nullable=True),
        sa.Column('system_prompt', sa.String(), nullable=True),
        sa.Column('default_model', sa.String(), nullable=True),
        sa.Column('temperature', sa.Float(), nullable=True),
        sa.Column('top_p', sa.Float(), nullable=True),
        sa.Column('max_tokens', sa.Integer(), nullable=True),
        sa.Column('mcp_servers', sa.String(), nullable=True),
        sa.Column('is_builtin', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    # Create custom_commands table
    op.create_table(
        'custom_commands',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('command_type', sa.String(), nullable=False, server_default='prompt'),
        sa.Column('prompt_content', sa.Text(), nullable=True),
        sa.Column('template_id', sa.String(), nullable=True),
        sa.Column('actions', sa.Text(), nullable=True),
        sa.Column('shortcut', sa.String(), nullable=True),
        sa.Column('icon', sa.String(), nullable=True),
        sa.Column('is_builtin', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('custom_commands')
    op.drop_table('session_templates')
