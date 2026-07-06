import logging
import time
import uuid
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

# Configure logging format
logging.basicConfig(
    level=logging.INFO,
    format='{"time":"%(asctime)s", "level":"%(levelname)s", "message":"%(message)s"}',
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("bhartx_logger")

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        start_time = time.time()
        
        # Log incoming request
        logger.info(f"Request: {request.method} {request.url.path} | RequestID: {request_id}")
        
        try:
            response = await call_next(request)
            process_time = (time.time() - start_time) * 1000
            
            # Log response stats
            logger.info(
                f"Response: {response.status_code} | "
                f"Duration: {process_time:.2f}ms | RequestID: {request_id}"
            )
            response.headers["X-Request-ID"] = request_id
            return response
        except Exception as e:
            process_time = (time.time() - start_time) * 1000
            logger.error(
                f"Exception: {str(e)} | "
                f"Duration: {process_time:.2f}ms | RequestID: {request_id}"
            )
            raise e
