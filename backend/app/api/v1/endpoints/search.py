from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.v1.endpoints.auth import get_current_user
from app.repositories.course import course_repo

router = APIRouter()

@router.get("")
def search(q: str = Query(..., min_length=2), page: int = 1, limit: int = 20, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    skip = (page - 1) * limit
    results = course_repo.global_search(db, q, limit=limit)
    return {
        "query": q,
        "page": page,
        "limit": limit,
        "results": results
    }
