from typing import Optional

from fastapi import APIRouter, Depends, Query

from app.auth.deps import require_platform_admin
from app.db.supabase import get_supabase

router = APIRouter()


@router.get("/stats")
def get_stats(
    college_id: Optional[str] = Query(None, description="Filter stats by college"),
    user: dict = Depends(require_platform_admin),
):
    """Return usage stats: colleges, users, students, attendance records. Platform Owner only."""
    supabase = get_supabase()

    def count(table: str, col: Optional[str] = None, val: Optional[str] = None) -> int:
        q = supabase.table(table).select("id", count="exact", head=True)
        if col and val:
            q = q.eq(col, val)
        r = q.execute()
        return r.count or 0

    if college_id:
        # Per-college attendance: filter by students in this college
        students_res = supabase.table("students").select("id").eq("college_id", college_id).execute()
        student_ids = [s["id"] for s in (students_res.data or [])]
        att_count = 0
        if student_ids:
            att_res = supabase.table("attendance").select("id", count="exact", head=True).in_("student_id", student_ids).execute()
            att_count = att_res.count or 0
        return {
            "college_id": college_id,
            "users": count("users", "college_id", college_id),
            "students": count("students", "college_id", college_id),
            "attendance_records": att_count,
        }

    return {
        "colleges": count("colleges"),
        "users": count("users"),
        "students": count("students"),
        "attendance_records": count("attendance"),
    }
