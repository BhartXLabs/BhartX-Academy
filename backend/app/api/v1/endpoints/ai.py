from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.v1.endpoints.auth import get_current_user
from app.services.ai.gateway import ai_gateway
from app.repositories.progress import progress_repo
from app.schemas.ai import AIDoubtRequest, AIDoubtResponse, AITestGenerateRequest, AITestGenerateResponse
from app.models.all_models import Subject
from app.core.ratelimit import limiter

router = APIRouter()

@router.post("/doubt", response_model=AIDoubtResponse)
@limiter.limit("20/minute")
def ask_doubt(request: Request, request_in: AIDoubtRequest, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    doubt_response = ai_gateway.tutor.answer_doubt(request_in.question)
    return doubt_response

@router.post("/test-generate")
@limiter.limit("20/minute")
def generate_custom_test(request: Request, request_in: AITestGenerateRequest, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    from app.models.all_models import Quiz, QuizQuestion, Chapter
    import json
    
    # 1. Look up subject and its first chapter to link the generated quiz
    subject = db.query(Subject).filter(Subject.id == request_in.subject_id).first()
    subject_title = subject.title if subject else "General Computer Science"
    
    first_chapter = db.query(Chapter).filter(Chapter.subject_id == request_in.subject_id).first()
    if not first_chapter:
        raise HTTPException(status_code=400, detail="Cannot generate quiz for a subject with no chapters")

    # 2. Call AI Examiner to generate raw quiz content
    raw_quiz_data = ai_gateway.examiner.generate_quiz(subject_title, request_in.difficulty, request_in.num_questions)
    
    # 3. Save the generated quiz to the database so the student can play it
    try:
        # Check if the AI returned a JSON string or dictionary
        quiz_json = json.loads(raw_quiz_data) if isinstance(raw_quiz_data, str) else raw_quiz_data
        
        # Create Quiz entry
        new_quiz = Quiz(
            chapter_id=first_chapter.id,
            title=f"AI Generated Test: {subject_title}",
            description=f"AI Custom {request_in.difficulty} Mock Test for {subject_title}.",
            status="published"
        )
        db.add(new_quiz)
        db.commit()
        db.refresh(new_quiz)
        
        # Create QuizQuestion entries
        questions_list = quiz_json.get("questions", [])
        for index, q in enumerate(questions_list):
            new_question = QuizQuestion(
                quiz_id=new_quiz.id,
                text=q.get("question_text", "Question"),
                options=q.get("options", ["A", "B", "C", "D"]),
                correct_option_index=q.get("correct_option_index", 0),
                order=index
            )
            db.add(new_question)
            
        db.commit()
        return {
            "success": True,
            "message": "AI Custom Test generated and saved successfully",
            "quiz_id": new_quiz.id,
            "title": new_quiz.title,
            "total_questions": len(questions_list)
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save generated quiz in database: {str(e)}")

@router.get("/coach-tip")
@limiter.limit("20/minute")
def get_coach_tip(request: Request, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    # Count scheduled revisions due
    revisions_due = len(progress_repo.get_spaced_revisions_due(db, current_user.id))
    coach_data = ai_gateway.coach.generate_coach_message(
        student_name=current_user.name,
        streak=current_user.streak,
        xp=current_user.xp,
        revisions_due=revisions_due
    )
    return coach_data
