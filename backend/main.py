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

# Initialize database schemas (auto-creates tables in local development only)
# NOTE: In production, database schemas are managed strictly via Alembic migrations.
if settings.ENV != "production":
    all_models.Base.metadata.create_all(bind=engine)

# ── Parse allowed origins from comma-separated env var ──────────────────────
allowed_origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]


class CSRFMiddleware(BaseHTTPMiddleware):
    """Origin-based CSRF protection for state-mutating requests in production."""
    async def dispatch(self, request: Request, call_next):
        if request.method in ["POST", "PUT", "DELETE", "PATCH"]:
            if settings.ENV == "production":
                origin = request.headers.get("Origin")
                referer = request.headers.get("Referer")

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


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security response headers to every response."""
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        if settings.ENV == "production":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Scalable, cognitive-science centered LMS Backend for BhartX Academy",
    version="1.0.0",
    # Disable docs in production for security
    openapi_url=f"{settings.API_V1_STR}/openapi.json" if settings.ENV != "production" else None,
    docs_url="/docs" if settings.ENV != "production" else None,
    redoc_url="/redoc" if settings.ENV != "production" else None,
)

# ── Rate Limiter ─────────────────────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── Middleware stack (order matters: last added = first to run) ───────────────
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(CSRFMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
)

app.add_middleware(LoggingMiddleware)

# ── API Routers ───────────────────────────────────────────────────────────────
app.include_router(api_router, prefix=settings.API_V1_STR)


# ── Health Check (Required by Render for liveness probe) ─────────────────────
@app.get("/health", tags=["Infrastructure"])
def health_check():
    """Render and load balancers ping this to verify the service is alive."""
    return {"status": "ok", "env": settings.ENV}


@app.get("/")
def get_root():
    return {
        "status": "online",
        "message": "Welcome to BhartX Academy Mastery Engine API v1",
    }
