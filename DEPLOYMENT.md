# Deployment Guide: TRM Wrenchwise (Railway focus)

This document provides technical details for deploying the **TRM Wrenchwise** application to Railway using the Railway MCP or dashboard.

## 1. System Architecture
- **Backend**: FastAPI (Python 3.11)
- **Frontend**: Next.js (React 19)
- **Database**: PostgreSQL
- **Migrations**: Alembic (Asynchronous)

## 2. Infrastructure Requirements (Railway)
1. **PostgreSQL Service**: 
   - Add a "Database" -> "Add PostgreSQL" service to your project.
   - **CRITICAL**: The default `DATABASE_URL` provided by Railway starts with `postgresql://`. You **MUST** change this to `postgresql+asyncpg://` in the backend service variables.

2. **Backend Service**:
   - Source: Root directory of this repository.
   - Build: Automatic via `Dockerfile`.
   - Start Command: Handled by `railway.json` (`alembic upgrade head && uvicorn app.main:app ...`).

3. **Frontend Service**:
   - Source: `frontend` subdirectory.
   - Build: Next.js build.
   - Env Variable: `NEXT_PUBLIC_API_URL` (Points to the backend URL).

## 3. Required Environment Variables

### Backend Service
| Variable | Description | Example / Required Value |
| :--- | :--- | :--- |
| `DATABASE_URL` | Async Postgres Connection | `postgresql+asyncpg://postgres:pass@host:port/railway` |
| `JWT_SECRET` | Auth signing key | Any random 32+ character string |
| `GOOGLE_API_KEY` | OCR Service key | Your Google Cloud Vision API Key |
| `CORS_ORIGINS` | Whitelisted frontend | `https://your-frontend-url.up.railway.app` (or `*`) |
| `LOG_LEVEL` | Logging verbosity | `INFO` or `DEBUG` |
| `PORT` | Web server port | `8000` (Railway injects this automatically) |

### Frontend Service
| Variable | Description | Required Value |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Backend Endpoint | `https://your-backend-url.up.railway.app` |

## 4. Database Initialization
The application uses **Alembic** for schema management.
- The command `alembic upgrade head` is baked into the deployment start command.
- It will automatically create all tables (`candidates`, `emails`, `notes`, etc.) on the first deploy.
- If migrations fail, check the logs for "HealthCheck" errors.

## 5. Health Checks
- **Endpoint**: `/health`
- **Behavior**: This is a **deep health check**. It attempts to run `SELECT 1` against the database.
- **Troubleshooting**: If Railway shows "Service Unavailable" during deployment, it means the app started but cannot reach the database. Double-check the `+asyncpg` prefix in `DATABASE_URL`.

## 6. Deployment Command Checklist (for MCP Agent)
1. `railway login`
2. `railway link`
3. `railway add` (PostgreSQL)
4. `railway variables set DATABASE_URL=...` (Add `+asyncpg`)
5. `railway variables set JWT_SECRET=... GOOGLE_API_KEY=...`
6. `railway up`
