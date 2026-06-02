import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from app.models.user import User
from app.utils.config import load_env

async def main():
    load_env()
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("DATABASE_URL not found")
        return

    # Use sync sqlite wrapper if local development
    if db_url.startswith("sqlite"):
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker as sync_sessionmaker
        engine = create_engine(db_url)
        SessionLocal = sync_sessionmaker(bind=engine)
        with SessionLocal() as session:
            users = session.execute(select(User)).scalars().all()
            print("\n--- REGISTERED USERS ---")
            for u in users:
                print(f"Username: {u.username} | Role: {u.role} | Active: {u.is_active}")
        return

    engine = create_async_engine(db_url)
    AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with AsyncSessionLocal() as session:
        users_res = await session.execute(select(User))
        users = users_res.scalars().all()
        print("\n--- REGISTERED USERS ---")
        for u in users:
            print(f"Username: {u.username} | Role: {u.role} | Active: {u.is_active}")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
