"""
Structured JSON logging for BhartX Academy backend.
Every log line is a valid JSON object — parseable by Datadog, CloudWatch, Render Logs.

Fields:
  time        - ISO 8601 UTC timestamp
  level       - INFO / WARNING / ERROR
  module      - Source module name
  message     - Human-readable description
  method      - HTTP method (middleware only)
  path        - Request path (middleware only)
  status      - HTTP response status (middleware only)
  duration_ms - Request duration in milliseconds (middleware only)
  request_id  - UUID per request for distributed tracing
  env         - Current environment (development / production)
"""
import logging
import time
import uuid
import json
import traceback
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.config import settings


class StructuredJSONFormatter(logging.Formatter):
    """Formats every log record as a single-line JSON object."""

    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "time": self.formatTime(record, "%Y-%m-%dT%H:%M:%SZ"),
            "level": record.levelname,
            "module": record.name,
            "message": record.getMessage(),
            "env": settings.ENV,
        }
        # Include exception info if present
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)
        # Include any extra fields attached to the record
        for key, value in record.__dict__.items():
            if key not in (
                "args", "asctime", "created", "exc_info", "exc_text",
                "filename", "funcName", "id", "levelname", "levelno",
                "lineno", "module", "msecs", "message", "msg", "name",
                "pathname", "process", "processName", "relativeCreated",
                "stack_info", "thread", "threadName",
            ):
                log_entry[key] = value
        return json.dumps(log_entry, ensure_ascii=False, default=str)


def _setup_logger() -> logging.Logger:
    """Configure and return the single application logger."""
    logger = logging.getLogger("bhartx")
    logger.setLevel(logging.INFO)

    if not logger.handlers:
        handler = logging.StreamHandler()
        handler.setFormatter(StructuredJSONFormatter())
        logger.addHandler(handler)

    # Silence noisy third-party loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

    return logger


logger = _setup_logger()


class LoggingMiddleware(BaseHTTPMiddleware):
    """
    Per-request structured JSON logging middleware.
    Logs every request + response as a single JSON line.
    """
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        start_time = time.time()

        # Skip noisy health/ready probes from polluting logs
        if request.url.path in ("/health", "/ready"):
            response = await call_next(request)
            response.headers["X-Request-ID"] = request_id
            return response

        logger.info(
            "request_received",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "client": request.client.host if request.client else "unknown",
            }
        )

        try:
            response = await call_next(request)
            duration_ms = round((time.time() - start_time) * 1000, 2)

            level = logging.WARNING if response.status_code >= 400 else logging.INFO
            logger.log(
                level,
                "request_completed",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "status": response.status_code,
                    "duration_ms": duration_ms,
                }
            )
            response.headers["X-Request-ID"] = request_id
            return response

        except Exception as exc:
            duration_ms = round((time.time() - start_time) * 1000, 2)
            logger.error(
                "request_exception",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "duration_ms": duration_ms,
                    "exception": traceback.format_exc(),
                }
            )
            raise exc
