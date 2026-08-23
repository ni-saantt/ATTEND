# Attend — Software Documentation

**Version:** 1.0.0  
**Project:** Attend — AI Face Recognition Attendance System  
**Repository:** https://github.com/nrk018/Attend  
**Document Type:** Technical Software Specification

---

## 1. Executive Summary

**Attend** is a multi-tenant, AI-powered attendance management platform for educational institutions. It automates student identification using face recognition (InsightFace + FAISS), with human verification before attendance is saved. The system supports live camera and single-photo capture modes, hierarchical role-based access, section/subject management, and exportable attendance reports.

The platform was **tested with over 100 students in a real classroom environment**, validating enrollment, recognition, and end-to-end attendance workflows under practical conditions.

---

## 2. Introduction

### 2.1 Purpose

Manual roll call is slow, error-prone, and vulnerable to proxy attendance. Attend replaces this with automated face recognition while keeping a teacher confirmation step for reliability and auditability.

### 2.2 Scope

The system covers:

- Organizational provisioning (colleges, departments, users, subjects)
- Student enrollment with multi-pose face capture
- Face recognition–based attendance (live stream and photo)
- Section-based student grouping
- Attendance reporting (PDF/Excel)
- Multi-tenant isolation at the college level

Students do not log in; they are enrolled and marked present by staff.

### 2.3 Target Users

| Application | Users | Primary Functions |
|---|---|---|
| Mobile (Expo) | Super Admin, Department Admin, Teacher | Enrollment, attendance, reports, section management |
| Desktop (Electron) | Platform Owner, College Admin | College/department/user provisioning |
| Backend API | All clients | Auth, ML, data persistence, reports |

---

## 3. System Architecture

### 3.1 High-Level Architecture

Attend follows a **three-tier client–server architecture**:

```
Mobile App (Expo)     Desktop App (Electron)
        |                        |
        +-----------+------------+
                    |
              FastAPI Backend (:8000)
                    |
        +-----------+-----------+
        |                       |
   Face Recognition        PostgreSQL
   (InsightFace + FAISS)     (Supabase)
        |                       |
        +-----------+-----------+
                    |
            Supabase Storage
```

### 3.2 Architectural Layers

**Client Layer**  
React Native mobile app and Electron desktop app capture images, manage UI state, and call the REST API over HTTPS with JWT authentication.

**Application Layer**  
FastAPI backend exposes modular REST endpoints, enforces RBAC, and orchestrates business logic through service modules.

**ML Layer**  
InsightFace `buffalo_l` (RetinaFace + ArcFace) extracts 512-dimensional face embeddings. FAISS performs per-college vector similarity search.

**Data Layer**  
Supabase PostgreSQL stores relational data; Supabase Storage holds enrollment images, attendance crops, and college logos.

**Shared Layer**  
The `@attend/shared` package provides API endpoint constants, Zod validation schemas, role definitions, and TypeScript types used by both clients.

### 3.3 Monorepo Structure

```
Attend/
├── apps/
│   ├── mobile/           # React Native + Expo
│   ├── admin-desktop/    # Electron + React
│   └── backend/          # FastAPI + InsightFace + FAISS
├── packages/
│   └── shared/           # Types, Zod schemas, API constants
├── docs/                 # Architecture & deployment docs
├── scripts/              # Dev setup utilities
├── turbo.json
├── docker-compose.yml
└── package.json
```

Build orchestration uses **Turborepo** and **npm workspaces**.

---

## 4. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Mobile | React Native 0.81, Expo SDK 54 | Cross-platform iOS/Android |
| Mobile | Expo Router, Expo Camera | Navigation and face capture |
| Mobile | Zustand, TanStack Query, MMKV | State, caching, persistence |
| Desktop | Electron, React 19, Vite | Admin desktop shell |
| Backend | FastAPI, Uvicorn, Python 3.11 | REST API and services |
| ML | InsightFace `buffalo_l`, ONNX Runtime | Face detection and embedding |
| ML | FAISS (IndexFlatIP), OpenCV, NumPy | Vector search and image processing |
| Database | PostgreSQL (Supabase) | Relational data |
| Storage | Supabase Storage | Image assets |
| Auth | JWT (HS256), bcrypt | Stateless authentication |
| Reports | fpdf2, openpyxl, pandas | PDF and Excel generation |
| CI/CD | GitHub Actions | Build pipeline |
| Deployment | Docker, Docker Compose | Containerized backend |

---

## 5. Role Hierarchy and Access Control

### 5.1 Role Hierarchy

```
Platform Owner (PLATFORM_ADMIN)
    └── College Super Admin (SUPER_ADMIN)
            └── Department Admin (DEPARTMENT_ADMIN)
                    └── Teacher (TEACHER)
                            └── Student (no login)
```

