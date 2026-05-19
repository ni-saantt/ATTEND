from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import HTMLResponse

from app.auth.deps import get_current_user
from app.auth.jwt import verify_password, create_access_token
from app.db.supabase import get_supabase
from app.services.email import generate_verification_token, send_verification_email, verification_expires_at
from pydantic import BaseModel

router = APIRouter()

_TEMPLATES_DIR = Path(__file__).resolve().parent.parent.parent / "templates"


def _verify_error_page(title: str, message: str, status_code: int = 400) -> HTMLResponse:
    path = _TEMPLATES_DIR / "verify_error.html"
    html = path.read_text(encoding="utf-8").replace("{{ title }}", title).replace("{{ message }}", message)
    return HTMLResponse(content=html, status_code=status_code)


class LoginRequest(BaseModel):
    email: str
    password: str


class ResendVerificationRequest(BaseModel):
    email: str


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    contact_number: Optional[str] = None


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


@router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest):
    supabase = get_supabase()
    email = req.email.strip().lower()
    password = req.password.strip()

    result = supabase.table("users").select("*").ilike("email", email).execute()

    if not result.data or len(result.data) == 0:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    user = result.data[0]
    password_hash = user.get("password_hash")
    if not password_hash or not verify_password(password, password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.get("email_verified", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="email_not_verified",
        )

    token = create_access_token(
        data={
            "sub": str(user["id"]),
            "user_id": str(user["id"]),
            "email": user["email"],
            "role": user["role"],
            "college_id": str(user["college_id"]) if user.get("college_id") else None,
            "department_id": str(user["department_id"]) if user.get("department_id") else None,
        }
    )

    created_at = user.get("created_at")
    college_name = None
    college_logo_url = None
    if user.get("college_id"):
        college_row = supabase.table("colleges").select("name, logo_url").eq("id", user["college_id"]).execute()
        if college_row.data:
            college_name = college_row.data[0].get("name")
            college_logo_url = college_row.data[0].get("logo_url")
    user_response = {
        "id": str(user["id"]),
        "email": user["email"],
        "role": user["role"],
        "name": user.get("name"),
        "contact_number": user.get("contact_number"),
        "college_id": str(user["college_id"]) if user.get("college_id") else None,
        "college_name": college_name,
        "college_logo_url": college_logo_url,
        "department_id": str(user["department_id"]) if user.get("department_id") else None,
        "created_at": str(created_at) if created_at is not None else "",
    }

    return LoginResponse(
        access_token=token,
        user=user_response,
    )


@router.get("/me")
def get_me(user: dict = Depends(get_current_user)):
    """Return current user with college_name, name, contact_number. Fetches from DB for full profile."""
    supabase = get_supabase()
    user_id = user.get("sub") or user.get("user_id")
    db_user = supabase.table("users").select("name, contact_number, college_id, department_id, role").eq("id", user_id).execute()
    row = db_user.data[0] if db_user.data else {}
    college_name = None
    college_logo_url = None
    if row.get("college_id"):
        college_row = supabase.table("colleges").select("name, logo_url").eq("id", row["college_id"]).execute()
        if college_row.data:
            college_name = college_row.data[0].get("name")
            college_logo_url = college_row.data[0].get("logo_url")
    return {
        "id": user_id,
        "email": user.get("email"),
        "role": row.get("role") or user.get("role"),
        "name": row.get("name"),
        "contact_number": row.get("contact_number"),
        "college_id": str(row["college_id"]) if row.get("college_id") else None,
        "college_name": college_name,
        "college_logo_url": college_logo_url,
        "department_id": str(row["department_id"]) if row.get("department_id") else None,
        "created_at": "",
    }


@router.patch("/me")
def update_me(req: UpdateProfileRequest, user: dict = Depends(get_current_user)):
    """Current user updates their own name and/or contact_number."""
    supabase = get_supabase()
    user_id = user.get("sub") or user.get("user_id")
    updates = {}
    if req.name is not None:
        updates["name"] = req.name
    if req.contact_number is not None:
        updates["contact_number"] = req.contact_number
    if not updates:
        raise HTTPException(status_code=400, detail="Provide name and/or contact_number to update")
    supabase.table("users").update(updates).eq("id", user_id).execute()
    db_user = supabase.table("users").select("name, contact_number, college_id, department_id, role").eq("id", user_id).execute()
    row = db_user.data[0] if db_user.data else {}
    college_name = None
    college_logo_url = None
    if row.get("college_id"):
        college_row = supabase.table("colleges").select("name, logo_url").eq("id", row["college_id"]).execute()
        if college_row.data:
            college_name = college_row.data[0].get("name")
            college_logo_url = college_row.data[0].get("logo_url")
    return {
        "id": user_id,
        "email": user.get("email"),
        "role": row.get("role") or user.get("role"),
        "name": row.get("name"),
        "contact_number": row.get("contact_number"),
        "college_id": str(row["college_id"]) if row.get("college_id") else None,
        "college_name": college_name,
        "college_logo_url": college_logo_url,
        "department_id": str(row["department_id"]) if row.get("department_id") else None,
        "created_at": "",
    }


@router.get("/verify-email", response_class=HTMLResponse)
def verify_email(token: str):
    """Verify email via token from link. Returns HTML for browser."""
    supabase = get_supabase()
    result = supabase.table("users").select("id, email_verification_expires_at").eq("email_verification_token", token).execute()
    if not result.data or len(result.data) == 0:
        return _verify_error_page("Invalid or expired link", "Please request a new verification email from the app.", 400)
    user = result.data[0]
    expires = user.get("email_verification_expires_at")
    if expires:
        exp_dt = datetime.fromisoformat(expires.replace("Z", "+00:00")) if isinstance(expires, str) else expires
        if exp_dt.tzinfo is None:
            exp_dt = exp_dt.replace(tzinfo=timezone.utc)
        if exp_dt < datetime.now(timezone.utc):
            return _verify_error_page("Link expired", "Please request a new verification email from the app.", 400)
    supabase.table("users").update({
        "email_verified": True,
        "email_verification_token": None,
        "email_verification_expires_at": None,
    }).eq("id", user["id"]).execute()

    html = (_TEMPLATES_DIR / "verify_success.html").read_text(encoding="utf-8")
    return HTMLResponse(content=html)


@router.post("/resend-verification")
def resend_verification(req: ResendVerificationRequest):
    """Resend verification email for unverified user."""
    supabase = get_supabase()
    email = req.email.strip().lower()
    result = supabase.table("users").select("id, email_verified, email_verification_token, email_verification_expires_at").ilike("email", email).execute()
    if not result.data or len(result.data) == 0:
        return {"message": "If an account exists with this email, a verification link has been sent."}
    user = result.data[0]
    if user.get("email_verified", True):
        return {"message": "Email is already verified. You can sign in."}
    token = generate_verification_token()
    supabase.table("users").update({
        "email_verification_token": token,
        "email_verification_expires_at": verification_expires_at().isoformat(),
    }).eq("id", user["id"]).execute()
    ok, err = send_verification_email(req.email, token)
    if not ok:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send verification email. {err}",
        )
    return {"message": "Verification email sent."}
