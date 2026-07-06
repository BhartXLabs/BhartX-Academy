from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.api.v1.endpoints.auth import get_current_user
from app.models.all_models import MockTest, MockQuestion, MockAttempt
from app.repositories.mock import mock_repo
from app.repositories.journal import journal_repo
from app.repositories.user import user_repo
from app.schemas.mock import MockTestResponse, MockAttemptSubmit, MockAttemptResponse
import datetime

router = APIRouter()

@router.get("", response_model=List[MockTestResponse])
def get_mocks(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    # Standard mocks lists across all subjects
    mocks = db.query(MockTest).all()
    return mocks

@router.get("/{mock_id}", response_model=MockTestResponse)
def get_mock_test(mock_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    mock = mock_repo.get_mock_test_details(db, mock_id)
    if not mock:
        raise HTTPException(status_code=404, detail="Mock test not found")
    return mock

@router.post("/{mock_id}/submit", response_model=MockAttemptResponse)
def submit_mock(mock_id: int, submit_in: MockAttemptSubmit, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    mock = mock_repo.get_mock_test_details(db, mock_id)
    if not mock:
        raise HTTPException(status_code=404, detail="Mock test not found")
        
    questions = db.query(MockQuestion).filter(MockQuestion.mock_test_id == mock_id).all()
    if not questions:
        raise HTTPException(status_code=400, detail="Mock test has no questions")

    q_map = {q.id: q for q in questions}
    
    correct_count = 0
    incorrect_count = 0
    total_q = len(questions)
    
    for ans in submit_in.answers:
        q = q_map.get(ans.question_id)
        if not q:
            continue
        
        # Check if skipped (-1)
        if ans.selected_option_index == -1:
            continue
            
        is_correct = (ans.selected_option_index == q.correct_option_index)
        if is_correct:
            correct_count += 1
        else:
            incorrect_count += 1
            # Log in Mistake Journal
            explanation = q.explanation or f"Correct choice is '{q.options[q.correct_option_index]}'."
            journal_repo.log_mistake(
                db,
                user_id=current_user.id,
                question_text=q.text,
                options=q.options,
                selected_option_index=ans.selected_option_index,
                correct_option_index=q.correct_option_index,
                confidence_rating=ans.confidence_rating,
                explanation=explanation,
                source_type="mock",
                source_id=mock_id
            )

    # Scoring with negative marking simulation
    # Formula: raw_score = correct_count - (incorrect_count * negative_marks_per_question)
    raw_score = float(correct_count) - (float(incorrect_count) * mock.negative_marks_per_question)
    
    # Cap score percentage between 0 and 100
    score_percentage = max(0.0, (raw_score / total_q) * 100.0)
    
    attempt = mock_repo.create_mock_attempt(
        db,
        user_id=current_user.id,
        mock_test_id=mock_id,
        score=score_percentage,
        total_questions=total_q,
        review_palette=submit_in.review_palette
    )
    
    # Award performance XP
    xp_gain = 50 + int(score_percentage * 0.5)
    user_repo.update_streak_and_xp(db, current_user, xp_gain=xp_gain)
    
    return attempt
