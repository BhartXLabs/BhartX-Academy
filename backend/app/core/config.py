from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "BhartX Academy API"
    API_V1_STR: str = "/api/v1"
    ENV: str = "development"
    
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

    def __init__(self, **values):
        super().__init__(**values)
        if self.ENV == "production" and self.SECRET_KEY == "d6e3dfbc5d483b8a6a6b5a329d2bfbe5efbc20f8c5b16954a2a19ef58b99c0d7":
            raise ValueError("CRITICAL SECURITY ERROR: Default SECRET_KEY is not allowed in production! Please define a secure SECRET_KEY in your env.")

settings = Settings()
