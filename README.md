# CareerPilot AI

CareerPilot AI is a local-first career operating system for managing a professional profile, discovering jobs, and generating tailored CV content. The current phase combines a FastAPI backend, a Next.js frontend, and a Supabase-ready database schema for future persistence and AI-powered workflows.

## What is included

- A rich profile editor with local persistence
- A jobs discovery experience with match scoring
- A dashboard with profile and opportunity metrics
- A CV generator that turns saved profile data into an ATS-friendly draft
- Backend health and jobs endpoints plus a starter database schema

## Project structure

```text
careerpilot-ai/
├── backend/
│   ├── app/
│   └── requirements.txt
├── database/
├── frontend/
│   ├── app/
│   └── package.json
└── README.md
```

## Prerequisites

- Python 3.11+
- Node.js 20+
- npm

## 1. Backend setup

```bash
cd backend
python -m venv .venv
```

Activate the environment:

Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

macOS/Linux:

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Copy the example environment file and adjust values locally:

```bash
cp .env.example .env
```

Run the backend:

```bash
uvicorn app.main:app --reload
```

Useful URLs:

- Backend: http://localhost:8000
- API docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

### Backend environment variables

- APP_NAME
- APP_ENV
- FRONTEND_URL
- DATABASE_URL
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- OPENAI_API_KEY

## 2. Frontend setup

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Frontend URL:

```text
http://localhost:3000
```

## 3. Database

Open the Supabase SQL editor and run the schema from:

```text
database/schema.sql
```

## Verification commands

Run the backend tests:

```bash
python -m pytest backend/tests -q
```

Build the frontend:

```bash
npm --prefix frontend run build
```

## Backup and deployment notes

- Keep real secrets in local environment files only; they are ignored by Git.
- Example files such as .env.example and .env.local.example are safe to commit and should contain placeholders rather than live secrets.
- For deployment, move sensitive values into managed environment variables or a secrets store.
