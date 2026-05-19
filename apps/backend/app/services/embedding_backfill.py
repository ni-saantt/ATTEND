"""
Generate face embeddings for students who have images but no embeddings.
Used by API and backfill script. Invalidates FAISS cache so recognition works immediately.
"""
import urllib.request
from typing import List, Tuple

from app.db.supabase import get_supabase
from app.face.pipeline import detect_and_embed, decode_image
from app.face.faiss_index import invalidate_college_index


def _fetch_image(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "Attend/1.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


def _upsert_embedding(supabase, student_id: str, pose: str, embedding_str: str) -> None:
    """Insert or replace embedding for (student_id, pose). Max 3 per student."""
    supabase.table("face_embeddings").delete().eq("student_id", student_id).eq("pose", pose).execute()
    supabase.table("face_embeddings").insert({
        "student_id": student_id,
        "embedding": embedding_str,
        "pose": pose,
    }).execute()


def generate_embeddings_for_college(college_id: str) -> dict:
    """
    Generate embeddings for students in college who have primary_image_url but no embeddings.
    Returns { generated: int, skipped: int, failed: List[str] }.
    Invalidates FAISS cache so recognition works without restart.
    """
    supabase = get_supabase()
    students = (
        supabase.table("students")
        .select("id, college_id, reg_no, name, primary_image_url, left_image_url, right_image_url")
        .eq("college_id", college_id)
        .execute()
    ).data or []

    if not students:
        return {"generated": 0, "skipped": 0, "failed": []}

    student_ids = [s["id"] for s in students]
    emb_result = supabase.table("face_embeddings").select("student_id").in_("student_id", student_ids).execute()
    has_embeddings = {str(r["student_id"]) for r in (emb_result.data or [])}

    to_process = [s for s in students if str(s["id"]) not in has_embeddings and s.get("primary_image_url")]

    generated = 0
    skipped = 0
    failed: List[str] = []

    for s in to_process:
        sid = str(s["id"])
        cid = str(s["college_id"])
        url = s.get("primary_image_url")
        if not url:
            skipped += 1
            continue
        try:
            img_bytes = _fetch_image(url)
            img = decode_image(img_bytes)
            faces = detect_and_embed(img)
            if not faces:
                skipped += 1
                continue

            emb = max(faces, key=lambda f: f["det_score"])["embedding"]
            embedding_str = "[" + ",".join(str(x) for x in emb) + "]"
            _upsert_embedding(supabase, sid, "front", embedding_str)
            invalidate_college_index(cid)
            generated += 1

            for url_key, pose in [("left_image_url", "left"), ("right_image_url", "right")]:
                extra_url = s.get(url_key)
                if not extra_url:
                    continue
                try:
                    extra_bytes = _fetch_image(extra_url)
                    extra_img = decode_image(extra_bytes)
                    extra_faces = detect_and_embed(extra_img)
                    if extra_faces:
                        extra_emb = max(extra_faces, key=lambda f: f["det_score"])["embedding"]
                        extra_str = "[" + ",".join(str(x) for x in extra_emb) + "]"
                        _upsert_embedding(supabase, sid, pose, extra_str)
                        invalidate_college_index(cid)
                        generated += 1
                except Exception:
                    pass
        except Exception as e:
            failed.append(f"{s.get('reg_no', '?')} {s.get('name', '?')}: {e}")

    return {"generated": generated, "skipped": skipped, "failed": failed}
