from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import engine
from app.models import all_models
from app.api.v1.router import api_router
from app.core.logging import LoggingMiddleware

# Initialize database schemas (auto-creates SQLite tables locally)
all_models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Scalable, cognitive-science centered LMS Backend for BhartX Academy",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Setup CORS to allow Next.js local frontend access
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(LoggingMiddleware)

# Connect API v1 Routers
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def get_root():
    return {
        "status": "online",
        "message": "Welcome to BhartX Academy Mastery Engine API v1",
        "docs_url": "/docs"
    }
