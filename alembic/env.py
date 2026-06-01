import asyncio
import os
from logging.config import fileConfig

from sqlalchemy import pool, text
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config, create_async_engine

from alembic import context

# Import models to ensure they are registered with Base.metadata
from app.db.base import Base
import app.models  # noqa
from app.utils.config import load_env
load_env()

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
target_metadata = Base.metadata

def get_url():
    url = os.getenv("DATABASE_URL")
    if not url:
        # Fallback to config, but warn if it's the placeholder
        url = config.get_main_option("sqlalchemy.url")
        if "driver://" in url:
            raise ValueError(
                "DATABASE_URL environment variable is missing and alembic.ini "
                "contains the default placeholder. Please set DATABASE_URL."
            )
    # Convert internal Render DB URL to external if running locally
    if url and not os.getenv("RENDER"):
        import re
        if "@dpg-" in url and ".render.com" not in url:
            url = re.sub(
                r'@(dpg-[a-z0-9]+-a)(?=[:/])',
                r'@\1.oregon-postgres.render.com',
                url
            )
            if "ssl=require" not in url:
                separator = "&" if "?" in url else "?"
                url = f"{url}{separator}ssl=require"
    print("Resolved DATABASE_URL for migration:", url)
    return url

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    url = get_url()
    
    # We create the engine directly to ensure we use the correct URL
    # and handle async driver nuances.
    connectable = create_async_engine(
        url,
        poolclass=pool.NullPool,
        connect_args={"ssl": True} if "ssl=require" in url or "render.com" in url else {}
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""

    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
