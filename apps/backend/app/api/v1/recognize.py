from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app.auth.deps import require_teacher, require_roles
from app.services.attendance import recognize_faces, create_stream_session, clear_stream_session

router = APIRouter()


@router.post("")
async def recognize(
    subject_id: str = Form(...),
    image: UploadFile = File(...),
    section_id: Optional[str] = Form(None),
    session_id: Optional[str] = Form(None),
    user: dict = Depends(require_teacher),
):
    college_id = user.get("college_id")
    if not college_id:
        raise HTTPException(status_code=400, detail="User must have college_id")

    try:
        image_bytes = await image.read()
        results, img_h, img_w = recognize_faces(
            image_bytes=image_bytes,
            college_id=college_id,
            subject_id=subject_id,
            section_id=section_id,
            session_id=session_id,
        )
        return {"results": results, "image_width": img_w, "image_height": img_h}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recognition failed: {str(e)}")


@router.post("/stream/start")
def stream_start(user: dict = Depends(require_teacher)):
    """Start a new live stream session."""
    session_id = create_stream_session()
    return {"session_id": session_id}


@router.post("/stream")
async def recognize_stream(
    session_id: str = Form(...),
    subject_id: str = Form(...),
    image: UploadFile = File(...),
    section_id: Optional[str] = Form(None),
    user: dict = Depends(require_teacher),
):
    college_id = user.get("college_id")
    if not college_id:
        raise HTTPException(status_code=400, detail="User must have college_id")

    image_bytes = await image.read()
    results, img_h, img_w = recognize_faces(
        image_bytes=image_bytes,
        college_id=college_id,
        subject_id=subject_id,
        section_id=section_id,
        session_id=session_id,
    )
    return {"results": results, "image_width": img_w, "image_height": img_h}


@router.post("/stream/end")
def stream_end(
    session_id: str = Form(...),
    user: dict = Depends(require_teacher),
):
    clear_stream_session(session_id)
    return {"status": "ok"}


@router.post("/test")
async def recognize_test(
    image: UploadFile = File(...),
    user: dict = Depends(require_roles("SUPER_ADMIN")),
):
    """Super admin only: test recognition without subject. Recognizes all students in college."""
    college_id = user.get("college_id")
    if not college_id:
        raise HTTPException(status_code=400, detail="Super admin must have college_id to test")

    try:
        image_bytes = await image.read()
        results, img_h, img_w = recognize_faces(
            image_bytes=image_bytes,
            college_id=college_id,
            subject_id=None,
            session_id=None,
        )
        return {"results": results, "image_width": img_w, "image_height": img_h}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recognition failed: {str(e)}")
