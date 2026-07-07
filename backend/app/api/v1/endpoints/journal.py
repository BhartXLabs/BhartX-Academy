from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.api.v1.endpoints.auth import get_current_user
from app.repositories.journal import journal_repo
from app.repositories.user import user_repo
from app.schemas.journal import MistakeJournalResponse, MistakeResolveRequest

router = APIRouter()

@router.get("", response_model=List[MistakeJournalResponse])
def get_mistakes(resolved: bool = False, skip: int = 0, limit: int = 20, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return journal_repo.get_student_mistakes(db, current_user.id, resolved, skip, limit)

@router.post("/{mistake_id}/resolve")
def resolve_mistake(mistake_id: int, resolve_in: MistakeResolveRequest, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    mistake = journal_repo.get(db, id=mistake_id)
    if not mistake or mistake.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Mistake record not found")
        
    if mistake.resolved:
         return {"status": "success", "message": "Already resolved", "resolved": True}

    is_correct = (resolve_in.selected_option_index == mistake.correct_option_index)
    if is_correct:
        journal_repo.resolve_mistake(db, mistake_id)
        # Reward resolution efforts
        user_repo.update_streak_and_xp(db, current_user, xp_gain=15)
        return {"status": "success", "message": "Correct! Mistake resolved.", "resolved": True}
    else:
        return {"status": "error", "message": "Incorrect answer. Try reading the explanation again.", "resolved": False}

@router.get("/stats")
def get_mistake_stats(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    unresolved_count = journal_repo.count_student_mistakes(db, current_user.id, resolved=False)
    resolved_count = journal_repo.count_student_mistakes(db, current_user.id, resolved=True)
    return {
        "unresolved": unresolved_count,
        "resolved": resolved_count,
        "total": unresolved_count + resolved_count
    }
