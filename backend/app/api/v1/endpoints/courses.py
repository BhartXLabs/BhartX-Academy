from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.api.v1.endpoints.auth import get_current_user
from app.repositories.course import course_repo
from app.repositories.progress import progress_repo
from app.schemas.course import CourseResponse, SemesterResponse, SubjectResponse, LessonResponse, ProgressResponse
from app.models.all_models import Subject, Lesson

router = APIRouter()

@router.get("", response_model=List[CourseResponse])
def get_courses(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return course_repo.get_active_courses(db)

@router.get("/{course_id}/semesters", response_model=List[SemesterResponse])
def get_semesters(course_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return course_repo.get_semesters_by_course(db, course_id)

@router.get("/subjects/{subject_id}", response_model=SubjectResponse)
def get_subject(subject_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    subject = course_repo.get_subject_with_chapters(db, subject_id)
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    return subject

@router.get("/lessons/{lesson_id}", response_model=LessonResponse)
def get_lesson(lesson_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    # Verify lesson unlock guard
    unlocked = progress_repo.is_lesson_unlocked(db, current_user.id, lesson_id)
    if not unlocked:
         raise HTTPException(status_code=403, detail="Lesson is locked. Master previous topics and complete chapter quizzes to unlock.")
         
    lesson = course_repo.get_lesson(db, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson

@router.get("/lessons/{lesson_id}/unlock-status")
def get_unlock_status(lesson_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    unlocked = progress_repo.is_lesson_unlocked(db, current_user.id, lesson_id)
    return {"lesson_id": lesson_id, "unlocked": unlocked}

@router.get("/subjects/{subject_id}/pyqs")
def get_subject_pyqs(subject_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return course_repo.get_pyqs_by_subject(db, subject_id)
