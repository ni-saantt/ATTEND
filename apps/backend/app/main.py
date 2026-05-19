from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import auth, colleges, users, departments, subjects, students, recognize, attendance, admin, sections
from app.config import get_settings

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API v1 routes
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(colleges.router, prefix="/api/v1/colleges", tags=["Colleges"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(departments.router, prefix="/api/v1/departments", tags=["Departments"])
app.include_router(subjects.router, prefix="/api/v1/subjects", tags=["Subjects"])
app.include_router(students.router, prefix="/api/v1/students", tags=["Students"])
app.include_router(recognize.router, prefix="/api/v1/recognize", tags=["Recognize"])
app.include_router(attendance.router, prefix="/api/v1/attendance", tags=["Attendance"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin"])
app.include_router(sections.router, prefix="/api/v1", tags=["Sections"])


@app.get("/health")
def health():
    return {"status": "ok"}
