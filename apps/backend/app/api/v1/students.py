from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app.auth.deps import get_current_user, require_dept_admin, require_teacher
from app.config import get_settings
from app.db.supabase import get_supabase
from app.face.faiss_index import invalidate_college_index
from app.services.enrollment import enroll_student, add_face_embeddings
from app.services.embedding_backfill import generate_embeddings_for_college
from pydantic import BaseModel

router = APIRouter()


class UpdateStudentRequest(BaseModel):
    reg_no: Optional[str] = None
    name: Optional[str] = None
    department_id: Optional[str] = None


@router.post("/enroll")
async def enroll_student_endpoint(
    reg_no: str = Form(...),
    name: str = Form(...),
    college_id: str = Form(...),
    department_id: str = Form(...),
    front: UploadFile = File(...),
    left: UploadFile = File(...),
    right: UploadFile = File(...),
    subject_ids: Optional[str] = Form(None),
    user: dict = Depends(require_teacher),
):
    role = user.get("role")
    if role in ("DEPARTMENT_ADMIN", "TEACHER"):
        if str(user.get("college_id")) != college_id or str(user.get("department_id")) != department_id:
            raise HTTPException(status_code=403, detail="Cannot enroll in another department")

    front_bytes = await front.read()
    left_bytes = await left.read()
    right_bytes = await right.read()

    parsed_subject_ids = None
    if subject_ids:
        parsed_subject_ids = [s.strip() for s in subject_ids.split(",") if s.strip()]

    try:
        result = enroll_student(
            reg_no=reg_no,
            name=name,
            college_id=college_id,
            department_id=department_id,
            front_image_bytes=front_bytes,
            left_image_bytes=left_bytes,
            right_image_bytes=right_bytes,
            created_by=user.get("user_id") or user.get("sub"),
            subject_ids=parsed_subject_ids,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


class GenerateEmbeddingsRequest(BaseModel):
    college_id: str


@router.post("/generate-embeddings")
def generate_embeddings_endpoint(
    req: GenerateEmbeddingsRequest,
    user: dict = Depends(require_dept_admin),
):
    """
    Generate face embeddings for students who have images but no embeddings.
    Recognition works immediately after—no restart needed.
    """
    college_id = req.college_id
    role = user.get("role")
    if role == "DEPARTMENT_ADMIN":
        if str(user.get("college_id")) != college_id:
            raise HTTPException(status_code=403, detail="Cannot generate embeddings for another college")
    elif role == "SUPER_ADMIN":
        if str(user.get("college_id") or "") != college_id:
            raise HTTPException(status_code=403, detail="Cannot generate embeddings for another college")
    # PLATFORM_ADMIN can generate for any college

    return generate_embeddings_for_college(college_id)


@router.get("")
def list_students(
    college_id: Optional[str] = None,
    department_id: Optional[str] = None,
    user: dict = Depends(get_current_user),
):
    supabase = get_supabase()
    role = user.get("role")
    college_filter = user.get("college_id") if role in ("SUPER_ADMIN", "DEPARTMENT_ADMIN", "TEACHER") else college_id
    dept_filter = user.get("department_id") if role in ("DEPARTMENT_ADMIN", "TEACHER") else department_id

    if not college_filter and role != "PLATFORM_ADMIN":
        raise HTTPException(status_code=400, detail="college_id required")

    q = supabase.table("students").select("*, departments(name)")
    if college_filter:
        q = q.eq("college_id", college_filter)
    if dept_filter:
        q = q.eq("department_id", dept_filter)
    result = q.order("created_at", desc=True).execute()
    data = result.data or []
    for row in data:
        dept = row.pop("departments", None)
        row["department_name"] = dept.get("name") if isinstance(dept, dict) else None
    return data


def _can_manage_student(actor: dict, student_college_id: str, student_dept_id: str) -> bool:
    role = actor.get("role")
    if role == "PLATFORM_ADMIN":
        return True
    if role == "SUPER_ADMIN":
        return str(actor.get("college_id")) == str(student_college_id)
    if role == "DEPARTMENT_ADMIN":
        return str(actor.get("college_id")) == str(student_college_id) and str(actor.get("department_id")) == str(student_dept_id)
    return False


@router.get("/{student_id}")
def get_student(
    student_id: str,
    user: dict = Depends(get_current_user),
):
    supabase = get_supabase()
    row = supabase.table("students").select("*, departments(name)").eq("id", student_id).execute()
    if not row.data:
        raise HTTPException(status_code=404, detail="Student not found")
    student = row.data[0]
    if not _can_manage_student(user, student["college_id"], student["department_id"]):
        raise HTTPException(status_code=403, detail="Cannot view this student")
    dept = student.pop("departments", None)
    student["department_name"] = dept.get("name") if isinstance(dept, dict) else None
    return student


@router.patch("/{student_id}")
def update_student(
    student_id: str,
    req: UpdateStudentRequest,
    user: dict = Depends(get_current_user),
):
    supabase = get_supabase()
    row = supabase.table("students").select("*").eq("id", student_id).execute()
    if not row.data:
        raise HTTPException(status_code=404, detail="Student not found")
    student = row.data[0]
    if not _can_manage_student(user, student["college_id"], student["department_id"]):
        raise HTTPException(status_code=403, detail="Cannot update this student")

    updates = {}
    if req.reg_no is not None:
        updates["reg_no"] = req.reg_no
    if req.name is not None:
        updates["name"] = req.name
    if req.department_id is not None:
        new_dept = supabase.table("departments").select("college_id").eq("id", req.department_id).execute()
        if not new_dept.data:
            raise HTTPException(status_code=400, detail="Department not found")
        if str(new_dept.data[0]["college_id"]) != str(student["college_id"]):
            raise HTTPException(status_code=400, detail="Department must be in same college")
        updates["department_id"] = req.department_id

    if not updates:
        return {"id": student_id, **student}

    supabase.table("students").update(updates).eq("id", student_id).execute()
    invalidate_college_index(str(student["college_id"]))
    return {"id": student_id, **student, **updates}


@router.post("/{student_id}/add-face")
async def add_face_endpoint(
    student_id: str,
    left: Optional[UploadFile] = File(None),
    right: Optional[UploadFile] = File(None),
    user: dict = Depends(get_current_user),
):
    """Add left and/or right face images to an existing student."""
    if not left and not right:
        raise HTTPException(status_code=400, detail="At least one of left or right image is required")
    supabase = get_supabase()
    row = supabase.table("students").select("college_id, department_id").eq("id", student_id).execute()
    if not row.data:
        raise HTTPException(status_code=404, detail="Student not found")
    student = row.data[0]
    if not _can_manage_student(user, student["college_id"], student["department_id"]):
        raise HTTPException(status_code=403, detail="Cannot update this student")

    left_bytes = await left.read() if left else None
    right_bytes = await right.read() if right else None
    try:
        result = add_face_embeddings(student_id, left_bytes, right_bytes)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


def _delete_student_storage(supabase, college_id: str, student_id: str) -> None:
    """Remove student face images from primary-faces bucket."""
    bucket = get_settings().bucket_primary_faces
    prefix = f"{college_id}/{student_id}"
    paths = [f"{prefix}/primary.jpg", f"{prefix}/left.jpg", f"{prefix}/right.jpg"]
    try:
        supabase.storage.from_(bucket).remove(paths)
    except Exception:
        pass  # Ignore if files don't exist


@router.delete("/{student_id}")
def delete_student(
    student_id: str,
    user: dict = Depends(get_current_user),
):
    supabase = get_supabase()
    row = supabase.table("students").select("id, college_id, department_id").eq("id", student_id).execute()
    if not row.data:
        raise HTTPException(status_code=404, detail="Student not found")
    student = row.data[0]
    if not _can_manage_student(user, student["college_id"], student["department_id"]):
        raise HTTPException(status_code=403, detail="Cannot delete this student")

    _delete_student_storage(supabase, str(student["college_id"]), student_id)
    supabase.table("students").delete().eq("id", student_id).execute()
    invalidate_college_index(str(student["college_id"]))
    return {"message": "Student deleted"}
