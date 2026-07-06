from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db, SessionLocal
from app.api.v1.endpoints.auth import get_current_user
from app.repositories.progress import progress_repo
from app.repositories.user import user_repo
from app.schemas.course import ProgressUpdate, ProgressResponse, ReflectionCreate, ReflectionResponse, SpacedRevisionResponse

router = APIRouter()

def schedule_spaced_revisions_task(user_id: int, lesson_id: int):
    db = SessionLocal()
    try:
        progress_repo.schedule_spaced_revisions(db, user_id, lesson_id)
    except Exception as e:
        import logging
        logging.error(f"Error executing revision schedule background task: {e}")
    finally:
        db.close()

@router.get("/lessons/{lesson_id}", response_model=ProgressResponse)
def get_lesson_progress(lesson_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return progress_repo.get_or_create_progress(db, current_user.id, lesson_id)

@router.post("/lessons/{lesson_id}", response_model=ProgressResponse)
def update_lesson_progress(lesson_id: int, progress_in: ProgressUpdate, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    progress = progress_repo.get_or_create_progress(db, current_user.id, lesson_id)
    
    # Track complete transitions to award XP
    was_completed = progress.status == "completed"
    
    updated = progress_repo.update_progress(
        db, 
        progress, 
        progress_in.watch_percentage, 
        progress_in.time_spent_seconds, 
        progress_in.resume_position, 
        progress_in.status
    )
    
    # Award XP if completed for the first time
    if not was_completed and updated.status == "completed":
        user_repo.update_streak_and_xp(db, current_user, xp_gain=50) # 50 XP for lesson completion
        # Offload revision scheduling to a background thread task
        background_tasks.add_task(schedule_spaced_revisions_task, current_user.id, lesson_id)
        
    return updated

@router.post("/lessons/{lesson_id}/reflection", response_model=ReflectionResponse)
def submit_reflection(lesson_id: int, reflection_in: ReflectionCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    # Verify lesson unlock
    unlocked = progress_repo.is_lesson_unlocked(db, current_user.id, lesson_id)
    if not unlocked:
         raise HTTPException(status_code=403, detail="Lesson is locked.")
         
    reflection = progress_repo.create_reflection(
        db, 
        current_user.id, 
        lesson_id, 
        reflection_in.retrieval_text, 
        reflection_in.unresolved_question,
        reflection_in.confidence_rating
    )
    
    # Award XP for Feynman Recall
    user_repo.update_streak_and_xp(db, current_user, xp_gain=30) # 30 XP for recall reflection
    return reflection

@router.get("/spaced-revisions", response_model=List[SpacedRevisionResponse])
def get_spaced_revisions(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    revisions = progress_repo.get_spaced_revisions_due(db, current_user.id)
    response = []
    for r in revisions:
        # Load lesson title placeholder
        lesson = r.lesson
        response.append({
            "id": r.id,
            "user_id": r.user_id,
            "lesson_id": r.lesson_id,
            "stage": r.stage,
            "scheduled_date": r.scheduled_date,
            "is_completed": r.is_completed,
            "completed_at": r.completed_at,
            "lesson_title": lesson.title if lesson else "Lesson"
        })
    return response

@router.post("/spaced-revisions/{revision_id}/complete", response_model=SpacedRevisionResponse)
def complete_revision(revision_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    revision = progress_repo.complete_spaced_revision(db, revision_id)
    if not revision:
        raise HTTPException(status_code=404, detail="Revision schedule not found")
    
    # Reward study habits
    user_repo.update_streak_and_xp(db, current_user, xp_gain=40) # 40 XP for spaced revision completion
    return {
        "id": revision.id,
        "user_id": revision.user_id,
        "lesson_id": revision.lesson_id,
        "stage": revision.stage,
        "scheduled_date": revision.scheduled_date,
        "is_completed": revision.is_completed,
        "completed_at": revision.completed_at,
        "lesson_title": revision.lesson.title if revision.lesson else "Lesson"
    }
