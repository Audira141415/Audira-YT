from pydantic import BaseModel
from typing import Optional

class SettingUpdate(BaseModel):
    google_client_id: Optional[str] = None
    google_client_secret: Optional[str] = None

class SettingResponse(BaseModel):
    google_client_id: str = ""
    google_client_secret: str = ""