### 5.2 Role Capabilities

| Capability | Platform Admin | Super Admin | Dept Admin | Teacher |
|---|---|---|---|---|
| Create colleges | ✓ (Desktop) | — | — | — |
| Create super admins | ✓ | — | — | — |
| Create dept admins | — | ✓ | — | — |
| Create teachers | — | ✓ | ✓ | — |
| Enroll students | — | ✓ | ✓ | ✓ |
| Manage sections | — | ✓ | ✓ | — |
| Take attendance | — | ✓ | ✓ | ✓ |
| View/download reports | — | ✓ | ✓ | ✓ |

Authorization is enforced server-side via FastAPI dependency injectors (`require_platform_admin`, `require_super_admin`, `require_dept_admin`, `require_teacher`) that validate JWT tokens and role claims on every protected endpoint.

---

## 6. Core Functional Modules

### 6.1 Student Enrollment

**Flow:**

1. Admin/teacher enters student details (reg no, name, college, department).
2. Mobile camera captures **three face poses**: front, left, right.
3. Backend decodes images, detects faces (`det_score > 0.5`), and extracts 512-d ArcFace embeddings.
4. Images are uploaded to Supabase Storage (`primary-faces` bucket).
5. Student record and three embeddings (front, left, right) are inserted into PostgreSQL.
6. Per-college FAISS index cache is invalidated.

**Storage path pattern:** `{college_id}/{student_id}/primary.jpg`, `left.jpg`, `right.jpg`

### 6.2 Attendance Capture

**Modes:**

- **Single photo:** One image sent to `/api/v1/recognize`; results returned for teacher confirmation.
- **Live stream:** Session started via `/recognize/stream/start`; frames sent to `/recognize/stream`; session ended via `/recognize/stream/end`. Duplicate student matches within a session are suppressed.

**Recognition pipeline:**

1. Load or build per-college FAISS index from stored embeddings.
2. Detect faces and extract query embeddings.
3. Search FAISS with cosine similarity (L2-normalized inner product).
4. Filter by similarity threshold (default: 0.5, configurable via `RECOGNITION_THRESHOLD`).
5. Scope matches to section or subject enrollment.
6. Return match results with confidence, bounding box, face crop (base64), and reference image URL.

**Human verification:** Teacher reviews matches and confirms before saving via `/api/v1/attendance`.

### 6.3 Attendance Storage

On confirmation:

- Attendance record inserted with student, subject, section, date, timestamp, confidence.
- Face crop uploaded to `attendance-crops` bucket.
- Record available for listing and report generation.

### 6.4 Section Management

Sections subdivide subjects (e.g., "Section A", "Section B"):

- Department admins create sections and assign teachers.
- Teachers/admins assign students to sections.
- Attendance and recognition can be scoped to a specific section.
- Migration `002` enforces one section per student per subject.

### 6.5 Reporting

Teachers and admins can:

- List subjects with attendance data.
- View attendance records by subject/section.
- Export reports as **PDF** or **Excel**.

---

## 7. Machine Learning Pipeline

### 7.1 Model

| Component | Model | Purpose |
|---|---|---|
| Detection | RetinaFace (`det_10g.onnx`) | Locate faces in image |
| Recognition | ArcFace (`w600k_r50.onnx`) | 512-d embedding extraction |
| Model pack | InsightFace `buffalo_l` | Bundled pretrained weights |

**Training datasets (pretrained, not custom-trained):**

- WIDER FACE (~393K labeled faces) for detection
- WebFace600K (~600K identities, ~12M images) for recognition

### 7.2 Inference

- Executed via **ONNX Runtime** with auto-detected providers:
  - macOS → CoreML
  - Linux → CUDA (if available)
  - Fallback → CPU
- Detection size: 640×640
- Minimum detection score: 0.5

### 7.3 Vector Search

- Embeddings stored as 512-d vectors in PostgreSQL.
- Per-college **FAISS IndexFlatIP** built in memory (L2-normalized for cosine similarity).
- Thread-safe in-memory cache with invalidation on enrollment/update.
- Search deduplicates multiple embeddings per student, keeping the best score.

### 7.4 Performance Characteristics

| Metric | Value |
|---|---|
| Feature extraction (CPU) | ~45–80 ms/frame |
| FAISS search | Sub-millisecond |
| Recognition accuracy (LFW, inherited) | ~99.8% |
| End-to-end latency (CPU) | <100 ms/face |
| Designed scale | 20,000+ students/college |

---

## 8. Data Model

### 8.1 Core Entities

