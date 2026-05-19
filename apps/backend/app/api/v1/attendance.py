from typing import List, Optional
import re

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from app.auth.deps import get_current_user, require_teacher, require_dept_admin
from app.config import get_settings
from app.db.supabase import get_supabase
from app.services.attendance import save_attendance
from pydantic import BaseModel
import io
import pandas as pd
from datetime import datetime

router = APIRouter()


def _extract_storage_path(face_crop_url: Optional[str]) -> Optional[str]:
    """Extract storage path from face_crop_url for bucket deletion."""
    if not face_crop_url:
        return None
    m = re.search(r"/attendance-crops/(.+)$", face_crop_url)
    return m.group(1) if m else None


class AttendanceRecord(BaseModel):
    student_id: str
    subject_id: str
    confidence: float
    section_id: Optional[str] = None
    face_crop_base64: Optional[str] = None


class ConfirmAttendanceRequest(BaseModel):
    records: List[AttendanceRecord]


@router.post("")
def confirm_attendance(
    req: ConfirmAttendanceRequest,
    user: dict = Depends(require_teacher),
):
    results = []
    for r in req.records:
        rec = save_attendance(
            student_id=r.student_id,
            subject_id=r.subject_id,
            confidence=r.confidence,
            section_id=r.section_id,
            face_crop_base64=r.face_crop_base64,
        )
        results.append(rec)
    return {"saved": len(results), "records": results}


