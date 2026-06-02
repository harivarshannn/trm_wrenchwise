import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from app.models.candidate import Candidate
from app.models.job_opening import JobOpening
from app.utils.config import load_env

async def main():
    load_env()
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("DATABASE_URL not found")
        return

    engine = create_async_engine(db_url)
    AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with AsyncSessionLocal() as session:
        # Check Job Openings
        jobs_stmt = select(JobOpening)
        jobs_res = await session.execute(jobs_stmt)
        jobs = jobs_res.scalars().all()
        print("\n--- JOB OPENINGS ---")
        for j in jobs:
            print(f"ID: {j.id} | Title: {j.title} | Status: {j.status} | Vacancies: {j.vacancies}")

        # Check Candidates
        cand_stmt = select(Candidate)
        cand_res = await session.execute(cand_stmt)
        candidates = cand_res.scalars().all()
        print("\n--- CANDIDATES ---")
        for c in candidates:
            print(f"ID: {c.id} | Name: {c.name} | Email: {c.email} | Status: {c.status} | Job ID: {c.job_opening_id}")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
