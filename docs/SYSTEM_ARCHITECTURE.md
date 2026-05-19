# Attend – System Architecture Diagram

> Extremely detailed system architecture documentation for the AI-powered face recognition attendance system.

---

## 0. Master Architecture Diagram (Complete System)

```mermaid
flowchart TB
    subgraph Clients["CLIENT APPLICATIONS"]
        direction TB
        subgraph Mobile["📱 Mobile App (Expo/React Native)"]
            M_Dash[Dashboard]
            M_Enroll[Enroll Student]
            M_Att[Attendance Camera]
            M_Reports[Reports]
            M_State[Zustand + TanStack Query]
        end
        subgraph Desktop["🖥️ Admin Desktop (Electron/React)"]
            D_Colleges[Colleges]
            D_Depts[Departments]
            D_Users[Users]
            D_Students[Students]
            D_Subjects[Subjects]
        end
    end

    subgraph Shared["SHARED PACKAGE"]
        API_Const[API Endpoints]
        Schemas[Zod Schemas]
        Roles[Role Hierarchy]
    end

    subgraph Backend["FASTAPI BACKEND :8000"]
        direction TB
        subgraph AuthAPI["/api/v1/auth"]
            Login[login, me, verify-email]
        end
        subgraph CoreAPI["Core APIs"]
            Colleges[colleges]
            Users[users]
            Depts[departments]
            Subjects[subjects]
            Students[students]
        end
        subgraph FaceAPI["/api/v1/recognize"]
            Rec[recognize, stream/start, stream, stream/end]
        end
        subgraph AttAPI["/api/v1/attendance"]
            AttEP[confirm, list, reports, PDF, Excel]
        end
    end

    subgraph Services["BACKEND SERVICES"]
        direction TB
        subgraph FacePipeline["Face Recognition"]
            InsightFace[InsightFace buffalo_l<br/>RetinaFace + ArcFace 512d]
            FAISS[FAISS IndexFlatIP<br/>per-college cache]
        end
        subgraph BizLogic["Business Logic"]
            Enrollment[Enrollment Service]
            Attendance[Attendance Service]
            Email[Email Service]
        end
    end

    subgraph Data["DATA LAYER"]
        direction TB
        Postgres[(PostgreSQL<br/>colleges, users, departments<br/>subjects, students<br/>face_embeddings, attendance)]
        Storage[(Supabase Storage<br/>primary-faces<br/>attendance-crops<br/>college-logos)]
    end

    Mobile --> Shared
    Desktop --> Shared
    Mobile -->|JWT| Backend
    Desktop -->|JWT| Backend
    Backend --> FacePipeline
    Backend --> BizLogic
    Backend --> Postgres
    Backend --> Storage
    FacePipeline --> Postgres
    Enrollment --> Postgres
    Enrollment --> Storage
    Attendance --> Postgres
    Attendance --> Storage
```

---

## 1. High-Level System Overview

```mermaid
flowchart TB
    subgraph Clients["Client Applications"]
        Mobile["📱 Mobile App<br/>(Expo / React Native)"]
        Desktop["🖥️ Admin Desktop<br/>(Electron / React)"]
    end

    subgraph Backend["Backend Layer"]
        API["FastAPI REST API<br/>:8000"]
    end

    subgraph Services["Core Services"]
        Auth["Auth Service<br/>JWT"]
        Face["Face Recognition<br/>InsightFace + FAISS"]
        Storage["Supabase Storage"]
    end

    subgraph Data["Data Layer"]
        DB[(PostgreSQL<br/>Supabase)]
    end

    Mobile -->|HTTPS / JWT| API
    Desktop -->|HTTPS / JWT| API
    API --> Auth
    API --> Face
    API --> DB
    API --> Storage
    Face --> DB
```

---

## 2. Application Layer Detail

