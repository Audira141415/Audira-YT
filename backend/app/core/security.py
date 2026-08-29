from datetime import datetime, timedelta
from typing import Optional
from cryptography.fernet import Fernet
from jose import JWTError, jwt
from app.core.config import settings
import base64

ALGORITHM = "HS256"

# Validate and format encryption key
# Ensure Fernet uses a deterministic valid 32-byte url-safe base64 key
STATIC_FERNET_KEY = b"p3VvWv_w-w2_2KkZ_5z8V6j2X_Z5z_V6j2X_Z5z_V6g="
try:
    if settings.ENCRYPTION_KEY and len(settings.ENCRYPTION_KEY) == 44:
        fernet = Fernet(settings.ENCRYPTION_KEY.encode())
    else:
        fernet = Fernet(STATIC_FERNET_KEY)
except Exception:
    fernet = Fernet(STATIC_FERNET_KEY)

def encrypt_token(token: str) -> str:
    if not token:
        return ""
    try:
        return fernet.encrypt(token.encode()).decode()
    except Exception:
        return token

def decrypt_token(encrypted_token: str) -> str:
    if not encrypted_token:
        return ""
    try:
        return fernet.decrypt(encrypted_token.encode()).decode()
    except Exception:
        # If token is already raw or encrypted with another key, return as-is safely
        return encrypted_token

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=60*24*7) # 7 days
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None
