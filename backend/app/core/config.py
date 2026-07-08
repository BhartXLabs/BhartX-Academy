from pydantic_settings import BaseSettings
from typing import Optional
import datetime

class Settings(BaseSettings):
    PROJECT_NAME: str = "BhartX Academy API"
    APP_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENV: str = "development"
    STARTUP_TIME: str = datetime.datetime.utcnow().isoformat()

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

    # ── Feature Flags ─────────────────────────────────────────────────────────
    # Control feature availability without code changes via environment variables.
    ENABLE_AI: bool = True                   # Master AI switch (Doubt solver, Test gen, Study plan)
    ENABLE_AI_TEST_GEN: bool = True          # AI-generated practice test questions
    ENABLE_AI_STUDY_PLAN: bool = True        # Personalised daily study plan generation
    ENABLE_SM2: bool = True                  # Spaced repetition memory scheduler
    ENABLE_ANALYTICS: bool = True            # Student cognitive analytics engine
    ENABLE_REDIS_CACHE: bool = False         # Redis-backed response caching (planned)
    ENABLE_NOTIFICATION_ENGINE: bool = False # Push notification / reminder service (planned)

    class Config:
        env_file = ".env"
        case_sensitive = True

    def __init__(self, **values):
        super().__init__(**values)
        if self.DATABASE_URL.startswith("postgres://"):
            self.DATABASE_URL = self.DATABASE_URL.replace("postgres://", "postgresql://", 1)
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
