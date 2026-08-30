from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from google.oauth2 import id_token
from google.auth.transport import requests
import google_auth_oauthlib.flow

from app.db.session import get_db
from app.core.config import settings
from app.core.security import create_access_token, encrypt_token
from app.models.user import User
from app.models.google_account import GoogleAccount
from app.models.system_setting import SystemSetting
from app.schemas.auth import TokenResponse, GoogleLoginRequest
import datetime

router = APIRouter()

from pydantic import BaseModel

class DirectLoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login")
def direct_login(payload: DirectLoginRequest, db: Session = Depends(get_db)):
    """
    Direct login with Superadmin account handling all accounts and channels.
    """
    email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        # Create default Superadmin user with access to all channels
        user = User(email=email, name="SUPERADMIN (AUDIRA NETWORK)")
        db.add(user)
        db.commit()
        db.refresh(user)

    access_token_expires = datetime.timedelta(days=7)
    access_token = create_access_token(
        data={"sub": str(user.id), "role": "SUPERADMIN"}, expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "name": user.name,
            "role": "SUPERADMIN",
            "managedChannels": 6,
            "managedAccounts": 3
        }
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
    """
    client_id, client_secret = resolve_google_credentials(db)

    if not client_id or not client_secret or client_id == "your_google_client_id_here":
        raise HTTPException(
            status_code=400, 
            detail="Google Client ID/Secret belum diisi atau masih berupa placeholder. Silakan isi di menu Settings > INTEGRATIONS."
        )
        
    try:
        # 1. Exchange code for token
        flow = google_auth_oauthlib.flow.Flow.from_client_config(
            {
                "web": {
                    "client_id": client_id,
                    "client_secret": client_secret,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                }
            },
            scopes=["openid", "https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/userinfo.profile", "https://www.googleapis.com/auth/youtube.readonly"]
        )
        flow.redirect_uri = request.redirect_uri
        flow.fetch_token(code=request.code)
        credentials = flow.credentials

        # 2. Verify ID token to get user info
        user_info = id_token.verify_oauth2_token(
            credentials.id_token, requests.Request(), client_id
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
