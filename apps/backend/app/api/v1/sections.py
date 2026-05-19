from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.auth.deps import get_current_user, require_dept_admin, require_teacher
from app.db.supabase import get_supabase

router = APIRouter()


class CreateSectionRequest(BaseModel):
    name: str


class UpdateSectionRequest(BaseModel):
    name: str


class AssignTeachersRequest(BaseModel):
    teacher_ids: List[str]


class AssignStudentsRequest(BaseModel):
    student_ids: List[str]


def _get_section_with_subject(supabase, section_id: str):
    """Get section and join with subject to get department_id."""
    result = supabase.table("sections").select("*, subjects(department_id, name)").eq("id", section_id).execute()
    if not result.data:
        return None
    section = result.data[0]
    subject_data = section.pop("subjects", {})
    section["department_id"] = subject_data.get("department_id") if subject_data else None
    section["subject_name"] = subject_data.get("name") if subject_data else None
    return section


def _can_manage_section(user: dict, department_id: str) -> bool:
    """Check if user can manage sections in a department."""
    role = user.get("role")
    if role == "PLATFORM_ADMIN":
        return True
    if role == "SUPER_ADMIN":
        return True
    if role == "DEPARTMENT_ADMIN":
        return str(user.get("department_id")) == str(department_id)
    return False


def _is_teacher_for_section(supabase, user_id: str, section_id: str) -> bool:
    """Check if user is assigned as teacher to this section."""
    result = supabase.table("section_teachers").select("section_id").eq("section_id", section_id).eq("teacher_id", user_id).execute()
    return bool(result.data)


# ==================== SECTION CRUD ====================

@router.post("/subjects/{subject_id}/sections")
def create_section(
    subject_id: str,
    req: CreateSectionRequest,
    user: dict = Depends(require_dept_admin),
):
    """Create a new section for a subject. Dept Admin only."""
    supabase = get_supabase()
    
    subj = supabase.table("subjects").select("department_id").eq("id", subject_id).execute()
    if not subj.data:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    dept_id = subj.data[0]["department_id"]
    if not _can_manage_section(user, dept_id):
        raise HTTPException(status_code=403, detail="Cannot create section for this subject")
    
    try:
        result = supabase.table("sections").insert({
            "subject_id": subject_id,
            "name": req.name.strip().upper(),
        }).execute()
    except Exception as e:
        if "duplicate" in str(e).lower() or "unique" in str(e).lower():
            raise HTTPException(status_code=400, detail="Section name already exists for this subject")
        raise HTTPException(status_code=500, detail="Failed to create section")
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create section")
    
    return result.data[0]


@router.get("/subjects/{subject_id}/sections")
def list_sections(
    subject_id: str,
    user: dict = Depends(get_current_user),
):
    """List all sections for a subject."""
    supabase = get_supabase()
    
    subj = supabase.table("subjects").select("department_id").eq("id", subject_id).execute()
    if not subj.data:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    result = supabase.table("sections").select("*").eq("subject_id", subject_id).order("name").execute()
    return result.data or []


@router.get("/sections/{section_id}")
def get_section(
    section_id: str,
    user: dict = Depends(get_current_user),
):
    """Get section details."""
    supabase = get_supabase()
    section = _get_section_with_subject(supabase, section_id)
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    return section


@router.put("/sections/{section_id}")
def update_section(
    section_id: str,
    req: UpdateSectionRequest,
    user: dict = Depends(require_dept_admin),
):
    """Update section name. Dept Admin only."""
    supabase = get_supabase()
    section = _get_section_with_subject(supabase, section_id)
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    
    if not _can_manage_section(user, section["department_id"]):
        raise HTTPException(status_code=403, detail="Cannot update this section")
    
    try:
        result = supabase.table("sections").update({"name": req.name}).eq("id", section_id).execute()
    except Exception as e:
        if "duplicate" in str(e).lower() or "unique" in str(e).lower():
            raise HTTPException(status_code=400, detail="Section name already exists for this subject")
        raise
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to update section")
    
    return result.data[0]


@router.delete("/sections/{section_id}")
def delete_section(
    section_id: str,
    user: dict = Depends(require_dept_admin),
):
    """Delete a section. Dept Admin only."""
    supabase = get_supabase()
    section = _get_section_with_subject(supabase, section_id)
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    
    if not _can_manage_section(user, section["department_id"]):
        raise HTTPException(status_code=403, detail="Cannot delete this section")
    
    supabase.table("sections").delete().eq("id", section_id).execute()
    return {"status": "deleted"}


# ==================== SECTION TEACHERS ====================

@router.post("/sections/{section_id}/teachers")
def assign_teachers_to_section(
    section_id: str,
    req: AssignTeachersRequest,
    user: dict = Depends(require_dept_admin),
):
    """Assign teachers to a section. Dept Admin only."""
    supabase = get_supabase()
    section = _get_section_with_subject(supabase, section_id)
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    
    if not _can_manage_section(user, section["department_id"]):
        raise HTTPException(status_code=403, detail="Cannot assign teachers to this section")
    
    rows = [{"section_id": section_id, "teacher_id": tid} for tid in req.teacher_ids]
    if rows:
        supabase.table("section_teachers").upsert(
            rows,
            on_conflict="section_id,teacher_id",
        ).execute()
    
    return {"assigned": len(req.teacher_ids)}


