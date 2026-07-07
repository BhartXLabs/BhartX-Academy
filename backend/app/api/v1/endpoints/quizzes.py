from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.api.v1.endpoints.auth import get_current_user
from app.models.all_models import Quiz, QuizQuestion, QuizAttempt
from app.repositories.journal import journal_repo
from app.repositories.user import user_repo
from app.schemas.quiz import QuizResponse, QuizAttemptSubmit, QuizAttemptResponse
import datetime

from app.repositories.progress import progress_repo

router = APIRouter()

@router.get("/{quiz_id}", response_model=QuizResponse)
def get_quiz(quiz_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return quiz

@router.post("/{quiz_id}/submit", response_model=QuizAttemptResponse)
def submit_quiz(quiz_id: int, submit_in: QuizAttemptSubmit, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
        
    # Security: Verify if the student is eligible to take this quiz (is the quiz chapter unlocked?)
    # A chapter's quiz is unlocked if the first lesson in the chapter is unlocked.
    from app.models.all_models import Lesson
    first_lesson = db.query(Lesson).filter(Lesson.chapter_id == quiz.chapter_id).order_by(Lesson.order).first()
    if first_lesson:
        unlocked = progress_repo.is_lesson_unlocked(db, current_user.id, first_lesson.id)
        if not unlocked:
            raise HTTPException(status_code=403, detail="Eligibility error: Master previous lessons and chapters first.")
        
    questions = db.query(QuizQuestion).filter(QuizQuestion.quiz_id == quiz_id).all()
    if not questions:
        raise HTTPException(status_code=400, detail="Quiz contains no questions")

    # Map question ID to model object for verification
    q_map = {q.id: q for q in questions}
    
    correct_count = 0
    total_q = len(questions)
    
    for ans in submit_in.answers:
        q = q_map.get(ans.question_id)
        if not q:
            continue
        
        is_correct = (ans.selected_option_index == q.correct_option_index)
        if is_correct:
            correct_count += 1
        else:
            # Mistake Journal: Log incorrect answers
            explanation = f"Correct answer is '{q.options[q.correct_option_index]}'."
            journal_repo.log_mistake(
                db, 
                user_id=current_user.id,
                question_text=q.text,
                options=q.options,
                selected_option_index=ans.selected_option_index,
                correct_option_index=q.correct_option_index,
                confidence_rating=ans.confidence_rating,
                explanation=explanation,
                source_type="quiz",
                source_id=quiz_id
            )
            
    # Calculate score percentage
    score_percentage = (correct_count / total_q) * 100.0
    
    attempt = QuizAttempt(
        user_id=current_user.id,
        quiz_id=quiz_id,
        score=score_percentage,
        total_questions=total_q,
        completed_at=datetime.datetime.utcnow()
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    
    # Award XP for completions and high performance
    xp_gain = 20
    if score_percentage >= 80.0:
        xp_gain += 30  # Mastery Bonus XP
    user_repo.update_streak_and_xp(db, current_user, xp_gain=xp_gain)
    
    return attempt
