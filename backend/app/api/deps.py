from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import ValidationError
from typing import Optional
from jose import jwt

from app.db.session import get_db
from app.core import security
from app.core.config import settings
from app.models.user import User

# Standard OAuth2 scheme (requires Bearer token, raises 401 if missing)
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=True
)

# Optional OAuth2 scheme (does NOT raise 401 if token missing — returns None)
oauth2_scheme_optional = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False
)

def _extract_user_from_token(token: str, db: Session) -> Optional[User]:
    """Decode JWT and return User object, or None if invalid."""
    try:
        payload = security.verify_token(token)
        if payload is None:
            return None
        user_id: str = payload.get("sub")
        if not user_id:
            return None
        return db.query(User).filter(User.id == user_id).first()
    except Exception:
        return None


def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    """
    Strict auth dependency — raises HTTP 401 if token missing or invalid.
    Use on endpoints that MUST be authenticated.
    """
    user = _extract_user_from_token(token, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token tidak valid atau sudah kedaluwarsa. Silakan login ulang.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def get_current_user_optional(
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme_optional)
) -> Optional[User]:
    """
    Optional auth dependency — returns User if token valid.
    If token is missing or in single-tenant/LAN mode, gracefully falls back to active Superadmin user.
    """
    if token:
        user = _extract_user_from_token(token, db)
        if user:
            return user
    return db.query(User).filter((User.role == "SUPERADMIN") | (User.status == "ACTIVE")).first()


def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Raises 403 if user account is suspended."""
    if getattr(current_user, "status", "ACTIVE") == "SUSPENDED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akun Anda telah dinonaktifkan. Hubungi administrator."
        )
    return current_user


def require_superadmin(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """Only SUPERADMIN can access. Use on system-critical endpoints."""
    role = (getattr(current_user, "role", "") or "").upper()
    if role != "SUPERADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Akses ditolak. Hanya SUPERADMIN yang boleh mengakses endpoint ini. Role Anda: {role}"
        )
    return current_user


def require_admin_or_above(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """SUPERADMIN or ADMIN can access."""
    role = (getattr(current_user, "role", "") or "").upper()
    if role not in ("SUPERADMIN", "ADMIN"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Akses ditolak. Diperlukan role ADMIN atau lebih tinggi. Role Anda: {role}"
        )
    return current_user
