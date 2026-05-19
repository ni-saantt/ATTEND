from typing import Annotated, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.auth.jwt import decode_token

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(bearer_scheme)],
):
    token_value = credentials.credentials if credentials else None
    if not token_value:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    payload = decode_token(token_value)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )
    return payload


def require_roles(*allowed_roles: str):
    async def role_checker(user: dict = Depends(get_current_user)):
        if user.get("role") not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return user

    return role_checker


def require_platform_admin(user: dict = Depends(require_roles("PLATFORM_ADMIN"))):
    return user


def require_super_admin(user: dict = Depends(require_roles("PLATFORM_ADMIN", "SUPER_ADMIN"))):
    return user


def require_dept_admin(user: dict = Depends(require_roles("PLATFORM_ADMIN", "SUPER_ADMIN", "DEPARTMENT_ADMIN"))):
    return user


def require_teacher(user: dict = Depends(require_roles("PLATFORM_ADMIN", "SUPER_ADMIN", "DEPARTMENT_ADMIN", "TEACHER"))):
    return user
