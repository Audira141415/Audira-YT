from pydantic import BaseModel, UUID4
from typing import Optional, List
from datetime import datetime

class AccountBase(BaseModel):
    email: str

class AccountResponse(AccountBase):
    id: UUID4
    name: str
    isPrimary: bool = False
    status: str
    channels: int = 0
    channel_items: Optional[List[dict]] = []
    lastSync: Optional[str] = "Never"
    syncTime: Optional[str] = "-"
    quotaUsed: int = 0
    quotaPct: int = 0
    token: str = "VALID"
    tokenExp: str = "-"
    apiStatus: str = "OK"
    errors: int = 0
    color: str = "bg-green-500"

    class Config:
        from_attributes = True
