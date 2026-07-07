from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "BhartX Academy API"
    API_V1_STR: str = "/api/v1"
    ENV: str = "development"

    # JWT Auth Settings
    SECRET_KEY: str = "d6e3dfbc5d483b8a6a6b5a329d2bfbe5efbc20f8c5b16954a2a19ef58b99c0d7"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # Database Settings
    DATABASE_URL: str = "sqlite:///./bhartx_academy.db"

    # CORS — comma-separated list of allowed frontend origins
    # Example: "https://bhartx-academy.vercel.app,https://www.bhartx.in"
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001"

    # Google OAuth
    GOOGLE_CLIENT_ID: Optional[str] = None

    # AI Keys
    GEMINI_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    GROQ_API_KEY: Optional[str] = None

    class Config:
        env_file = ".env"
        case_sensitive = True

    def __init__(self, **values):
        super().__init__(**values)
        if self.ENV == "production":
            if self.SECRET_KEY == "d6e3dfbc5d483b8a6a6b5a329d2bfbe5efbc20f8c5b16954a2a19ef58b99c0d7":
                raise ValueError(
                    "CRITICAL SECURITY ERROR: Default SECRET_KEY is not allowed in production! "
                    "Set a secure SECRET_KEY environment variable on Render."
                )
            if not self.GOOGLE_CLIENT_ID:
                raise ValueError(
                    "CRITICAL CONFIG ERROR: GOOGLE_CLIENT_ID must be set in production "
                    "for Google OAuth audience verification."
                )

settings = Settings()