@router.get("/list")
def list_attendance(
    subject_id: str,
    section_id: Optional[str] = None,
    user: dict = Depends(get_current_user),
):
    """List attendance records for a subject (optionally filtered by section) with student info and face_crop_url."""
    role = user.get("role")
    if role not in ("TEACHER", "DEPARTMENT_ADMIN", "PLATFORM_ADMIN", "SUPER_ADMIN"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    supabase = get_supabase()
    if role == "DEPARTMENT_ADMIN":
        subj = supabase.table("subjects").select("department_id").eq("id", subject_id).execute()
        if subj.data and str(user.get("department_id")) != str(subj.data[0].get("department_id")):
            raise HTTPException(status_code=403, detail="Cannot access this subject")
    elif role == "TEACHER":
        user_id = user.get("user_id") or user.get("sub")
        st = supabase.table("subject_teachers").select("subject_id").eq("teacher_id", user_id).execute()
        teacher_subject_ids = {r["subject_id"] for r in (st.data or [])}
        if subject_id not in teacher_subject_ids:
            raise HTTPException(status_code=403, detail="Cannot access this subject")
    
    q = supabase.table("attendance").select(
        "id, student_id, subject_id, section_id, timestamp, attendance_date, confidence, face_crop_url, "
        "students(reg_no, name), subjects(name), sections(name)"
    ).eq("subject_id", subject_id)
    
    if section_id:
        q = q.eq("section_id", section_id)
    
    result = q.order("timestamp", desc=False).execute()
    return result.data or []


@router.delete("/{attendance_id}")
def delete_attendance(
    attendance_id: str,
    user: dict = Depends(get_current_user),
):
    """Delete attendance record and remove face crop from bucket."""
    role = user.get("role")
    if role not in ("TEACHER", "DEPARTMENT_ADMIN", "PLATFORM_ADMIN", "SUPER_ADMIN"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    supabase = get_supabase()
    row = supabase.table("attendance").select("id, subject_id, face_crop_url").eq("id", attendance_id).execute()
    if row.data:
        subj_id = row.data[0].get("subject_id")
        if role == "DEPARTMENT_ADMIN":
            subj = supabase.table("subjects").select("department_id").eq("id", subj_id).execute()
            if subj.data and str(user.get("department_id")) != str(subj.data[0].get("department_id")):
                raise HTTPException(status_code=403, detail="Cannot delete this record")
        elif role == "TEACHER":
            user_id = user.get("user_id") or user.get("sub")
            st = supabase.table("subject_teachers").select("subject_id").eq("teacher_id", user_id).execute()
            teacher_subject_ids = {r["subject_id"] for r in (st.data or [])}
            if subj_id not in teacher_subject_ids:
                raise HTTPException(status_code=403, detail="Cannot delete this record")
    if not row.data:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    rec = row.data[0]
    path = _extract_storage_path(rec.get("face_crop_url"))
    if path:
        bucket = get_settings().bucket_attendance_crops
        try:
            supabase.storage.from_(bucket).remove([path])
        except Exception:
            pass
    supabase.table("attendance").delete().eq("id", attendance_id).execute()
    return {"message": "Deleted"}


@router.get("/subjects-with-reports")
def subjects_with_reports(
    department_id: Optional[str] = None,
    user: dict = Depends(get_current_user),
):
    """Return subjects that have at least one attendance record. Avoids showing Download for empty subjects."""
    role = user.get("role")
    if role not in ("TEACHER", "DEPARTMENT_ADMIN", "PLATFORM_ADMIN", "SUPER_ADMIN"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    supabase = get_supabase()
    dept_id = department_id or user.get("department_id")
    if not dept_id:
        raise HTTPException(status_code=400, detail="department_id required")
    if role == "DEPARTMENT_ADMIN" and str(user.get("department_id")) != str(dept_id):
        raise HTTPException(status_code=403, detail="Cannot access another department")
    # Subjects in this department that have at least one attendance record
    att = supabase.table("attendance").select("subject_id").execute()
    subject_ids_with_att = list({r["subject_id"] for r in (att.data or [])})
    if not subject_ids_with_att:
        return []
    subs = supabase.table("subjects").select("id, name").eq("department_id", dept_id).in_("id", subject_ids_with_att).execute()
    if role == "TEACHER":
        user_id = user.get("user_id") or user.get("sub")
        st = supabase.table("subject_teachers").select("subject_id").eq("teacher_id", user_id).execute()
        teacher_subject_ids = {r["subject_id"] for r in (st.data or [])}
        return [s for s in (subs.data or []) if s["id"] in teacher_subject_ids]
    return subs.data or []


def _check_subject_access(supabase, user: dict, subject_id: str) -> None:
    """Raise 403 if user cannot access this subject."""
    role = user.get("role")
    if role == "DEPARTMENT_ADMIN":
        subj = supabase.table("subjects").select("department_id").eq("id", subject_id).execute()
        if subj.data and str(user.get("department_id")) != str(subj.data[0].get("department_id")):
            raise HTTPException(status_code=403, detail="Cannot access this subject")
    elif role == "TEACHER":
        user_id = user.get("user_id") or user.get("sub")
        st = supabase.table("subject_teachers").select("subject_id").eq("teacher_id", user_id).execute()
        teacher_subject_ids = {r["subject_id"] for r in (st.data or [])}
        if subject_id not in teacher_subject_ids:
            raise HTTPException(status_code=403, detail="Cannot access this subject")


@router.delete("/report/subject/{subject_id}")
def delete_subject_report(
    subject_id: str,
    user: dict = Depends(get_current_user),
):
    """Delete entire attendance report for a subject: all records and all images from bucket."""
    role = user.get("role")
    if role not in ("TEACHER", "DEPARTMENT_ADMIN", "PLATFORM_ADMIN", "SUPER_ADMIN"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    supabase = get_supabase()
    _check_subject_access(supabase, user, subject_id)
    rows = supabase.table("attendance").select("id, face_crop_url").eq("subject_id", subject_id).execute()
    bucket = get_settings().bucket_attendance_crops
    for r in (rows.data or []):
        path = _extract_storage_path(r.get("face_crop_url"))
        if path:
            try:
                supabase.storage.from_(bucket).remove([path])
            except Exception:
                pass
    supabase.table("attendance").delete().eq("subject_id", subject_id).execute()
    return {"message": "Report deleted", "deleted": len(rows.data or [])}


@router.get("/report")
def attendance_report(
    subject_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    user: dict = Depends(get_current_user),
):
    """Generate Excel attendance report."""
    supabase = get_supabase()
    role = user.get("role")
    if role not in ("TEACHER", "DEPARTMENT_ADMIN", "PLATFORM_ADMIN", "SUPER_ADMIN"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    # Fetch attendance with student and subject info
    q = supabase.table("attendance").select(
        "id, student_id, subject_id, timestamp, attendance_date, confidence, students(reg_no, name), subjects(name)"
    ).eq("subject_id", subject_id)

    if start_date:
        q = q.gte("timestamp", start_date)
    if end_date:
        q = q.lte("timestamp", end_date)

    result = q.order("timestamp", desc=False).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="No attendance data found")

    # Flatten for DataFrame
    rows = []
    for r in result.data:
        student = r.get("students") or {}
        subject = r.get("subjects") or {}
        ts = r.get("timestamp") or r.get("attendance_date")
        ts_str = str(ts) if ts else ""
        rows.append({
            "Date": ts_str[:10] if ts_str else "",
            "Time": ts_str[11:19] if len(ts_str) > 11 else "",
            "Reg No": student.get("reg_no", ""),
            "Student Name": student.get("name", ""),
            "Subject": subject.get("name", ""),
            "Confidence": r.get("confidence", 0),
        })

    df = pd.DataFrame(rows)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Attendance")
    output.seek(0)

    filename = f"attendance_report_{subject_id}_{datetime.now().strftime('%Y%m%d')}.xlsx"
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


def _fetch_attendance_for_report(supabase, subject_id: str, start_date: Optional[str], end_date: Optional[str]):
    q = supabase.table("attendance").select(
        "id, student_id, subject_id, timestamp, attendance_date, confidence, face_crop_url, "
        "students(reg_no, name), subjects(name)"
    ).eq("subject_id", subject_id)
    if start_date:
        q = q.gte("timestamp", start_date)
    if end_date:
        q = q.lte("timestamp", end_date)
    result = q.order("timestamp", desc=False).execute()
    return result.data or []


@router.get("/report/simple-excel")
def attendance_report_simple_excel(
    subject_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    user: dict = Depends(get_current_user),
):
    """Simplified Excel: Subject heading, Time, Student Name, Reg No only."""
    role = user.get("role")
    if role not in ("TEACHER", "DEPARTMENT_ADMIN", "PLATFORM_ADMIN", "SUPER_ADMIN"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    supabase = get_supabase()
    _check_subject_access(supabase, user, subject_id)
    data = _fetch_attendance_for_report(supabase, subject_id, start_date, end_date)
    if not data:
        raise HTTPException(status_code=404, detail="No attendance data found")
    subject_name = (data[0].get("subjects") or {}).get("name", "")
    rows = []
    for r in data:
        student = r.get("students") or {}
        ts = r.get("timestamp") or r.get("attendance_date")
        ts_str = str(ts) if ts else ""
        rows.append({
            "Subject": subject_name,
            "Time": ts_str[:19] if ts_str else "",
            "Student Name": student.get("name", ""),
            "Reg No": student.get("reg_no", ""),
        })
    df = pd.DataFrame(rows)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Attendance")
    output.seek(0)
    filename = f"attendance_{subject_name.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}.xlsx"
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/report/simple-pdf")
def attendance_report_simple_pdf(
    subject_id: str,
    attendance_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    user: dict = Depends(get_current_user),
):
    """Simplified PDF: Subject heading, Time, Student Name, Reg No. Use attendance_id for single record."""
    role = user.get("role")
    if role not in ("TEACHER", "DEPARTMENT_ADMIN", "PLATFORM_ADMIN", "SUPER_ADMIN"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    supabase = get_supabase()
    _check_subject_access(supabase, user, subject_id)
    if attendance_id:
        row = supabase.table("attendance").select(
            "id, student_id, subject_id, timestamp, attendance_date, students(reg_no, name), subjects(name)"
        ).eq("id", attendance_id).execute()
        data = row.data or []
    else:
        data = _fetch_attendance_for_report(supabase, subject_id, start_date, end_date)
    if not data:
        raise HTTPException(status_code=404, detail="No attendance data found")
    from fpdf import FPDF
    from fpdf.fonts import FontFace
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("helvetica", "B", 14)
    subject_name = (data[0].get("subjects") or {}).get("name", "Attendance")
    pdf.cell(0, 10, f"Subject: {subject_name}", ln=True)
    pdf.set_font("helvetica", "", 10)
    pdf.ln(4)
    headings_style = FontFace(emphasis="BOLD", fill_color=(240, 240, 240))
    with pdf.table(
        col_widths=(1, 1, 3, 1),
        headings_style=headings_style,
        text_align=("CENTER", "LEFT", "LEFT", "LEFT"),
    ) as table:
        row = table.row()
        row.cell("#")
        row.cell("Reg No")
        row.cell("Name")
        row.cell("Time")
        for i, r in enumerate(data, 1):
            student = r.get("students") or {}
            ts = r.get("timestamp") or r.get("attendance_date")
            ts_str = str(ts)[:19] if ts else ""
            row = table.row()
            row.cell(str(i))
            row.cell(student.get("reg_no", ""))
            row.cell(student.get("name", ""))
            row.cell(ts_str)
    output = io.BytesIO()
    pdf.output(output)
    output.seek(0)
    filename = f"attendance_{subject_name.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}.pdf"
    return StreamingResponse(
        output,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
