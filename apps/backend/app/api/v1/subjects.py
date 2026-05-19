from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException

from app.auth.deps import get_current_user, require_dept_admin
from app.db.supabase import get_supabase
from pydantic import BaseModel

router = APIRouter()


class EnrollStudentsRequest(BaseModel):
    student_ids: List[str]


class CreateSubjectRequest(BaseModel):
    department_id: str
    name: str
    teacher_ids: Optional[list[str]] = None


class UpdateSubjectRequest(BaseModel):
    name: str


@router.post("")
def create_subject(
    req: CreateSubjectRequest,
    user: dict = Depends(require_dept_admin),
):
    supabase = get_supabase()
    # Verify department belongs to user's college
    dept = supabase.table("departments").select("college_id").eq("id", req.department_id).execute()
    if not dept.data:
        raise HTTPException(status_code=404, detail="Department not found")
    if user.get("role") == "DEPARTMENT_ADMIN" and str(user.get("department_id")) != req.department_id:
        raise HTTPException(status_code=403, detail="Cannot create subject for another department")

    result = supabase.table("subjects").insert({
        "department_id": req.department_id,
        "name": req.name,
    }).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create subject")
    subject_id = result.data[0]["id"]
    if req.teacher_ids:
        for tid in req.teacher_ids:
            supabase.table("subject_teachers").insert({
                "subject_id": subject_id,
                "teacher_id": tid,
            }).execute()
    return {"id": str(subject_id), "name": req.name}


@router.get("")
def list_subjects(
    department_id: Optional[str] = None,
    user: dict = Depends(get_current_user),
):
    supabase = get_supabase()
    role = user.get("role")
    if role == "TEACHER":
        # Teachers see subjects they teach (via subject_teachers)
        user_id = user.get("user_id") or user.get("sub")
        st = supabase.table("subject_teachers").select("subject_id").eq("teacher_id", user_id).execute()
        subject_ids = [r["subject_id"] for r in (st.data or [])]
        if not subject_ids:
            return []
        result = supabase.table("subjects").select("*, departments(name)").in_("id", subject_ids).execute()
    else:
        # Admins filter by department
        if not department_id:
            raise HTTPException(status_code=400, detail="department_id required")
        if role == "DEPARTMENT_ADMIN" and str(user.get("department_id")) != department_id:
            raise HTTPException(status_code=403, detail="Cannot access another department")
        result = supabase.table("subjects").select("*, departments(name)").eq("department_id", department_id).execute()
    return result.data or []


@router.put("/{subject_id}")
def update_subject(
    subject_id: str,
    req: UpdateSubjectRequest,
    user: dict = Depends(require_dept_admin),
):
    supabase = get_supabase()
    subj = supabase.table("subjects").select("department_id").eq("id", subject_id).execute()
    if not subj.data:
        raise HTTPException(status_code=404, detail="Subject not found")
    dept_id = subj.data[0]["department_id"]
    if user.get("role") == "DEPARTMENT_ADMIN" and str(user.get("department_id")) != dept_id:
        raise HTTPException(status_code=403, detail="Cannot update another department's subject")

    result = supabase.table("subjects").update({"name": req.name}).eq("id", subject_id).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to update subject")
    return {"id": subject_id, "name": req.name}


@router.delete("/{subject_id}")
def delete_subject(
    subject_id: str,
    user: dict = Depends(require_dept_admin),
):
    supabase = get_supabase()
    subj = supabase.table("subjects").select("department_id").eq("id", subject_id).execute()
    if not subj.data:
        raise HTTPException(status_code=404, detail="Subject not found")
    dept_id = subj.data[0]["department_id"]
    if user.get("role") == "DEPARTMENT_ADMIN" and str(user.get("department_id")) != dept_id:
        raise HTTPException(status_code=403, detail="Cannot delete another department's subject")

    supabase.table("subjects").delete().eq("id", subject_id).execute()
    return {"status": "deleted"}


@router.post("/{subject_id}/students")
def enroll_students_in_subject(
    subject_id: str,
    req: EnrollStudentsRequest,
    user: dict = Depends(require_dept_admin),
):
    """Enroll students in a subject. Populates subject_students."""
    supabase = get_supabase()
    subj = supabase.table("subjects").select("department_id").eq("id", subject_id).execute()
    if not subj.data:
        raise HTTPException(status_code=404, detail="Subject not found")
    dept_id = subj.data[0]["department_id"]
    if user.get("role") == "DEPARTMENT_ADMIN" and str(user.get("department_id")) != dept_id:
        raise HTTPException(status_code=403, detail="Cannot enroll in another department's subject")

    rows = [{"subject_id": subject_id, "student_id": sid} for sid in req.student_ids]
    if rows:
        supabase.table("subject_students").upsert(
            rows,
            on_conflict="subject_id,student_id",
        ).execute()
    return {"enrolled": len(req.student_ids)}
