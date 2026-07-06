from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.v1.endpoints.auth import get_current_user
from app.services.ai.gateway import ai_gateway
from app.repositories.progress import progress_repo
from app.schemas.ai import AIDoubtRequest, AIDoubtResponse, AITestGenerateRequest, AITestGenerateResponse
from app.models.all_models import Subject

router = APIRouter()

@router.post("/doubt", response_model=AIDoubtResponse)
def ask_doubt(request_in: AIDoubtRequest, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    doubt_response = ai_gateway.tutor.answer_doubt(request_in.question)
    return doubt_response

@router.post("/test-generate", response_model=AITestGenerateResponse)
def generate_custom_test(request_in: AITestGenerateRequest, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    # Look up subject name
    subject = db.query(Subject).filter(Subject.id == request_in.subject_id).first()
    subject_title = subject.title if subject else "General Computer Science"
    
    quiz_data = ai_gateway.examiner.generate_quiz(subject_title, request_in.difficulty, request_in.num_questions)
    return quiz_data

@router.get("/coach-tip")
def get_coach_tip(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    # Count scheduled revisions due
    revisions_due = len(progress_repo.get_spaced_revisions_due(db, current_user.id))
    coach_data = ai_gateway.coach.generate_coach_message(
        student_name=current_user.name,
        streak=current_user.streak,
        xp=current_user.xp,
        revisions_due=revisions_due
    )
    return coach_data
