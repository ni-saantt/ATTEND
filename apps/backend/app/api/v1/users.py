from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth.deps import get_current_user, require_platform_admin, require_super_admin, require_dept_admin
from app.auth.jwt import hash_password
from app.db.supabase import get_supabase
from app.services.email import (
    generate_verification_token,
    send_verification_email,
    send_super_admin_welcome_email,
    verification_expires_at,
)
from pydantic import BaseModel

router = APIRouter()


class CreateUserRequest(BaseModel):
    email: str
    password: str
    role: str
    name: Optional[str] = None
    contact_number: Optional[str] = None
    college_id: Optional[str] = None
    department_id: Optional[str] = None


def _can_create_role(creator_role: str, target_role: str) -> bool:
    allowed = {
        "PLATFORM_ADMIN": ["SUPER_ADMIN"],
        "SUPER_ADMIN": ["DEPARTMENT_ADMIN"],
        "DEPARTMENT_ADMIN": ["TEACHER"],
    }
    return target_role in allowed.get(creator_role, [])


@router.post("")
def create_user(
    req: CreateUserRequest,
    user: dict = Depends(get_current_user),
):
    # RBAC: Platform Admin can create Super Admin; Super Admin can create Dept Admin; Dept Admin can create Teacher
    creator_role = user.get("role")
    if req.role == "DEPARTMENT_ADMIN" and creator_role != "SUPER_ADMIN":
        raise HTTPException(status_code=403, detail="Only Super Admin can create Department Admins")
    if creator_role == "PLATFORM_ADMIN":
        if req.role != "SUPER_ADMIN" or not req.college_id:
            raise HTTPException(status_code=400, detail="Platform Admin must create SUPER_ADMIN with college_id")
    elif creator_role == "SUPER_ADMIN":
        if req.role != "DEPARTMENT_ADMIN" or not req.college_id or not req.department_id:
            raise HTTPException(status_code=400, detail="Super Admin must create DEPARTMENT_ADMIN with college_id and department_id")
        if str(user.get("college_id")) != req.college_id:
            raise HTTPException(status_code=403, detail="Cannot create user for another college")
    elif creator_role == "DEPARTMENT_ADMIN":
        if req.role != "TEACHER" or not req.college_id or not req.department_id:
            raise HTTPException(status_code=400, detail="Dept Admin must create TEACHER with college_id and department_id")
        if str(user.get("college_id")) != req.college_id or str(user.get("department_id")) != req.department_id:
            raise HTTPException(status_code=403, detail="Cannot create user outside your department")
    else:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    supabase = get_supabase()
    token = generate_verification_token()
    data = {
        "email": req.email.strip().lower(),
        "password_hash": hash_password(req.password),
        "role": req.role,
        "name": req.name,
        "contact_number": req.contact_number,
        "college_id": req.college_id,
        "department_id": req.department_id,
        "email_verified": False,
        "email_verification_token": token,
        "email_verification_expires_at": verification_expires_at().isoformat(),
    }
    result = supabase.table("users").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create user")

    if creator_role == "PLATFORM_ADMIN" and req.role == "SUPER_ADMIN" and req.college_id:
        college_row = supabase.table("colleges").select("name").eq("id", req.college_id).execute()
        college_name = college_row.data[0]["name"] if college_row.data else "your college"
        send_super_admin_welcome_email(req.email, token, college_name)
    else:
        send_verification_email(req.email, token)
    return {"id": str(result.data[0]["id"]), "email": req.email, "role": req.role, "name": req.name, "contact_number": req.contact_number}


@router.get("")
def list_users(
    college_id: Optional[str] = None,
    department_id: Optional[str] = None,
    user: dict = Depends(get_current_user),
):
    """List users. Pass college_id/department_id as query params to filter."""
    supabase = get_supabase()
    role = user.get("role")
    college_id_filter = user.get("college_id") if role in ("SUPER_ADMIN", "DEPARTMENT_ADMIN", "TEACHER") else college_id
    dept_filter = user.get("department_id") if role in ("DEPARTMENT_ADMIN", "TEACHER") else department_id

    q = supabase.table("users").select("id, email, role, name, contact_number, college_id, department_id, created_at")
    if college_id_filter:
        q = q.eq("college_id", college_id_filter)
    if dept_filter:
        q = q.eq("department_id", dept_filter)
    result = q.execute()
    return result.data or []


def _can_delete_user(actor_role: str, target_role: str, actor_college_id: Optional[str], actor_dept_id: Optional[str], target_college_id: Optional[str], target_dept_id: Optional[str]) -> bool:
    """Platform Admin can delete Super Admin; Super Admin can delete Dept Admin/Teacher in their college; Dept Admin can delete Teacher in their dept."""
    if actor_role == "PLATFORM_ADMIN":
        return target_role == "SUPER_ADMIN"
    if actor_role == "SUPER_ADMIN":
        return target_role in ("DEPARTMENT_ADMIN", "TEACHER") and str(actor_college_id) == str(target_college_id)
    if actor_role == "DEPARTMENT_ADMIN":
        return target_role == "TEACHER" and str(actor_college_id) == str(target_college_id) and str(actor_dept_id) == str(target_dept_id)
    return False


@router.delete("/{user_id}")
def delete_user(
    user_id: str,
    user: dict = Depends(get_current_user),
):
    """Delete a user. RBAC: Platform Admin can delete Super Admin; Super Admin can delete Dept Admin/Teacher; Dept Admin can delete Teacher."""
    supabase = get_supabase()
    result = supabase.table("users").select("id, email, role, college_id, department_id").eq("id", user_id).execute()
    if not result.data or len(result.data) == 0:
        raise HTTPException(status_code=404, detail="User not found")
    target = result.data[0]
    actor_role = user.get("role")
    if not _can_delete_user(
        actor_role,
        target["role"],
        user.get("college_id"),
        user.get("department_id"),
        target.get("college_id"),
        target.get("department_id"),
    ):
        raise HTTPException(status_code=403, detail="Cannot delete this user")
    supabase.table("users").delete().eq("id", user_id).execute()
    return {"message": "User deleted"}
