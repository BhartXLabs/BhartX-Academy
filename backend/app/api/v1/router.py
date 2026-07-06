from fastapi import APIRouter
from app.api.v1.endpoints import auth, admin, courses, progress, quizzes, mocks, journal, ai, search, notifications

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(courses.router, prefix="/courses", tags=["courses"])
api_router.include_router(progress.router, prefix="/progress", tags=["progress"])
api_router.include_router(quizzes.router, prefix="/quizzes", tags=["quizzes"])
api_router.include_router(mocks.router, prefix="/mocks", tags=["mocks"])
api_router.include_router(journal.router, prefix="/journal", tags=["journal"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(search.router, prefix="/search", tags=["search"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