| Table | Key Fields | Description |
|---|---|---|
| `colleges` | id, name | Top-level tenant |
| `departments` | id, college_id, name | Department within college |
| `users` | id, email, password_hash, role, college_id, department_id | Staff accounts |
| `subjects` | id, department_id, name | Academic subjects |
| `students` | id, reg_no, name, college_id, department_id, primary_image_url | Enrolled students |
| `face_embeddings` | id, student_id, embedding (512-d), pose | Face vectors |
| `attendance` | id, student_id, subject_id, section_id, attendance_date, confidence, face_crop_url | Attendance records |
| `sections` | id, subject_id, name | Subject sections |
| `section_teachers` | section_id, teacher_id | Teacher–section mapping |
| `section_students` | section_id, student_id | Student–section mapping |
| `subject_students` | subject_id, student_id | Subject enrollment |
| `subject_teachers` | subject_id, teacher_id | Subject–teacher mapping |

### 8.2 Storage Buckets

| Bucket | Path Pattern | Purpose |
|---|---|---|
| `primary-faces` | `{college_id}/{student_id}/primary.jpg` | Enrollment images |
| `attendance-crops` | `attendance/{subject_id}/{student_id}/{uuid}.jpg` | Attendance snapshots |
| `college-logos` | `{college_id}/logo.{ext}` | College branding |

---

## 9. API Reference

**Base URL:** `http://localhost:8000` (dev)  
**Interactive docs:** `/docs` (Swagger), `/redoc` (ReDoc)  
**Auth:** Bearer JWT in `Authorization` header

### 9.1 Authentication

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/v1/auth/login` | POST | — | Login, returns JWT |
| `/api/v1/auth/me` | GET | JWT | Current user profile |
| `/api/v1/auth/verify-email` | POST | — | Email verification |
| `/api/v1/auth/resend-verification` | POST | — | Resend verification email |

### 9.2 Organization

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/v1/colleges` | GET, POST | Platform Admin | List/create colleges |
| `/api/v1/colleges/{id}` | GET, PUT, DELETE | Platform Admin | Manage college |
| `/api/v1/departments` | GET, POST | Super Admin+ | List/create departments |
| `/api/v1/users` | GET, POST | Admin roles | List/create users |
| `/api/v1/subjects` | GET, POST | Dept Admin, Teacher | List/create subjects |

### 9.3 Sections

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/v1/subjects/{id}/sections` | GET, POST | Admin | List/create sections |
| `/api/v1/sections/{id}/students` | GET, POST, DELETE | Admin, Teacher | Manage section students |
| `/api/v1/sections/{id}/teachers` | GET, POST, DELETE | Admin | Manage section teachers |
| `/api/v1/my-sections` | GET | Teacher | Teacher's assigned sections |

### 9.4 Students

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/v1/students` | GET | Admin, Teacher | List students |
| `/api/v1/students/enroll` | POST | Dept Admin+ | Enroll with 3 face images |
| `/api/v1/students/{id}/add-face` | POST | Admin | Add/update face poses |
| `/api/v1/students/generate-embeddings` | POST | Admin | Backfill embeddings |

### 9.5 Recognition

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/v1/recognize` | POST | Teacher+ | Single image recognition |
| `/api/v1/recognize/stream/start` | POST | Teacher+ | Start live session |
| `/api/v1/recognize/stream` | POST | Teacher+ | Process stream frame |
| `/api/v1/recognize/stream/end` | POST | Teacher+ | End live session |
| `/api/v1/recognize/test` | POST | Super Admin | Test recognition (no subject filter) |

### 9.6 Attendance

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/v1/attendance` | POST | Teacher+ | Confirm and save attendance |
| `/api/v1/attendance/list` | GET | Teacher+ | List attendance records |
| `/api/v1/attendance/report` | GET | Teacher+ | Excel report |
| `/api/v1/attendance/report/simple-pdf` | GET | Teacher+ | PDF report |
| `/api/v1/attendance/subjects-with-reports` | GET | Teacher+ | Subjects with report data |

### 9.7 Health

| Endpoint | Method | Description |
|---|---|---|
| `/health` | GET | Service health check |

---

## 10. Client Applications

### 10.1 Mobile App (Expo / React Native)

**Key screens by role:**

| Screen | Super Admin | Dept Admin | Teacher |
|---|---|---|---|
| Dashboard | ✓ | ✓ | ✓ |
| Enroll / Enroll Camera | ✓ | ✓ | ✓ |
| Attendance / Attendance Camera | ✓ | ✓ | ✓ |
| Reports / Reports Detail | ✓ | ✓ | ✓ |
| Department Hub | — | ✓ | — |
| Manage Sections | — | ✓ | — |
| Section Students | ✓ | ✓ | ✓ |
| Create Dept Admin | ✓ | — | — |
| Create Teacher | ✓ | ✓ | — |
| Student List / Teacher List | — | ✓ | — |

**State management:** Zustand (auth), TanStack Query (API caching), MMKV (local persistence).

### 10.2 Desktop App (Electron / React)

Used by Platform and College admins for:

