from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
import datetime
from app.db.session import get_db
from app.api.v1.endpoints.auth import get_current_user
from app.models.all_models import User, LessonProgress, QuizAttempt, Quiz, Chapter, Subject, Course, Semester, Lesson
from app.schemas.course import (
    LessonCreate, LessonUpdate, ChapterCreate, ChapterUpdate,
    SubjectCreate, SubjectUpdate, SemesterCreate, SemesterUpdate,
    CourseCreate, CourseUpdate
)
from app.schemas.auth import UserRoleUpdateRequest, AdminResetPasswordRequest
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
    # Using a single join to eliminate N+1 query loop
    difficult_chapters = []
    chapter_scores = db.query(
        Chapter.title,
        func.avg(QuizAttempt.score).label("avg_score")
    ).select_from(Quiz) \
     .join(QuizAttempt, QuizAttempt.quiz_id == Quiz.id) \
     .join(Chapter, Chapter.id == Quiz.chapter_id) \
     .group_by(Chapter.id, Chapter.title) \
     .having(func.avg(QuizAttempt.score) < 70.0) \
     .all()

    for ch_title, avg_score in chapter_scores:
        difficult_chapters.append({
            "chapter_title": ch_title,
            "avg_score": round(avg_score, 1)
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
    # List all users (both students and potential administrators)
    students = db.query(User).all()
    return [{"id": s.id, "name": s.name, "email": s.email, "role": s.role, "xp": s.xp, "streak": s.streak, "last_active": s.last_active_date} for s in students]


# ── USER OPERATIONS ───────────────────────────────────────────────────────────

@router.put("/users/{user_id}/role")
def update_user_role(user_id: int, role_in: UserRoleUpdateRequest, db: Session = Depends(get_db), current_admin=Depends(get_current_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if role_in.role not in ["student", "admin", "super_admin"]:
        raise HTTPException(status_code=400, detail="Invalid role specified")
    user.role = role_in.role
    db.commit()
    db.refresh(user)
    return {"status": "success", "message": f"User role updated to {role_in.role}"}

@router.post("/users/{user_id}/reset-password")
def admin_reset_password(user_id: int, reset_in: AdminResetPasswordRequest, db: Session = Depends(get_db), current_admin=Depends(get_current_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    from app.core.security import get_password_hash
    user.hashed_password = get_password_hash(reset_in.password)
    db.commit()
    return {"status": "success", "message": "User password reset successfully"}

@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_admin=Depends(get_current_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account")
    db.delete(user)
    db.commit()
    return {"status": "success", "message": "User account permanently deleted"}

@router.get("/users/{user_id}/progress")
def get_user_progress(user_id: int, db: Session = Depends(get_db), current_admin=Depends(get_current_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Calculate simple analytics
    total_lessons = db.query(Lesson).count()
    completed_lessons = db.query(LessonProgress).filter(
        LessonProgress.user_id == user_id,
        LessonProgress.status == "completed"
    ).count()
    completion_pct = round((completed_lessons / max(total_lessons, 1)) * 100, 1)

    avg_quiz_score = db.query(func.avg(QuizAttempt.score)).filter(QuizAttempt.user_id == user_id).scalar() or 0.0
    
    return {
        "user_id": user.id,
        "name": user.name,
        "email": user.email,
        "streak": user.streak,
        "xp": user.xp,
        "onboarded": user.onboarded,
        "onboarding_profile": user.onboarding_profile,
        "lessons_completed": completed_lessons,
        "lessons_total": total_lessons,
        "completion_percentage": completion_pct,
        "quiz_accuracy": round(float(avg_quiz_score), 1)
    }

# ── CURRICULUM CMS OPERATIONS ─────────────────────────────────────────────────

# Lesson CRUD
@router.post("/lessons")
def create_lesson(lesson_in: LessonCreate, db: Session = Depends(get_db), current_admin=Depends(get_current_admin)):
    chapter = db.query(Chapter).filter(Chapter.id == lesson_in.chapter_id).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    lesson = Lesson(
        chapter_id=lesson_in.chapter_id,
        title=lesson_in.title,
        description=lesson_in.description,
        video_provider=lesson_in.video_provider,
        video_id=lesson_in.video_id,
        duration_seconds=lesson_in.duration_seconds,
        order=lesson_in.order,
        prerequisites=lesson_in.prerequisites,
        outcomes=lesson_in.outcomes,
        status="published"
    )
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return {"status": "success", "lesson_id": lesson.id, "message": "Lesson created successfully"}

@router.put("/lessons/{lesson_id}")
def update_lesson(lesson_id: int, lesson_in: LessonUpdate, db: Session = Depends(get_db), current_admin=Depends(get_current_admin)):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    for field, val in lesson_in.model_dump(exclude_unset=True).items():
        setattr(lesson, field, val)
        
    db.commit()
    db.refresh(lesson)
    return {"status": "success", "message": "Lesson updated successfully"}

@router.delete("/lessons/{lesson_id}")
def delete_lesson(lesson_id: int, db: Session = Depends(get_db), current_admin=Depends(get_current_admin)):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    db.delete(lesson)
    db.commit()
    return {"status": "success", "message": "Lesson deleted successfully"}

# Chapter CRUD
@router.post("/chapters")
def create_chapter(chapter_in: ChapterCreate, db: Session = Depends(get_db), current_admin=Depends(get_current_admin)):
    subject = db.query(Subject).filter(Subject.id == chapter_in.subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    chapter = Chapter(
        subject_id=chapter_in.subject_id,
        title=chapter_in.title,
        description=chapter_in.description,
        order=chapter_in.order,
        status="published"
    )
    db.add(chapter)
    db.commit()
    db.refresh(chapter)
    return {"status": "success", "chapter_id": chapter.id, "message": "Chapter created successfully"}

@router.put("/chapters/{chapter_id}")
def update_chapter(chapter_id: int, chapter_in: ChapterUpdate, db: Session = Depends(get_db), current_admin=Depends(get_current_admin)):
    chapter = db.query(Chapter).filter(Chapter.id == chapter_id).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    
    for field, val in chapter_in.model_dump(exclude_unset=True).items():
        setattr(chapter, field, val)
        
    db.commit()
    db.refresh(chapter)
    return {"status": "success", "message": "Chapter updated successfully"}

@router.delete("/chapters/{chapter_id}")
def delete_chapter(chapter_id: int, db: Session = Depends(get_db), current_admin=Depends(get_current_admin)):
    chapter = db.query(Chapter).filter(Chapter.id == chapter_id).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    db.delete(chapter)
    db.commit()
    return {"status": "success", "message": "Chapter deleted successfully"}

# Subject CRUD
@router.post("/subjects")
def create_subject(subject_in: SubjectCreate, db: Session = Depends(get_db), current_admin=Depends(get_current_admin)):
    semester = db.query(Semester).filter(Semester.id == subject_in.semester_id).first()
    if not semester:
        raise HTTPException(status_code=404, detail="Semester not found")
    subject = Subject(
        semester_id=subject_in.semester_id,
        title=subject_in.title,
        description=subject_in.description,
        code=subject_in.code,
        order=subject_in.order,
        status="published"
    )
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return {"status": "success", "subject_id": subject.id, "message": "Subject created successfully"}

@router.put("/subjects/{subject_id}")
def update_subject(subject_id: int, subject_in: SubjectUpdate, db: Session = Depends(get_db), current_admin=Depends(get_current_admin)):
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    for field, val in subject_in.model_dump(exclude_unset=True).items():
        setattr(subject, field, val)
        
    db.commit()
    db.refresh(subject)
    return {"status": "success", "message": "Subject updated successfully"}

@router.delete("/subjects/{subject_id}")
def delete_subject(subject_id: int, db: Session = Depends(get_db), current_admin=Depends(get_current_admin)):
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    db.delete(subject)
    db.commit()
    return {"status": "success", "message": "Subject deleted successfully"}

# Semester CRUD
@router.post("/semesters")
def create_semester(semester_in: SemesterCreate, db: Session = Depends(get_db), current_admin=Depends(get_current_admin)):
    course = db.query(Course).filter(Course.id == semester_in.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    semester = Semester(
        course_id=semester_in.course_id,
        title=semester_in.title,
        description=semester_in.description,
        order=semester_in.order
    )
    db.add(semester)
    db.commit()
    db.refresh(semester)
    return {"status": "success", "semester_id": semester.id, "message": "Semester created successfully"}

@router.put("/semesters/{semester_id}")
def update_semester(semester_id: int, semester_in: SemesterUpdate, db: Session = Depends(get_db), current_admin=Depends(get_current_admin)):
    semester = db.query(Semester).filter(Semester.id == semester_id).first()
    if not semester:
        raise HTTPException(status_code=404, detail="Semester not found")
    
    for field, val in semester_in.model_dump(exclude_unset=True).items():
        setattr(semester, field, val)
        
    db.commit()
    db.refresh(semester)
    return {"status": "success", "message": "Semester updated successfully"}

@router.delete("/semesters/{semester_id}")
def delete_semester(semester_id: int, db: Session = Depends(get_db), current_admin=Depends(get_current_admin)):
    semester = db.query(Semester).filter(Semester.id == semester_id).first()
    if not semester:
        raise HTTPException(status_code=404, detail="Semester not found")
    db.delete(semester)
    db.commit()
    return {"status": "success", "message": "Semester deleted successfully"}