@router.get("/sections/{section_id}/teachers")
def list_section_teachers(
    section_id: str,
    user: dict = Depends(get_current_user),
):
    """List teachers assigned to a section."""
    supabase = get_supabase()
    section = _get_section_with_subject(supabase, section_id)
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    
    result = supabase.table("section_teachers").select("teacher_id, users(id, name, email)").eq("section_id", section_id).execute()
    teachers = []
    for row in result.data or []:
        teacher_data = row.get("users", {})
        if teacher_data:
            teachers.append({
                "id": teacher_data.get("id"),
                "name": teacher_data.get("name"),
                "email": teacher_data.get("email"),
            })
    return teachers


@router.delete("/sections/{section_id}/teachers/{teacher_id}")
def remove_teacher_from_section(
    section_id: str,
    teacher_id: str,
    user: dict = Depends(require_dept_admin),
):
    """Remove a teacher from a section. Dept Admin only."""
    supabase = get_supabase()
    section = _get_section_with_subject(supabase, section_id)
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    
    if not _can_manage_section(user, section["department_id"]):
        raise HTTPException(status_code=403, detail="Cannot remove teacher from this section")
    
    supabase.table("section_teachers").delete().eq("section_id", section_id).eq("teacher_id", teacher_id).execute()
    return {"status": "removed"}


# ==================== SECTION STUDENTS ====================

@router.post("/sections/{section_id}/students")
def assign_students_to_section(
    section_id: str,
    req: AssignStudentsRequest,
    user: dict = Depends(require_teacher),
):
    """Assign students to a section. Teacher (assigned to section) or Admin."""
    supabase = get_supabase()
    section = _get_section_with_subject(supabase, section_id)
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    
    user_id = user.get("user_id") or user.get("sub")
    role = user.get("role")
    
    if role == "TEACHER":
        if not _is_teacher_for_section(supabase, user_id, section_id):
            raise HTTPException(status_code=403, detail="You are not assigned to this section")
    elif not _can_manage_section(user, section["department_id"]):
        raise HTTPException(status_code=403, detail="Cannot assign students to this section")
    
    rows = [{"section_id": section_id, "student_id": sid} for sid in req.student_ids]
    if rows:
        supabase.table("section_students").upsert(
            rows,
            on_conflict="section_id,student_id",
        ).execute()
    
    return {"assigned": len(req.student_ids)}


@router.get("/sections/{section_id}/students")
def list_section_students(
    section_id: str,
    user: dict = Depends(get_current_user),
):
    """List students assigned to a section."""
    supabase = get_supabase()
    section = _get_section_with_subject(supabase, section_id)
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    
    result = supabase.table("section_students").select("student_id, students(id, reg_no, name, primary_image_url)").eq("section_id", section_id).execute()
    students = []
    for row in result.data or []:
        student_data = row.get("students", {})
        if student_data:
            students.append({
                "id": student_data.get("id"),
                "reg_no": student_data.get("reg_no"),
                "name": student_data.get("name"),
                "primary_image_url": student_data.get("primary_image_url"),
            })
    return students


@router.delete("/sections/{section_id}/students/{student_id}")
def remove_student_from_section(
    section_id: str,
    student_id: str,
    user: dict = Depends(require_teacher),
):
    """Remove a student from a section. Teacher (assigned) or Admin."""
    supabase = get_supabase()
    section = _get_section_with_subject(supabase, section_id)
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    
    user_id = user.get("user_id") or user.get("sub")
    role = user.get("role")
    
    if role == "TEACHER":
        if not _is_teacher_for_section(supabase, user_id, section_id):
            raise HTTPException(status_code=403, detail="You are not assigned to this section")
    elif not _can_manage_section(user, section["department_id"]):
        raise HTTPException(status_code=403, detail="Cannot remove student from this section")
    
    supabase.table("section_students").delete().eq("section_id", section_id).eq("student_id", student_id).execute()
    return {"status": "removed"}


# ==================== TEACHER'S SECTIONS ====================

@router.get("/my-sections")
def get_my_sections(
    user: dict = Depends(require_teacher),
):
    """Get sections assigned to the current teacher, grouped by subject."""
    supabase = get_supabase()
    user_id = user.get("user_id") or user.get("sub")
    role = user.get("role")
    
    if role == "TEACHER":
        st_result = supabase.table("section_teachers").select("section_id").eq("teacher_id", user_id).execute()
        section_ids = [r["section_id"] for r in (st_result.data or [])]
        if not section_ids:
            return []
        
        sections_result = supabase.table("sections").select("*, subjects(id, name, department_id)").in_("id", section_ids).execute()
    else:
        dept_id = user.get("department_id")
        if not dept_id:
            return []
        sections_result = supabase.table("sections").select("*, subjects(id, name, department_id)").execute()
        sections_result.data = [s for s in (sections_result.data or []) if s.get("subjects", {}).get("department_id") == dept_id]
    
    sections_by_subject = {}
    for sec in sections_result.data or []:
        subj = sec.pop("subjects", {})
        subject_id = subj.get("id")
        subject_name = subj.get("name")
        if subject_id not in sections_by_subject:
            sections_by_subject[subject_id] = {
                "subject_id": subject_id,
                "subject_name": subject_name,
                "sections": [],
            }
        sections_by_subject[subject_id]["sections"].append({
            "id": sec["id"],
            "name": sec["name"],
            "created_at": sec.get("created_at"),
        })
    
    return list(sections_by_subject.values())
