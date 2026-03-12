#!/usr/bin/env python
"""
Database migration CLI for HuluChat.

Usage:
    python migrate.py upgrade      # Upgrade to latest version
    python migrate.py downgrade    # Downgrade one version
    python migrate.py current      # Show current version
    python migrate.py history      # Show migration history
    python migrate.py revision -m "description"  # Create new migration
    python migrate.py autogenerate -m "description"  # Auto-generate migration
"""
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from alembic.config import Config
from alembic import command
from core.config import settings


def get_alembic_config():
    """Get Alembic configuration."""
    alembic_cfg = Config("alembic.ini")
    alembic_cfg.set_main_option("sqlalchemy.url", settings.database_url)
    return alembic_cfg


def upgrade():
    """Upgrade to latest version."""
    alembic_cfg = get_alembic_config()
    command.upgrade(alembic_cfg, "head")
    print("Database upgraded to latest version.")


def downgrade():
    """Downgrade one version."""
    alembic_cfg = get_alembic_config()
    command.downgrade(alembic_cfg, "-1")
    print("Database downgraded by one version.")


def current():
    """Show current version."""
    alembic_cfg = get_alembic_config()
    command.current(alembic_cfg)


def history():
    """Show migration history."""
    alembic_cfg = get_alembic_config()
    command.history(alembic_cfg)


def revision(message: str):
    """Create new empty migration."""
    alembic_cfg = get_alembic_config()
    command.revision(alembic_cfg, message=message)
    print(f"Created new migration: {message}")


def autogenerate(message: str):
    """Auto-generate migration from model changes."""
    alembic_cfg = get_alembic_config()
    command.revision(alembic_cfg, message=message, autogenerate=True)
    print(f"Auto-generated migration: {message}")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    cmd = sys.argv[1]

    if cmd == "upgrade":
        upgrade()
    elif cmd == "downgrade":
        downgrade()
    elif cmd == "current":
        current()
    elif cmd == "history":
        history()
    elif cmd == "revision":
        if len(sys.argv) < 4 or sys.argv[2] != "-m":
            print("Usage: python migrate.py revision -m 'description'")
            sys.exit(1)
        revision(sys.argv[3])
    elif cmd == "autogenerate":
        if len(sys.argv) < 4 or sys.argv[2] != "-m":
            print("Usage: python migrate.py autogenerate -m 'description'")
            sys.exit(1)
        autogenerate(sys.argv[3])
    else:
        print(f"Unknown command: {cmd}")
        print(__doc__)
        sys.exit(1)


if __name__ == "__main__":
    main()