- Creating and editing colleges
- Managing departments
- Creating users (super admins, dept admins, teachers)
- Viewing students and subjects

---

## 11. Security

| Aspect | Implementation |
|---|---|
| Authentication | JWT (HS256) with configurable expiry |
| Password storage | bcrypt hashing |
| Authorization | Role-based access control on every endpoint |
| Database | Supabase Row Level Security (RLS) on section tables |
| Transport | HTTPS in production (via reverse proxy) |
| Tenant isolation | College-scoped data and FAISS indexes |
| Human verification | Teacher confirms matches before saving attendance |

**Environment secrets:** `JWT_SECRET`, `SUPABASE_SERVICE_KEY` must be set in production and never committed to version control.

---

## 12. Configuration

### 12.1 Backend Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `SUPABASE_URL` | Yes | — | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Yes | — | Service role key |
| `JWT_SECRET` | Yes | — | JWT signing secret |
| `RECOGNITION_THRESHOLD` | No | 0.5 | Face match similarity threshold |
| `FACE_EXECUTION_PROVIDER` | No | auto | `auto`, `cuda`, `coreml`, or `cpu` |
| `RESEND_API_KEY` | No | — | Email verification (Resend) |

### 12.2 Client Environment Variables

| Variable | App | Description |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | Mobile | Backend URL |
| `VITE_API_URL` | Desktop | Backend URL |

---

## 13. Deployment

### 13.1 Backend

- **CPU:** Docker Compose on EC2 (`t3.medium` or similar)
- **GPU:** `Dockerfile.gpu` on GPU instances (e.g., `g4dn.xlarge`) with `FACE_EXECUTION_PROVIDER=cuda`
- **Reverse proxy:** nginx + HTTPS recommended for production

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full instructions.

### 13.2 Mobile

- **EAS Build:** `eas build --platform android --profile preview`
- **Local:** `npx expo run:android`

### 13.3 Desktop

- **Build:** `npm run build:electron` in `admin-desktop`
- **Output:** Windows NSIS installer in `release/`

### 13.4 CI/CD

GitHub Actions (`.github/workflows/ci.yml`) runs on push/PR to `main`:

- Install dependencies
- Build shared package
- Build admin-desktop

---

## 14. Development Setup

### Prerequisites

- Node.js 18+
- Python 3.11+
- Supabase account

### Quick Start

```bash
git clone https://github.com/nrk018/Attend.git
cd Attend
npm install

# Configure backend
cp apps/backend/.env.example apps/backend/.env
# Edit .env with Supabase credentials

# Run migrations in Supabase SQL editor

# Start services
npm run backend    # Terminal 1
npm run mobile     # Terminal 2
npm run desktop    # Terminal 3
```

---

## 15. Outcomes and Validation

| Outcome | Result |
|---|---|
| Recognition accuracy | ~99% (inherited ArcFace LFW benchmark) |
| Real-world testing | 100+ students in live classroom |
| Feature extraction latency | 45–80 ms/frame (CPU) |
| Vector search latency | Sub-millisecond (FAISS) |
| Scalability target | 20,000+ students per college |
| Proxy attendance prevention | Face recognition + human confirmation |
| Audit trail | Attendance records with confidence scores and face crop images |

---

## 16. Limitations and Future Scope

**Current limitations:**

- No custom model training or fine-tuning; relies on pretrained `buffalo_l`
- No formal evaluation pipeline or held-out test set in the codebase
- ML inference runs server-side only (no on-device edge ML)
- Stream session deduplication is in-memory (not persisted across restarts)

**Future scope:**

- Edge ML migration (on-device embedding extraction)
- Liveness detection to prevent photo spoofing
- GPU-accelerated deployment for high-throughput scenarios
- Formal accuracy evaluation on enrolled student datasets
- Monitoring and observability (logging, metrics, alerting)

---

## 17. Related Documentation

- [README.md](../README.md) — Quick start and overview
- [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) — Architecture diagrams
- [DEPLOYMENT.md](./DEPLOYMENT.md) — Deployment guide
- [APPLICATION_SUMMARY.md](../APPLICATION_SUMMARY.md) — App screens and roles

---

## 18. Glossary

| Term | Definition |
|---|---|
| ArcFace | Angular-margin face recognition model producing 512-d embeddings |
| FAISS | Facebook AI Similarity Search library for fast vector retrieval |
| FAISS IndexFlatIP | Exact inner-product index (cosine similarity after L2 normalization) |
| InsightFace | Open-source face analysis toolkit |
| RetinaFace | Single-stage face detector |
| Section | Subdivision of a subject for grouping students and teachers |
| Tenant | A college instance in the multi-tenant hierarchy |

---

*This document reflects the Attend codebase as of v1.0.0. For live API details, run the backend and visit `/docs`.*
