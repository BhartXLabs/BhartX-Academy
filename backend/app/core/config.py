from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "BhartX Academy API"
    API_V1_STR: str = "/api/v1"
    
    # JWT Auth Settings
    SECRET_KEY: str = "d6e3dfbc5d483b8a6a6b5a329d2bfbe5efbc20f8c5b16954a2a19ef58b99c0d7"  # In production, load from env
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # Database Settings
    # Default to local sqlite for immediate out-of-the-box local development, PostgreSQL ready
    DATABASE_URL: str = "sqlite:///./bhartx_academy.db"

    # AI Keys
    GEMINI_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
