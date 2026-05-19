from fastapi import APIRouter, Depends, HTTPException

from app.auth.deps import get_current_user, require_super_admin
from app.db.supabase import get_supabase
from pydantic import BaseModel

router = APIRouter()


class CreateDepartmentRequest(BaseModel):
    college_id: str
    name: str


class UpdateDepartmentRequest(BaseModel):
    name: str


@router.post("")
def create_department(
    req: CreateDepartmentRequest,
    user: dict = Depends(require_super_admin),
):
    if user.get("role") == "SUPER_ADMIN" and str(user.get("college_id")) != req.college_id:
        raise HTTPException(status_code=403, detail="Cannot create department for another college")

    supabase = get_supabase()
    result = supabase.table("departments").insert({
        "college_id": req.college_id,
        "name": req.name,
    }).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create department")
    return {"id": str(result.data[0]["id"]), "name": req.name}


@router.get("")
def list_departments(
    college_id: str,
    user: dict = Depends(get_current_user),
):
    supabase = get_supabase()
    role = user.get("role")
    if role in ("SUPER_ADMIN", "DEPARTMENT_ADMIN", "TEACHER"):
        if str(user.get("college_id")) != college_id:
            raise HTTPException(status_code=403, detail="Cannot access another college")
    result = supabase.table("departments").select("*").eq("college_id", college_id).execute()
    return result.data or []


@router.delete("/{department_id}")
def delete_department(
    department_id: str,
    user: dict = Depends(require_super_admin),
):
    supabase = get_supabase()
    dept = supabase.table("departments").select("id, college_id").eq("id", department_id).execute()
    if not dept.data:
        raise HTTPException(status_code=404, detail="Department not found")
    if str(user.get("college_id")) != str(dept.data[0]["college_id"]):
        raise HTTPException(status_code=403, detail="Cannot delete department in another college")

    students = supabase.table("students").select("id").eq("department_id", department_id).execute()
    subjects = supabase.table("subjects").select("id").eq("department_id", department_id).execute()
    if (students.data and len(students.data) > 0) or (subjects.data and len(subjects.data) > 0):
        raise HTTPException(
            status_code=400,
            detail="Cannot delete department with students or subjects. Remove them first.",
        )

    supabase.table("departments").delete().eq("id", department_id).execute()
    return {"message": "Department deleted"}


@router.patch("/{department_id}")
def update_department(
    department_id: str,
    req: UpdateDepartmentRequest,
    user: dict = Depends(require_super_admin),
):
    supabase = get_supabase()
    dept = supabase.table("departments").select("id, college_id").eq("id", department_id).execute()
    if not dept.data:
        raise HTTPException(status_code=404, detail="Department not found")
    if str(user.get("college_id")) != str(dept.data[0]["college_id"]):
        raise HTTPException(status_code=403, detail="Cannot update department in another college")

    supabase.table("departments").update({"name": req.name}).eq("id", department_id).execute()
    return {"id": department_id, "name": req.name}