```mermaid
flowchart TB
    subgraph MobileApp["Mobile App (Expo SDK 54)"]
        direction TB
        subgraph MobileTabs["Tab Navigation"]
            Dashboard["Dashboard"]
            Enroll["Enroll Student"]
            Attendance["Attendance"]
            Reports["Reports"]
        end

        subgraph MobileScreens["Key Screens"]
            EnrollCamera["Enroll Camera<br/>3-face capture"]
            AttCamera["Attendance Camera<br/>Live / Photo"]
            ReportsDetail["Reports Detail<br/>PDF/Excel"]
            StudentList["Student List"]
            CreateDeptAdmin["Create Dept Admin"]
            CreateTeacher["Create Teacher"]
        end

        subgraph MobileState["State Management"]
            Zustand["Zustand (auth)"]
            TanStack["TanStack Query<br/>API cache"]
        end

        Dashboard --> Enroll
        Dashboard --> Attendance
        Dashboard --> Reports
        Enroll --> EnrollCamera
        Attendance --> AttCamera
        Reports --> ReportsDetail
    end

    subgraph DesktopApp["Admin Desktop (Electron)"]
        direction TB
        subgraph DesktopRoutes["Routes"]
            DLogin["Login"]
            DDashboard["Dashboard"]
            Colleges["Colleges"]
            CreateCollege["Create College"]
            EditCollege["Edit College"]
            CreateSuperAdmin["Create Super Admin"]
            Departments["Departments"]
            Users["Users"]
            Students["Students"]
            Subjects["Subjects"]
            CreateUser["Create User"]
        end

        subgraph DesktopState["State"]
            DZustand["Zustand"]
            DQuery["TanStack Query"]
        end
    end

    subgraph Shared["Shared Package (@attend/shared)"]
        Types["Zod Schemas"]
        APIEndpoints["API Endpoints"]
        Roles["Role Hierarchy"]
    end

    MobileApp --> Shared
    DesktopApp --> Shared
```

---

## 3. Backend API Architecture

```mermaid
flowchart TB
    subgraph FastAPI["FastAPI Application"]
        direction TB

        subgraph AuthRouter["/api/v1/auth"]
            Login["POST /login"]
            Me["GET /me"]
            VerifyEmail["GET /verify-email"]
            ResendVerify["POST /resend-verification"]
            PatchMe["PATCH /me"]
        end

        subgraph CollegesRouter["/api/v1/colleges"]
            CreateCollege["POST /"]
            ListColleges["GET /"]
            GetCollege["GET /{id}"]
            PatchCollege["PATCH /{id}"]
            UploadLogo["POST /upload-logo"]
        end

        subgraph UsersRouter["/api/v1/users"]
            CreateUser["POST /"]
            ListUsers["GET /"]
            DeleteUser["DELETE /{id}"]
        end

        subgraph DeptsRouter["/api/v1/departments"]
            CreateDept["POST /"]
            ListDepts["GET /"]
            PatchDept["PATCH /{id}"]
            DeleteDept["DELETE /{id}"]
        end

        subgraph SubjectsRouter["/api/v1/subjects"]
            CreateSubject["POST /"]
            ListSubjects["GET /"]
            PutSubject["PUT /{id}"]
            DeleteSubject["DELETE /{id}"]
            EnrollStudents["POST /{id}/students"]
        end

        subgraph StudentsRouter["/api/v1/students"]
            Enroll["POST /enroll"]
            GenEmbeddings["POST /generate-embeddings"]
            ListStudents["GET /"]
            GetStudent["GET /{id}"]
            PatchStudent["PATCH /{id}"]
            AddFace["POST /{id}/add-face"]
            DeleteStudent["DELETE /{id}"]
        end

        subgraph RecognizeRouter["/api/v1/recognize"]
            Recognize["POST /"]
            StreamStart["POST /stream/start"]
            Stream["POST /stream"]
            StreamEnd["POST /stream/end"]
            Test["POST /test"]
        end

        subgraph AttendanceRouter["/api/v1/attendance"]
            ConfirmAtt["POST /"]
            ListAtt["GET /list"]
            DeleteAtt["DELETE /{id}"]
            SubjectsWithReports["GET /subjects-with-reports"]
            DeleteReport["DELETE /report/subject/{id}"]
            ReportExcel["GET /report"]
            SimpleExcel["GET /report/simple-excel"]
            SimplePDF["GET /report/simple-pdf"]
        end

        subgraph AdminRouter["/api/v1/admin"]
            AdminStats["GET /stats"]
        end
    end

    Health["GET /health"]
```

