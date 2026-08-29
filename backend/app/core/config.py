from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "YouTube Intelligence Monitor"
    API_V1_STR: str = "/api/v1"
    
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "youtube_monitor"
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/youtube_monitor"
    
    JWT_SECRET: str = "generate_a_very_secure_secret_key_here"
    ENCRYPTION_KEY: str = "generate_a_32_byte_url_safe_base64_encoded_key_here" # Needs to be 32 url-safe base64-encoded bytes
    
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    FRONTEND_URL: str = "http://localhost:3000"

    class Config:
        env_file = ".env"

settings = Settings()
