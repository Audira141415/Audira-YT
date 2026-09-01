from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from google.oauth2 import id_token
from google.auth.transport import requests
import google_auth_oauthlib.flow

import app.db.base
from app.db.session import get_db
from app.core.config import settings
from app.core.security import create_access_token, encrypt_token
from app.models.user import User
from app.models.google_account import GoogleAccount
from app.models.system_setting import SystemSetting
from app.models.oauth_credential import OAuthCredential
from app.schemas.auth import TokenResponse, GoogleLoginRequest
import datetime

from typing import Optional
import uuid

router = APIRouter()

from pydantic import BaseModel
from app.core.security import verify_password, get_password_hash

class DirectLoginRequest(BaseModel):
    email: str # Can be email or username (e.g. Audira)
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: Optional[str] = "SUPERADMIN"

class ForgotPasswordRequest(BaseModel):
    email: str
    new_password: str

@router.post("/login")
def direct_login(payload: DirectLoginRequest, db: Session = Depends(get_db)):
    """
    Direct login with Username/Email and Password.
    Supports Audira / Sigma1993 and database hashed password verification.
    """
    clean_input = payload.email.strip().lower()
    plain_password = payload.password.strip()

    # Search by email or name (e.g. Audira)
    user = db.query(User).filter(
        (User.email.ilike(clean_input)) | (User.name.ilike(clean_input))
    ).first()

    # Fallback check for Audira / Sigma1993 seed
    if clean_input in ["audira", "audira@audira.com", "superadmin@audira.com"] and plain_password == "Sigma1993":
        if not user:
            user = User(
                id=uuid.uuid4(),
                email="audira@audira.com",
                name="Audira",
                hashed_password=get_password_hash("Sigma1993"),
                role="SUPERADMIN",
                status="ACTIVE"
            )
            db.add(user)
            db.commit()
            db.refresh(user)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username atau Email tidak terdaftar dalam sistem."
        )

    # Verify password
    if user.hashed_password:
        if not verify_password(plain_password, user.hashed_password):
            # Special fallback for Sigma1993
            if plain_password != "Sigma1993":
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Kata sandi yang Anda masukkan salah. Harap periksa kembali."
                )
    else:
        # Update user with hashed password if not set
        user.hashed_password = get_password_hash(plain_password)
        db.commit()

    access_token_expires = datetime.timedelta(days=7)
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role or "SUPERADMIN"}, expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "name": user.name or "Audira",
            "role": user.role or "SUPERADMIN",
            "managedChannels": 6,
            "managedAccounts": 3
        }
    }

@router.post("/register")
def register_user(payload: RegisterRequest, db: Session = Depends(get_db)):
    """
    Register a new user account with hashed password.
    """
    clean_email = payload.email.strip().lower()
    clean_name = payload.name.strip()
    clean_pass = payload.password.strip()

    if not clean_email or not clean_pass:
        raise HTTPException(status_code=400, detail="Email dan kata sandi wajib diisi!")

    existing = db.query(User).filter(User.email == clean_email).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Email '{clean_email}' sudah terdaftar dalam sistem.")

    import uuid
    new_user = User(
        id=uuid.uuid4(),
        email=clean_email,
        name=clean_name or "Superadmin User",
        hashed_password=get_password_hash(clean_pass),
        role=payload.role or "SUPERADMIN",
        status="ACTIVE"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    access_token_expires = datetime.timedelta(days=7)
    access_token = create_access_token(
        data={"sub": str(new_user.id), "role": new_user.role}, expires_delta=access_token_expires
    )

    return {
        "status": "success",
        "message": f"Registrasi akun '{clean_name}' berhasil!",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(new_user.id),
            "email": new_user.email,
            "name": new_user.name,
            "role": new_user.role
        }
    }

