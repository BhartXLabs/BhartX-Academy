from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.v1.endpoints.auth import get_current_user
from app.services.analytics_service import analytics_service

router = APIRouter()


@router.get("/me")
def get_my_analytics(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """
    Full personal student analytics — 3 sections:
    - learning: completion + quiz accuracy
    - memory: revision compliance + mistake resolution
    - recommendations: priority-sorted action items
    """
    return analytics_service.get_student_analytics(db, current_user.id)
