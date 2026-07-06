from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from urllib.parse import urlparse
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import engine
from app.models import all_models
from app.api.v1.router import api_router
from app.core.logging import LoggingMiddleware
from app.core.ratelimit import limiter
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler

# Initialize database schemas (auto-creates SQLite tables locally)
all_models.Base.metadata.create_all(bind=engine)

class CSRFMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.method in ["POST", "PUT", "DELETE", "PATCH"]:
            # Only enforce CSRF origin matching in production environment
            if settings.ENV == "production":
                origin = request.headers.get("Origin")
                referer = request.headers.get("Referer")
                
                allowed_origins = [
                    "https://bhartx-academy.vercel.app",  # Production Vercel frontend URL placeholder
                    "http://localhost:3000",
                    "http://127.0.0.1:3000"
                ]
                
                if origin and origin not in allowed_origins:
                    return JSONResponse(
                        status_code=403,
                        content={"detail": "CSRF verification failed. Invalid Origin."}
                    )
                
                if not origin and referer:
                    ref_domain = urlparse(referer).netloc
                    allowed_domains = [urlparse(o).netloc for o in allowed_origins]
                    if ref_domain not in allowed_domains:
                        return JSONResponse(
                            status_code=403,
                            content={"detail": "CSRF verification failed. Invalid Referer."}
                        )
        return await call_next(request)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Scalable, cognitive-science centered LMS Backend for BhartX Academy",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Connect slowapi rate limiters
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(CSRFMiddleware)

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