---

## 4. Authentication & Authorization Flow

```mermaid
flowchart TB
    subgraph Client["Client"]
        LoginReq["Login Request<br/>email + password"]
        TokenStore["Store JWT"]
        APIReq["API Request<br/>Authorization: Bearer {token}"]
    end

    subgraph Auth["Auth Pipeline"]
        JWTVerify["JWT Verify<br/>decode_token()"]
        RoleCheck["Role Check<br/>require_roles()"]
        DBRole["Fetch /me<br/>role from DB"]
    end

    subgraph Roles["Role Hierarchy"]
        PA["PLATFORM_ADMIN"]
        SA["SUPER_ADMIN"]
        DA["DEPARTMENT_ADMIN"]
        T["TEACHER"]
    end

    subgraph Deps["Auth Dependencies"]
        get_current_user["get_current_user"]
        require_platform_admin["require_platform_admin"]
        require_super_admin["require_super_admin"]
        require_dept_admin["require_dept_admin"]
        require_teacher["require_teacher"]
    end

    LoginReq --> JWTVerify
    JWTVerify --> TokenStore
    TokenStore --> APIReq
    APIReq --> get_current_user
    get_current_user --> JWTVerify
    get_current_user --> DBRole
    get_current_user --> RoleCheck
    RoleCheck --> PA
    RoleCheck --> SA
    RoleCheck --> DA
    RoleCheck --> T
```

---

## 5. Face Recognition Pipeline

```mermaid
flowchart TB
    subgraph Input["Input"]
        ImageBytes["Image Bytes<br/>(JPEG)"]
    end

    subgraph Pipeline["Face Pipeline (InsightFace)"]
        Decode["decode_image()<br/>cv2.imdecode"]
        Detect["detect_and_embed()<br/>FaceAnalysis buffalo_l"]
        subgraph DetectDetail["Detection Detail"]
            RetinaFace["RetinaFace<br/>Face Detection"]
            ArcFace["ArcFace<br/>512-dim Embedding"]
            BBox["bbox [x1,y1,x2,y2]"]
            DetScore["det_score > 0.5"]
        end
    end

    subgraph FAISS["FAISS Index (per college)"]
        BuildIndex["get_or_build_college_index()"]
        Search["search_index()<br/>IndexFlatIP, L2 norm"]
        Cache["In-memory cache<br/>college_id → (index, id_list)"]
    end

    subgraph DB["Database"]
        FaceEmbeddings["face_embeddings<br/>vector(512)"]
        Students["students"]
    end

    subgraph Output["Output"]
        Results["RecognizeResult[]<br/>student_id, name, reg_no<br/>confidence, bbox, face_crop_base64"]
    end

    ImageBytes --> Decode
    Decode --> Detect
    Detect --> RetinaFace
    Detect --> ArcFace
    Detect --> BBox
    Detect --> DetScore
    Detect --> BuildIndex
    BuildIndex --> FaceEmbeddings
    BuildIndex --> Cache
    BuildIndex --> Search
    Search --> Students
    Search --> Results
```

---

## 6. Live Attendance Flow (End-to-End)

