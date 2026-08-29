from pydantic import BaseModel, EmailStr
from uuid import UUID
from typing import Optional, List

class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: UUID
    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class GoogleLoginRequest(BaseModel):
    code: str
    redirect_uri: str
