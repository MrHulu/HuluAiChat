"""Add images and files columns to messages

Revision ID: 003_add_images_files
Revises: 002_add_composite_indexes
Create Date: 2026-03-12

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '003_add_images_files'
down_revision: Union[str, None] = '002_add_composite_indexes'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add images and files columns to messages table
    with op.batch_alter_table('messages') as batch_op:
        batch_op.add_column(sa.Column('images', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('files', sa.Text(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('messages') as batch_op:
        batch_op.drop_column('files')
        batch_op.drop_column('images')