```mermaid
sequenceDiagram
    participant M as Mobile App
    participant API as FastAPI
    participant Att as Attendance Service
    participant Face as Face Pipeline
    participant FAISS as FAISS Index
    participant DB as PostgreSQL
    participant Storage as Supabase Storage

    M->>API: POST /recognize/stream/start
    API->>Att: create_stream_session()
    API-->>M: session_id

    loop Every 1.2s (or on Continue)
        M->>M: takePictureAsync()
        M->>API: POST /recognize/stream (image + session_id + subject_id)
        API->>Att: recognize_faces()
        Att->>Face: decode_image, detect_and_embed
        Face->>FAISS: search_index(embedding)
        FAISS-->>Att: (student_id, score)
        Att->>DB: Fetch student details
        Att-->>API: results[], image_width, image_height
        API-->>M: results with bbox, face_crop_base64
        M->>M: Render overlay, pause if recognized
    end

    M->>M: User taps Accept
    M->>API: POST /attendance (student_id, subject_id, confidence, face_crop_base64)
    API->>Att: save_attendance()
    Att->>Storage: Upload face crop to attendance-crops
    Att->>DB: INSERT attendance
    API-->>M: 200 OK

    M->>API: POST /recognize/stream/end
    API->>Att: clear_stream_session()
```

---

## 7. Enrollment Flow

```mermaid
sequenceDiagram
    participant M as Mobile App
    participant API as FastAPI
    participant Enroll as Enrollment Service
    participant Face as Face Pipeline
    participant DB as PostgreSQL
    participant Storage as Supabase Storage

    M->>M: Capture 3 images (front, left, right)
    M->>API: POST /students/enroll (FormData: 3 images, reg_no, name, college_id, dept_id)
    API->>Enroll: enroll_student()

    Enroll->>Face: decode_image (x3)
    Enroll->>Face: detect_and_embed (x3)
    Face-->>Enroll: embeddings per image

    Enroll->>Storage: Upload primary.jpg, left.jpg, right.jpg
    Enroll->>DB: INSERT students
    Enroll->>DB: INSERT face_embeddings (front embedding)
    Enroll->>Face: invalidate_college_index(college_id)
    Enroll-->>API: student record
    API-->>M: 201 Created
```

---

## 8. Database Schema (Entity Relationship)

```mermaid
erDiagram
    colleges ||--o{ departments : has
    colleges ||--o{ students : has
    departments ||--o{ subjects : has
    departments ||--o{ users : has
    departments ||--o{ students : has
    subjects ||--o{ subject_teachers : "taught by"
    users ||--o{ subject_teachers : "teaches"
    subjects ||--o{ subject_students : "enrolled"
    students ||--o{ subject_students : "enrolled in"
    subjects ||--o{ attendance : "has"
    students ||--o{ attendance : "marked"
    students ||--o{ face_embeddings : "has"

    colleges {
        uuid id PK
        string name
        timestamp created_at
    }

    departments {
        uuid id PK
        uuid college_id FK
        string name
    }

    users {
        uuid id PK
        string email UK
        string password_hash
        enum role
        uuid college_id FK
        uuid department_id FK
        boolean is_active
    }

    subjects {
        uuid id PK
        uuid department_id FK
        string name
    }

    students {
        uuid id PK
        string reg_no
        string name
        uuid college_id FK
        uuid department_id FK
        string primary_image_url
    }

    face_embeddings {
        uuid id PK
        uuid student_id FK
        vector_512 embedding
    }

    attendance {
        uuid id PK
        uuid student_id FK
        uuid subject_id FK
        date attendance_date
        timestamp timestamp
        float confidence
        string face_crop_url
    }

    subject_teachers {
        uuid subject_id PK,FK
        uuid teacher_id PK,FK
    }

    subject_students {
        uuid subject_id PK,FK
        uuid student_id PK,FK
    }
```

---

## 9. Storage Buckets

```mermaid
flowchart TB
    subgraph Buckets["Supabase Storage Buckets"]
        subgraph PrimaryFaces["primary-faces (public)"]
            PF1["{college_id}/{student_id}/primary.jpg"]
            PF2["{college_id}/{student_id}/left.jpg"]
            PF3["{college_id}/{student_id}/right.jpg"]
        end

        subgraph AttendanceCrops["attendance-crops (public)"]
            AC1["attendance/{subject_id}/{student_id}/{uuid}.jpg"]
        end

        subgraph CollegeLogos["college-logos (public)"]
            CL1["{college_id}/logo.{ext}"]
        end
    end

    Enroll["Enrollment"] --> PrimaryFaces
    AddFace["Add Face"] --> PrimaryFaces
    SaveAttendance["Save Attendance"] --> AttendanceCrops
    UploadLogo["Upload Logo"] --> CollegeLogos
```

