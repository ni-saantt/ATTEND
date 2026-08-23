# Attend – Attendance, Automated

AI-powered face recognition attendance system for educational institutions. Multi-tenant, scalable to 20,000+ students per college.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Scripts](#scripts)
- [API Reference](#api-reference)
- [Deployment](#deployment)
- [Documentation](#documentation)

---

## Overview

Attend automates attendance using:

- **Face recognition** (InsightFace + FAISS) for student identification
- **Live stream** and **photo** capture modes
- **Human verification** before saving attendance
- **Multi-tenant** hierarchy: Platform Owner → College → Super Admin → Department Admin → Teacher → Student

**Users:**

| App | Users | Purpose |
|-----|-------|---------|
| Mobile | Super Admin, Department Admin, Teacher | Enrollment, attendance capture, reports |
| Desktop | Platform Owner, College Admin | Create colleges, assign admins, manage departments/users |

---

## Architecture

```
Mobile App (Expo)     Desktop App (Electron)
        |                        |
        +-----------+------------+
                    |
              FastAPI Backend
                    |
        +-----------+-----------+
        |                       |
   Face Recognition        PostgreSQL
   (InsightFace+FAISS)     (Supabase)
        |                       |
        +-----------+-----------+
                    |
            Supabase Storage
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Mobile | React Native, Expo, TypeScript, Zustand, TanStack Query, MMKV |
| Desktop | Electron, React, TypeScript, Zustand, TanStack Query |
| Backend | FastAPI, Uvicorn, Python 3.11 |
| Face | InsightFace (RetinaFace + ArcFace), FAISS |
| Database | PostgreSQL (Supabase) |
| Storage | Supabase Storage |
| Build | Turborepo, npm workspaces |

---

## Project Structure

```
Attend/
├── apps/
│   ├── mobile/           # React Native + Expo
│   ├── admin-desktop/    # Electron + React (college admin)
│   └── backend/          # FastAPI + InsightFace + FAISS
├── packages/
│   └── shared/           # Types, Zod schemas, API constants
├── turbo.json
├── package.json
├── docker-compose.yml
└── README.md
```

---

## Prerequisites

- Node.js 18+
- Python 3.11+
- Supabase account
- (Optional) Docker for backend deployment

---

## Quick Start

### 1. Clone and install

```bash
git clone <repo-url>
cd Attend
npm install
```

### 2. Supabase setup

1. Create a project at [supabase.com](https://supabase.com)
2. Run migrations in order: `001_initial_schema.sql` through `007_college_logos_bucket.sql` (or use Supabase CLI)
3. Storage buckets `primary-faces`, `attendance-crops`, and `college-logos` are created by migrations 007 and 009.
4. Copy `apps/backend/.env.example` to `apps/backend/.env`

### 3. Seed platform admin

```bash
cd apps/backend
python -c "from passlib.hash import bcrypt; print(bcrypt.hash('your-password'))"
```

Then in Supabase SQL editor:

```sql
INSERT INTO users (email, password_hash, role, college_id, department_id)
VALUES ('admin@attend.com', '<hash-from-above>', 'PLATFORM_ADMIN', NULL, NULL);
```

### 4. Run services

**One command (recommended)** — starts backend, mobile, admin-desktop, and shared TypeScript watch via Turborepo:

```bash
npm run dev
```

This opens the Turbo TUI in one terminal. Press `Ctrl+C` to stop all services.

Verify backend: [http://localhost:8000/docs](http://localhost:8000/docs)

**Optional — run individually** (for debugging one app):

```bash
npm run backend   # FastAPI only
npm run mobile    # Expo only
npm run desktop   # Electron admin only
```

---

## Configuration

| Variable | App | Description |
|----------|-----|-------------|
| `EXPO_PUBLIC_API_URL` | Mobile | Backend URL (default: http://localhost:8000) |
| `VITE_API_URL` | Desktop | Backend URL |
| `SUPABASE_URL` | Backend | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Backend | Supabase service role key |
| `JWT_SECRET` | Backend | Secret for JWT signing |

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Build all apps (shared → mobile, desktop) |
| `npm run build:shared` | Build shared package only |
| `npm run build:mobile` | Build mobile (expo export) |
| `npm run build:desktop` | Build desktop (Vite) |
| `npm run dev` | Start all dev servers (backend + mobile + desktop + shared) via Turbo TUI |
| `npm run mobile` | Start Expo dev server |
| `npm run desktop` | Start Electron + Vite dev |
| `npm run backend` | Start FastAPI with uvicorn |

---

## API Reference

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/v1/auth/login` | POST | - | Login, returns JWT |
| `/api/v1/colleges` | POST, GET | Platform Admin | Create/list colleges |
| `/api/v1/users` | POST, GET | Admin roles | Create/list users |
| `/api/v1/departments` | POST, GET | Super Admin | Create/list departments |
| `/api/v1/subjects` | POST, GET | Dept Admin, Teacher | Create/list subjects |
| `/api/v1/students` | GET | Admin, Teacher | List students |
| `/api/v1/students/enroll` | POST | Dept Admin | Enroll student (3 face images) |
| `/api/v1/recognize` | POST | Teacher | Single image recognition |
| `/api/v1/recognize/stream` | POST | Teacher | Live stream frame |
| `/api/v1/attendance` | POST | Teacher | Confirm and save attendance |
| `/api/v1/attendance/report` | GET | Teacher, Admin | Excel report |

Docs: `http://localhost:8000/docs` when backend is running.

---

## Deployment

- **Backend:** Docker + AWS EC2 (see `apps/backend/Dockerfile`, `docker-compose.yml`)
- **Database:** Supabase (managed PostgreSQL)
- **Mobile:** EAS Build for APK (`eas build --platform android`)
- **Desktop:** `npm run build:electron` in admin-desktop for Windows installer

---

## Documentation

- [Software Documentation](docs/SOFTWARE_DOCUMENTATION.md) – Full technical specification (Markdown)
- [Manual Test Plan (Markdown)](docs/testing/TEST_MANUAL.md) – Detailed QA workbook with checkboxes
- [Manual Test Plan (PDF)](docs/testing/TEST_MANUAL.pdf) – Printable test manual
- [Enrollment Practical Test (Markdown)](docs/testing/ENROLLMENT_PRACTICAL_TEST.md) – Scale enrollment & hands-on workbook
- [Enrollment Practical Test (PDF)](docs/testing/ENROLLMENT_PRACTICAL_TEST.pdf) – 50-student batch log + recognition checks
- [Test Environment Setup](docs/testing/TEST_ENV_SETUP.md) – Pre-test checklist
- GitHub Issues → New issue – Clickable test-run checklists (enrollment, full QA, env setup)
- [Section Management PDF](docs/latex/section-management/main.pdf) – Detailed section management guide
- [Section Management LaTeX source](docs/latex/section-management/main.tex) – Rebuild with `./build.sh`
- [System Architecture](docs/SYSTEM_ARCHITECTURE.md) – Architecture diagrams
- [Deployment Guide](docs/DEPLOYMENT.md) – Production deployment
- [Database schema](apps/backend/supabase/migrations/001_initial_schema.sql) – Tables, indexes, foreign keys

---

## License

Private. All rights reserved.
