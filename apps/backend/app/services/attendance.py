"""
Attendance: recognize faces, confirm, save.
"""
import base64
import uuid
import cv2
from datetime import date, datetime
from typing import List, Optional

from app.config import get_settings
from app.db.supabase import get_supabase
from app.face.pipeline import detect_and_embed, decode_image, crop_face
from app.face.faiss_index import get_or_build_college_index, search_index


# In-memory session for live stream: session_id -> set(student_ids)
_stream_sessions: dict = {}


def _get_enrolled_student_ids(supabase, subject_id: str) -> Optional[set]:
    """If subject has enrolled students, return their ids. Otherwise None (allow all)."""
    r = supabase.table("subject_students").select("student_id").eq("subject_id", subject_id).execute()
    if not r.data:
        return None
    ids = {str(row["student_id"]) for row in r.data}
    return ids if ids else None


def _get_section_student_ids(supabase, section_id: str) -> Optional[set]:
    """Get student IDs enrolled in a specific section."""
    r = supabase.table("section_students").select("student_id").eq("section_id", section_id).execute()
    if not r.data:
        return None
    ids = {str(row["student_id"]) for row in r.data}
    return ids if ids else None


def recognize_faces(
    image_bytes: bytes,
    college_id: str,
    subject_id: Optional[str] = None,
    section_id: Optional[str] = None,
    session_id: Optional[str] = None,
) -> tuple[List[dict], int, int]:
    """
    Recognize faces in image. Returns list of matches with student_id, name, confidence, etc.
    When section_id is provided, only returns matches for students in that section.
    Falls back to subject_id filtering if no section_id but subject has enrolled students.
    """
    supabase = get_supabase()
    index, id_list = get_or_build_college_index(supabase, college_id)
    if index is None or not id_list:
        return [], 0, 0

    enrolled_ids = None
    if section_id:
        enrolled_ids = _get_section_student_ids(supabase, section_id)
    elif subject_id:
        enrolled_ids = _get_enrolled_student_ids(supabase, subject_id)

    img = decode_image(image_bytes)
    faces = detect_and_embed(img)
    results = []
    seen_students = _stream_sessions.get(session_id, set()) if session_id else set()

    threshold = get_settings().recognition_threshold
    for f in faces:
        matches = search_index(index, id_list, f["embedding"], k=1, threshold=threshold)
        if not matches:
            results.append({
                "student_id": None,
                "student_name": None,
                "reg_no": None,
                "confidence": 0,
                "reference_image_url": None,
                "face_crop_base64": _crop_to_base64(img, f["bbox"]),
                "bbox": f["bbox"],
                "unknown": True,
            })
            continue

        student_id, score = matches[0]
        if enrolled_ids is not None and student_id not in enrolled_ids:
            results.append({
                "student_id": None,
                "student_name": None,
                "reg_no": None,
                "confidence": 0,
                "reference_image_url": None,
                "face_crop_base64": _crop_to_base64(img, f["bbox"]),
                "bbox": f["bbox"],
                "unknown": True,
            })
            continue
        if session_id and student_id in seen_students:
            continue  # Skip duplicate in stream mode (one entry per user per session)

        # Fetch student details
        student = supabase.table("students").select("id, name, reg_no, primary_image_url").eq("id", student_id).execute()
        if not student.data:
            continue
        s = student.data[0]

        results.append({
            "student_id": str(s["id"]),
            "student_name": s["name"],
            "reg_no": s["reg_no"],
            "confidence": score,
            "reference_image_url": s.get("primary_image_url"),
            "face_crop_base64": _crop_to_base64(img, f["bbox"]),
            "bbox": f["bbox"],
            "unknown": False,
        })

        if session_id:
            seen_students.add(student_id)

    if session_id:
        _stream_sessions[session_id] = seen_students

    h, w = img.shape[:2]
    return results, h, w


def _crop_to_base64(img, bbox) -> str:
    crop = crop_face(img, bbox)
    _, buf = cv2.imencode(".jpg", crop)
    return base64.b64encode(buf).decode("utf-8")


def save_attendance(
    student_id: str,
    subject_id: str,
    confidence: float,
    section_id: Optional[str] = None,
    face_crop_base64: Optional[str] = None,
) -> dict:
    """Save attendance record, optionally upload face crop to storage."""
    supabase = get_supabase()
    face_crop_url = None
    if face_crop_base64:
        crop_bytes = base64.b64decode(face_crop_base64)
        path = f"attendance/{subject_id}/{section_id or 'general'}/{student_id}/{uuid.uuid4()}.jpg"
        supabase.storage.from_("attendance-crops").upload(path, crop_bytes, file_options={"content-type": "image/jpeg"})
        face_crop_url = supabase.storage.from_("attendance-crops").get_public_url(path)

    record = {
        "student_id": student_id,
        "subject_id": subject_id,
        "attendance_date": date.today().isoformat(),
        "timestamp": datetime.now().isoformat(),
        "confidence": confidence,
        "face_crop_url": face_crop_url,
    }
    if section_id:
        record["section_id"] = section_id

    result = supabase.table("attendance").insert(record).execute()
    return result.data[0] if result.data else {}


def create_stream_session() -> str:
    """Create new stream session for live mode."""
    sid = str(uuid.uuid4())
    _stream_sessions[sid] = set()
    return sid


def clear_stream_session(session_id: str):
    """Clear stream session when done."""
    if session_id in _stream_sessions:
        del _stream_sessions[session_id]