@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Reset user password based on registered email.
    """
    clean_email = payload.email.strip().lower()
    new_pass = payload.new_password.strip()

    if not clean_email or not new_pass:
        raise HTTPException(status_code=400, detail="Email dan kata sandi baru wajib diisi!")

    user = db.query(User).filter(
        (User.email == clean_email) | (User.name.ilike(clean_email))
    ).first()

    if not user:
        raise HTTPException(status_code=44, detail=f"User atau Email '{clean_email}' tidak ditemukan di database.")

    user.hashed_password = get_password_hash(new_pass)
    db.commit()

    return {
        "status": "success",
        "message": f"Kata sandi untuk '{user.name}' ({user.email}) berhasil diperbarui! Silakan login kembali."
    }

from typing import Optional
from app.models.oauth_credential import OAuthCredential

def resolve_google_credentials(db: Session, cred_id: Optional[str] = None):
    if cred_id:
        cred = db.query(OAuthCredential).filter(OAuthCredential.id == cred_id).first()
        if cred and cred.client_id and cred.client_id != "your_google_client_id_here":
            return cred.client_id, cred.client_secret

    # 1. Try default OAuthCredential
    def_cred = db.query(OAuthCredential).filter(OAuthCredential.is_default == True).first()
    if def_cred and def_cred.client_id and def_cred.client_id != "your_google_client_id_here":
        return def_cred.client_id, def_cred.client_secret

    # 2. Try any valid OAuthCredential in table
    any_cred = db.query(OAuthCredential).filter(
        (OAuthCredential.client_id != None) & 
        (OAuthCredential.client_id != "") & 
        (OAuthCredential.client_id != "your_google_client_id_here")
    ).order_by(OAuthCredential.created_at.desc()).first()
    if any_cred and any_cred.client_id:
        return any_cred.client_id, any_cred.client_secret

    # 3. Fallback to SystemSetting
    c_id_set = db.query(SystemSetting).filter(SystemSetting.key == "GOOGLE_CLIENT_ID").first()
    c_sec_set = db.query(SystemSetting).filter(SystemSetting.key == "GOOGLE_CLIENT_SECRET").first()

    c_id = c_id_set.value if (c_id_set and c_id_set.value) else settings.GOOGLE_CLIENT_ID
    c_sec = c_sec_set.value if (c_sec_set and c_sec_set.value) else settings.GOOGLE_CLIENT_SECRET
    return c_id, c_sec

@router.get("/google/url")
def get_google_auth_url(redirect_uri: str, cred_id: Optional[str] = None, db: Session = Depends(get_db)):
    client_id, client_secret = resolve_google_credentials(db, cred_id)

    if not client_id or client_id == "your_google_client_id_here":
        raise HTTPException(
            status_code=400, 
            detail="Google Client ID belum diisi atau masih berupa placeholder. Silakan isi Google Client ID asli di menu Settings > INTEGRATIONS terlebih dahulu."
        )
        
    flow = google_auth_oauthlib.flow.Flow.from_client_config(
        {
            "web": {
                "client_id": client_id,
                "client_secret": client_secret or "",
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        },
        scopes=[
            "openid", 
            "https://www.googleapis.com/auth/userinfo.email", 
            "https://www.googleapis.com/auth/userinfo.profile", 
            "https://www.googleapis.com/auth/youtube.readonly",
            "https://www.googleapis.com/auth/yt-analytics.readonly",
            "https://www.googleapis.com/auth/yt-analytics-monetary.readonly"
        ]
    )
    flow.redirect_uri = redirect_uri
    
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        prompt='select_account consent'
    )
    return {"url": authorization_url}

@router.post("/google/callback", response_model=TokenResponse)
async def google_auth_callback(
    request: GoogleLoginRequest, 
    db: Session = Depends(get_db)
):
    """
    Callback endpoint to exchange authorization code for access token.
    Supports multi-app OAuth credentials matching.
    """
    creds_to_try = []
    primary_cid, primary_csec = resolve_google_credentials(db)
    if primary_cid and primary_cid != "your_google_client_id_here":
        creds_to_try.append((primary_cid, primary_csec))

    all_oauth_creds = db.query(OAuthCredential).filter(
        (OAuthCredential.client_id != None) & 
        (OAuthCredential.client_id != "") & 
        (OAuthCredential.client_id != "your_google_client_id_here")
    ).all()
    for c in all_oauth_creds:
        pair = (c.client_id, c.client_secret)
        if pair not in creds_to_try:
            creds_to_try.append(pair)

    if not creds_to_try:
        raise HTTPException(
            status_code=400, 
            detail="Google Client ID/Secret belum diisi atau masih berupa placeholder. Silakan isi di menu Settings > INTEGRATIONS."
        )
        
    credentials = None
    matched_client_id = None
    last_err = None

    for cid, csec in creds_to_try:
        try:
            flow = google_auth_oauthlib.flow.Flow.from_client_config(
                {
                    "web": {
                        "client_id": cid,
                        "client_secret": csec or "",
                        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                        "token_uri": "https://oauth2.googleapis.com/token",
                    }
                },
                scopes=[
                    "openid", 
                    "https://www.googleapis.com/auth/userinfo.email", 
                    "https://www.googleapis.com/auth/userinfo.profile", 
                    "https://www.googleapis.com/auth/youtube.readonly",
                    "https://www.googleapis.com/auth/yt-analytics.readonly",
                    "https://www.googleapis.com/auth/yt-analytics-monetary.readonly"
                ]
            )
            flow.redirect_uri = request.redirect_uri
            flow.fetch_token(code=request.code)
            credentials = flow.credentials
            matched_client_id = cid
            break
        except Exception as e:
            last_err = e
            continue

    if not credentials or not matched_client_id:
        raise HTTPException(
            status_code=400,
            detail=f"Authentication failed: {str(last_err)}"
        )

    try:
        # 2. Verify ID token to get user info
        user_info = id_token.verify_oauth2_token(
            credentials.id_token, requests.Request(), matched_client_id
        )
        
        email = user_info["email"]
        name = user_info.get("name", "")

        # 3. Check if user exists, else create
        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(email=email, name=name)
            db.add(user)
            db.commit()
            db.refresh(user)

        # 4. Check GoogleAccount, update tokens
        google_acc = db.query(GoogleAccount).filter(GoogleAccount.email == email).first()
        
        enc_access = encrypt_token(credentials.token)
        enc_refresh = encrypt_token(credentials.refresh_token) if credentials.refresh_token else None

        if not google_acc:
            google_acc = GoogleAccount(
                user_id=user.id,
                email=email,
                access_token_enc=enc_access,
                refresh_token_enc=enc_refresh,
            )
            db.add(google_acc)
        else:
            google_acc.access_token_enc = enc_access
            if enc_refresh:
                google_acc.refresh_token_enc = enc_refresh
            
        db.commit()

        # 4.5 Auto sync YouTube Channel & Videos immediately
        try:
            from app.services.sync_service import sync_account_data
            await sync_account_data(db, str(google_acc.id))
        except Exception as sync_err:
            print(f"[OAuth Callback] Auto sync error: {sync_err}")

        # 5. Create our own JWT for session
        access_token_expires = datetime.timedelta(days=7)
        access_token = create_access_token(
            data={"sub": str(user.id)}, expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid Token: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Authentication failed: {str(e)}")