---

## 10. Role-Based Access Control Matrix

```mermaid
flowchart LR
    subgraph Roles["Roles"]
        PA[Platform Admin]
        SA[Super Admin]
        DA[Dept Admin]
        T[Teacher]
    end

    subgraph MobileCap["Mobile Capabilities"]
        CreateDeptAdmin[Create Dept Admin]
        CreateTeacher[Create Teacher]
        EnrollStudent[Enroll Student]
        TakeAttendance[Take Attendance]
        ViewReports[View Reports]
    end

    subgraph DesktopCap["Desktop Capabilities"]
        CreateCollege[Create College]
        CreateSuperAdmin[Create Super Admin]
        ManageDepts[Manage Departments]
        ManageUsers[Manage Users]
        ManageStudents[Manage Students]
        ManageSubjects[Manage Subjects]
    end

    PA --> CreateCollege
    PA --> CreateSuperAdmin
    SA --> CreateDeptAdmin
    SA --> CreateTeacher
    DA --> CreateTeacher
    DA --> EnrollStudent
    DA --> ViewReports
    T --> EnrollStudent
    T --> TakeAttendance
    T --> ViewReports
```

---

## 11. Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Mobile** | React Native 0.81, Expo SDK 54 | Cross-platform iOS/Android |
| **Mobile** | Expo Router 6 | File-based routing |
| **Mobile** | Expo Camera 17 | Face capture |
| **Mobile** | Zustand 4 | Auth state |
| **Mobile** | TanStack Query 5 | API caching |
| **Desktop** | Electron | Desktop shell |
| **Desktop** | React 19, Vite | SPA |
| **Backend** | FastAPI | REST API |
| **Backend** | Uvicorn | ASGI server |
| **Face** | InsightFace (buffalo_l) | RetinaFace + ArcFace |
| **Face** | FAISS | Vector similarity search |
| **Face** | OpenCV (cv2) | Image decode/crop |
| **DB** | PostgreSQL (Supabase) | Primary data store |
| **DB** | pgvector | 512-dim embeddings |
| **Storage** | Supabase Storage | Images |
| **Auth** | JWT (HS256) | Stateless auth |
| **Build** | Turborepo | Monorepo |

---

## 12. Deployment Architecture

```mermaid
flowchart TB
    subgraph Clients["Clients"]
        MobileApp["Mobile APK<br/>EAS Build"]
        DesktopInstaller["Desktop Installer<br/>Electron Builder"]
    end

    subgraph Cloud["Cloud"]
        subgraph Backend["Backend (EC2/Docker)"]
            Uvicorn["Uvicorn"]
            FastAPI["FastAPI"]
        end

        subgraph Supabase["Supabase"]
            Postgres[(PostgreSQL)]
            Storage["Storage"]
            Auth["Auth"]
        end
    end

    MobileApp -->|HTTPS| Backend
    DesktopInstaller -->|HTTPS| Backend
    FastAPI --> Postgres
    FastAPI --> Storage
```

---

## 13. Data Flow Summary

```mermaid
flowchart TB
    subgraph Enrollment["Enrollment Path"]
        E1[3 Face Images] --> E2[InsightFace Detect]
        E2 --> E3[Extract Embeddings]
        E3 --> E4[Store in primary-faces]
        E3 --> E5[Insert face_embeddings]
        E4 --> E6[Invalidate FAISS cache]
    end

    subgraph Recognition["Recognition Path"]
        R1[Single Image] --> R2[Detect + Embed]
        R2 --> R3[FAISS Search]
        R3 --> R4[Match student_id]
        R4 --> R5[Return bbox + crop]
    end

    subgraph Attendance["Attendance Path"]
        A1[Accept Student] --> A2[Upload crop]
        A2 --> A3[Insert attendance]
        A3 --> A4[Invalidate reports cache]
    end
```

---

*Generated from Attend codebase. Last updated: 2025.*
