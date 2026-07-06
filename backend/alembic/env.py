"""
Alembic environment configuration for BhartX Academy.

This file connects Alembic to:
1. The DATABASE_URL from the app's settings (respects .env in dev, env vars in prod)
2. The SQLAlchemy Base metadata from our models (for autogenerate)

Usage:
  # Generate a new migration after changing models:
  alembic revision --autogenerate -m "describe your change"

  # Apply all pending migrations:
  alembic upgrade head

  # Rollback one migration:
  alembic downgrade -1
"""
import sys
import os
from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# ── Make app importable from alembic directory ────────────────────────────────
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# ── Import app settings and models ────────────────────────────────────────────
from app.core.config import settings
from app.db.session import Base

# Import all models so Alembic autogenerate can detect them
from app.models import all_models  # noqa: F401 — must import to register with Base.metadata

# this is the Alembic Config object
config = context.config

# Override sqlalchemy.url from our app settings (reads DATABASE_URL env var)
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Target metadata for --autogenerate
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode (no DB connection needed, outputs SQL)."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode (connects to the database)."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            # Compare server defaults so Alembic detects default value changes
            compare_server_default=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
