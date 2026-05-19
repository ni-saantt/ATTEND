import logging
import secrets
from datetime import datetime, timedelta, timezone

import resend
from app.config import get_settings

logger = logging.getLogger(__name__)


def generate_verification_token() -> str:
    return secrets.token_urlsafe(32)


def _verify_url(token: str) -> str:
    settings = get_settings()
    return f"{settings.app_base_url.rstrip('/')}/api/v1/auth/verify-email?token={token}"


def send_verification_email(email: str, token: str) -> tuple[bool, str]:
    """Send email verification link via Resend. Returns (success, error_message)."""
    settings = get_settings()
    if not settings.resend_api_key:
        return False, "RESEND_API_KEY is not configured. Add it to .env"
    resend.api_key = settings.resend_api_key
    verify_url = _verify_url(token)
    params = {
        "from": settings.resend_from_email,
        "to": [email],
        "subject": "Verify your Attend email",
        "html": f"""
        <p>Thanks for signing up for Attend!</p>
        <p>Click the link below to verify your email address:</p>
        <p><a href="{verify_url}">{verify_url}</a></p>
        <p>This link expires in 24 hours.</p>
        <p>If you didn't create an account, you can ignore this email.</p>
        """,
    }
    try:
        resend.Emails.send(params)
        return True, ""
    except Exception as e:
        err_msg = str(e)
        logger.exception("Resend send_verification_email failed: %s", err_msg)
        if "only send testing emails to your own email" in err_msg.lower() or "verify a domain" in err_msg.lower():
            err_msg = (
                "Resend requires a verified domain to send to external emails. "
                "Verify your domain at https://resend.com/domains and set the 'from' address in email.py to use it."
            )
        return False, err_msg


def send_super_admin_welcome_email(email: str, token: str, college_name: str) -> tuple[bool, str]:
    """Send welcome + verification email when Platform Admin adds a Super Admin. Returns (success, error_message)."""
    settings = get_settings()
    if not settings.resend_api_key:
        return False, "RESEND_API_KEY is not configured. Add it to .env"
    resend.api_key = settings.resend_api_key
    verify_url = _verify_url(token)
    params = {
        "from": settings.resend_from_email,
        "to": [email],
        "subject": f"Welcome to Attend – Super Admin for {college_name}",
        "html": f"""
        <p>Hello,</p>
        <p>You have been added as <strong>Super Admin</strong> of <strong>{college_name}</strong> on Attend – the attendance automation platform.</p>
        <p>To get started, please verify your email address by clicking the link below:</p>
        <p><a href="{verify_url}" style="display:inline-block;background:#007AFF;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:600;">Verify Email</a></p>
        <p style="color:#666;font-size:14px;">Or copy this link: {verify_url}</p>
        <p>This link expires in 24 hours.</p>
        <p>Once verified, you can log in via the Attend mobile app to manage your college.</p>
        <p>— The Attend Team</p>
        """,
    }
    try:
        resend.Emails.send(params)
        return True, ""
    except Exception as e:
        err_msg = str(e)
        logger.exception("Resend send_super_admin_welcome_email failed: %s", err_msg)
        if "only send testing emails to your own email" in err_msg.lower() or "verify a domain" in err_msg.lower():
            err_msg = (
                "Resend requires a verified domain to send to external emails. "
                "Verify your domain at https://resend.com/domains and set the 'from' address in email.py to use it."
            )
        return False, err_msg


def verification_expires_at() -> datetime:
    return datetime.now(timezone.utc) + timedelta(hours=24)
