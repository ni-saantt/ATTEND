"""
Student enrollment: 3 face images -> detect, extract embedding, store.
Storage: primary-faces bucket, path {college_id}/{student_id}/primary.jpg, left.jpg, right.jpg.
"""
import uuid
from typing import List, Optional

from app.config import get_settings
from app.db.supabase import get_supabase
from app.face.pipeline import detect_and_embed, decode_image
from app.face.faiss_index import invalidate_college_index


def enroll_student(
    reg_no: str,
    name: str,
    college_id: str,
    department_id: str,
    front_image_bytes: bytes,
    left_image_bytes: bytes,
    right_image_bytes: bytes,
    created_by: Optional[str] = None,
    subject_ids: Optional[List[str]] = None,
) -> dict:
    """
    Enroll student with 3 images. Uses front for primary embedding and storage.
    """
    supabase = get_supabase()

    # Decode and detect in all 3 images
    front_img = decode_image(front_image_bytes)
    left_img = decode_image(left_image_bytes)
    right_img = decode_image(right_image_bytes)
    front_faces = detect_and_embed(front_img)
    left_faces = detect_and_embed(left_img)
    right_faces = detect_and_embed(right_img)
    if not front_faces:
        raise ValueError("No face detected in front image")
    if not left_faces or not right_faces:
        raise ValueError("Face must be detected in all 3 images")

    # Extract best embedding from each pose
    front_emb = max(front_faces, key=lambda f: f["det_score"])["embedding"]
    left_emb = max(left_faces, key=lambda f: f["det_score"])["embedding"]
    right_emb = max(right_faces, key=lambda f: f["det_score"])["embedding"]

    # Create student record - all 3 images in primary-faces bucket
    student_id = str(uuid.uuid4())
    bucket = get_settings().bucket_primary_faces
    base_path = f"{college_id}/{student_id}"

    supabase.storage.from_(bucket).upload(
        f"{base_path}/primary.jpg",
        front_image_bytes,
        file_options={"content-type": "image/jpeg"},
    )
    supabase.storage.from_(bucket).upload(
        f"{base_path}/left.jpg",
        left_image_bytes,
        file_options={"content-type": "image/jpeg"},
    )
    supabase.storage.from_(bucket).upload(
        f"{base_path}/right.jpg",
        right_image_bytes,
        file_options={"content-type": "image/jpeg"},
    )

    student_data = {
        "id": student_id,
        "reg_no": reg_no,
        "name": name,
        "college_id": college_id,
        "department_id": department_id,
        "primary_image_url": supabase.storage.from_(bucket).get_public_url(f"{base_path}/primary.jpg"),
        "left_image_url": supabase.storage.from_(bucket).get_public_url(f"{base_path}/left.jpg"),
        "right_image_url": supabase.storage.from_(bucket).get_public_url(f"{base_path}/right.jpg"),
    }
    if created_by:
        student_data["created_by"] = created_by
    supabase.table("students").insert(student_data).execute()

    # Insert 3 embeddings (front, left, right) - one per pose
    for pose, emb in [("front", front_emb), ("left", left_emb), ("right", right_emb)]:
        embedding_str = "[" + ",".join(str(x) for x in emb) + "]"
        supabase.table("face_embeddings").insert({
            "student_id": student_id,
            "embedding": embedding_str,
            "pose": pose,
        }).execute()

    # Enroll in subjects if provided
    if subject_ids:
        for subject_id in subject_ids:
            supabase.table("subject_students").insert({
                "subject_id": subject_id,
                "student_id": student_id,
            }).execute()

    # Invalidate FAISS cache for this college
    invalidate_college_index(college_id)

    return {
        "id": student_id,
        "reg_no": reg_no,
        "name": name,
        "primary_image_url": student_data["primary_image_url"],
    }


def add_face_embeddings(
    student_id: str,
    left_image_bytes: Optional[bytes] = None,
    right_image_bytes: Optional[bytes] = None,
) -> dict:
    """Add left and/or right face images + embeddings. Uses primary-faces bucket, same path structure as enrollment."""
    if not left_image_bytes and not right_image_bytes:
        raise ValueError("At least one of left or right image is required")

    supabase = get_supabase()
    bucket = get_settings().bucket_primary_faces
    row = supabase.table("students").select("college_id").eq("id", student_id).execute()
    if not row.data:
        raise ValueError("Student not found")
    college_id = str(row.data[0]["college_id"])
    base_path = f"{college_id}/{student_id}"

    updates = {}
    embeddings_to_add = []

    if left_image_bytes:
        left_img = decode_image(left_image_bytes)
        left_faces = detect_and_embed(left_img)
        if not left_faces:
            raise ValueError("No face detected in left image")
        emb = max(left_faces, key=lambda f: f["det_score"])["embedding"]
        embeddings_to_add.append(("left", emb))
        supabase.storage.from_(bucket).upload(
            f"{base_path}/left.jpg",
            left_image_bytes,
            file_options={"content-type": "image/jpeg"},
        )
        updates["left_image_url"] = supabase.storage.from_(bucket).get_public_url(f"{base_path}/left.jpg")

    if right_image_bytes:
        right_img = decode_image(right_image_bytes)
        right_faces = detect_and_embed(right_img)
        if not right_faces:
            raise ValueError("No face detected in right image")
        emb = max(right_faces, key=lambda f: f["det_score"])["embedding"]
        embeddings_to_add.append(("right", emb))
        supabase.storage.from_(bucket).upload(
            f"{base_path}/right.jpg",
            right_image_bytes,
            file_options={"content-type": "image/jpeg"},
        )
        updates["right_image_url"] = supabase.storage.from_(bucket).get_public_url(f"{base_path}/right.jpg")

    # Replace embeddings by pose (delete existing, then insert)
    for pose, emb in embeddings_to_add:
        supabase.table("face_embeddings").delete().eq("student_id", student_id).eq("pose", pose).execute()
        embedding_str = "[" + ",".join(str(x) for x in emb) + "]"
        supabase.table("face_embeddings").insert({
            "student_id": student_id,
            "embedding": embedding_str,
            "pose": pose,
        }).execute()

    if updates:
        supabase.table("students").update(updates).eq("id", student_id).execute()

    invalidate_college_index(college_id)
    return {"message": "Face images and embeddings added", "student_id": student_id}
