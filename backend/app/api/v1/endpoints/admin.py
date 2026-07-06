from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
import datetime
from app.db.session import get_db
from app.api.v1.endpoints.auth import get_current_user
from app.models.all_models import User, LessonProgress, QuizAttempt, Quiz, Chapter, Subject, Course
from app.repositories.course import course_repo

router = APIRouter()

# Dependency to check if admin
def get_current_admin(current_user=Depends(get_current_user)):
    if current_user.role not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can execute this action."
        )
    return current_user

@router.get("/analytics")
def get_admin_analytics(db: Session = Depends(get_db), current_admin=Depends(get_current_admin)):
    # Basic statistics
    total_students = db.query(User).filter(User.role == "student").count()
    
    # Active users today
    today = datetime.datetime.utcnow().date()
    active_today = db.query(User).filter(func.date(User.last_active_date) == today).count()

    # Average completion rate
    avg_progress = db.query(func.avg(LessonProgress.watch_percentage)).scalar() or 0.0

    # Top performers (XP)
    top_performers = db.query(User).filter(User.role == "student").order_by(User.xp.desc()).limit(5).all()
    performers_list = [{"name": u.name, "xp": u.xp, "streak": u.streak} for u in top_performers]

    # Confusing/Difficult chapters (average quiz score < 70)
    difficult_chapters = []
    chapter_scores = db.query(
        Quiz.chapter_id,
        func.avg(QuizAttempt.score).label("avg_score")
    ).join(QuizAttempt, QuizAttempt.quiz_id == Quiz.id).group_by(Quiz.chapter_id).all()

    for ch_score in chapter_scores:
        if ch_score.avg_score < 70.0:
            ch = db.query(Chapter).filter(Chapter.id == ch_score.chapter_id).first()
            if ch:
                difficult_chapters.append({
                    "chapter_title": ch.title,
                    "avg_score": round(ch_score.avg_score, 1)
                })

    return {
        "total_students": total_students,
        "active_today": active_today,
        "average_completion_percentage": round(avg_progress, 1),
        "top_performers": performers_list,
        "difficult_chapters": difficult_chapters
    }

@router.get("/students")
def list_students(db: Session = Depends(get_db), current_admin=Depends(get_current_admin)):
    students = db.query(User).filter(User.role == "student").all()
    return [{"id": s.id, "name": s.name, "email": s.email, "xp": s.xp, "streak": s.streak, "last_active": s.last_active_date} for s in students]
