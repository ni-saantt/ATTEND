import uuid
from typing import Optional, List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.auth.deps import get_current_user, require_platform_admin, require_super_admin
from app.db.supabase import get_supabase
from pydantic import BaseModel

router = APIRouter()

ALLOWED_LOGO_TYPES = {"image/jpeg", "image/png", "image/webp", "image/svg+xml"}
MAX_LOGO_SIZE = 5 * 1024 * 1024  # 5MB


class CreateCollegeRequest(BaseModel):
    name: str
    logo_url: Optional[str] = None


class UpdateCollegeRequest(BaseModel):
    name: Optional[str] = None
    logo_url: Optional[str] = None


class CollegeResponse(BaseModel):
    id: str
    name: str
    logo_url: Optional[str]
    created_at: str


@router.post("/upload-logo")
def upload_logo(
    file: UploadFile = File(...),
    user: dict = Depends(require_super_admin),
):
    """Upload a college logo image. Returns the public URL."""
    if file.content_type not in ALLOWED_LOGO_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_LOGO_TYPES)}",
        )
    contents = file.file.read()
    if len(contents) > MAX_LOGO_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Max 5MB.")
    ext = "jpg" if file.content_type == "image/jpeg" else file.filename.split(".")[-1] if file.filename else "png"
    if ext not in ("jpg", "jpeg", "png", "webp", "svg"):
        ext = "png"
    path = f"{uuid.uuid4()}.{ext}"
    supabase = get_supabase()
    supabase.storage.from_("college-logos").upload(
        path,
        contents,
        file_options={"content-type": file.content_type or "image/png"},
    )
    url = supabase.storage.from_("college-logos").get_public_url(path)
    return {"url": url}


@router.post("", response_model=CollegeResponse)
def create_college(
    req: CreateCollegeRequest,
    user: dict = Depends(require_platform_admin),
):
    supabase = get_supabase()
    data = {"name": req.name}
    if req.logo_url is not None:
        data["logo_url"] = req.logo_url
    result = supabase.table("colleges").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create college")
    row = result.data[0]
    return CollegeResponse(
        id=str(row["id"]),
        name=row["name"],
        logo_url=row.get("logo_url"),
        created_at=row["created_at"],
    )


@router.get("", response_model=List[CollegeResponse])
def list_colleges(user: dict = Depends(require_super_admin)):
    supabase = get_supabase()
    q = supabase.table("colleges").select("*").order("created_at", desc=True)
    if user.get("role") == "SUPER_ADMIN" and user.get("college_id"):
        q = q.eq("id", user["college_id"])
    result = q.execute()
    return [
        CollegeResponse(
            id=str(r["id"]),
            name=r["name"],
            logo_url=r.get("logo_url"),
            created_at=r["created_at"],
        )
        for r in result.data or []
    ]


@router.get("/{college_id}", response_model=CollegeResponse)
def get_college(
    college_id: str,
    user: dict = Depends(get_current_user),
):
    supabase = get_supabase()
    if user.get("role") == "PLATFORM_ADMIN":
        pass
    elif user.get("role") == "SUPER_ADMIN" and str(user.get("college_id")) == college_id:
        pass
    else:
        raise HTTPException(status_code=403, detail="Cannot access this college")
    result = supabase.table("colleges").select("*").eq("id", college_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="College not found")
    r = result.data[0]
    return CollegeResponse(
        id=str(r["id"]),
        name=r["name"],
        logo_url=r.get("logo_url"),
        created_at=r["created_at"],
    )


@router.patch("/{college_id}", response_model=CollegeResponse)
def update_college(
    college_id: str,
    req: UpdateCollegeRequest,
    user: dict = Depends(get_current_user),
):
    supabase = get_supabase()
    if user.get("role") == "PLATFORM_ADMIN":
        pass
    elif user.get("role") == "SUPER_ADMIN" and str(user.get("college_id") or "") == college_id:
        pass
    else:
        raise HTTPException(status_code=403, detail="Cannot update this college")
    result = supabase.table("colleges").select("id").eq("id", college_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="College not found")
    updates = {}
    if req.name is not None:
        if not str(req.name).strip():
            raise HTTPException(status_code=400, detail="Name cannot be empty")
        updates["name"] = req.name.strip()
    if req.logo_url is not None:
        updates["logo_url"] = req.logo_url if req.logo_url else None
    if not updates:
        raise HTTPException(status_code=400, detail="Provide name and/or logo_url to update")
    try:
        supabase.table("colleges").update(updates).eq("id", college_id).execute()
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}",
        )
    row = supabase.table("colleges").select("*").eq("id", college_id).execute().data[0]
    return CollegeResponse(
        id=str(row["id"]),
        name=row["name"],
        logo_url=row.get("logo_url"),
        created_at=row["created_at"],
    )
