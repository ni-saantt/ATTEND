from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    app_name: str = "Attend API"
    debug: bool = False

    # Supabase
    supabase_url: str = ""
    supabase_service_key: str = ""
    supabase_anon_key: str = ""

    # JWT
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60

    # Storage buckets
    bucket_primary_faces: str = "primary-faces"
    bucket_attendance_crops: str = "attendance-crops"

    # Face recognition
    recognition_threshold: float = 0.5
    face_execution_provider: str = "auto"  # auto | cuda | coreml | cpu

    # Email (Resend)
    resend_api_key: str = ""
    resend_from_email: str = "Attend <onboarding@resend.dev>"  # Use verified domain e.g. "Attend <noreply@yourdomain.com>"
    app_base_url: str = "http://localhost:8000"  # For verification links

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    return Settings()
