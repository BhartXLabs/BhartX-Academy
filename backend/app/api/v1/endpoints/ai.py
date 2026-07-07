"""
AI Endpoints — All async, with backend-managed conversation history.
Architecture (per GPT review):
  Frontend sends: { conversation_id, question }
  Backend fetches: last 6 messages from DB
  Backend builds: prompt + history → LLM
  Backend stores: new user message + AI response in DB
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.db.session import get_db
from app.api.v1.endpoints.auth import get_current_user
from app.services.ai.gateway import ai_gateway
from app.repositories.progress import progress_repo
from app.schemas.ai import AIDoubtRequest, AIDoubtResponse, AITestGenerateRequest, AITestGenerateResponse
from app.models.all_models import Subject
from app.core.ratelimit import limiter
import datetime

router = APIRouter()


def _get_conversation_history(db: Session, conversation_id: int, user_id: int, limit: int = 6):
    """Fetch last N messages from a conversation (backend-managed, secure)."""
    try:
        from sqlalchemy import text
        result = db.execute(
            text("""
                SELECT role, content FROM conversation_messages
                WHERE conversation_id = :conv_id
                ORDER BY id DESC LIMIT :limit
            """),
            {"conv_id": conversation_id, "limit": limit}
        ).fetchall()
        # Reverse to chronological order
        return [{"role": row[0], "content": row[1]} for row in reversed(result)]
    except Exception:
        return []


def _save_conversation_turn(db: Session, conversation_id: int, user_msg: str, ai_msg: str):
    """Persist a user + assistant turn to conversation_messages."""
    try:
        from sqlalchemy import text
        db.execute(
            text("INSERT INTO conversation_messages (conversation_id, role, content) VALUES (:cid, 'user', :content)"),
            {"cid": conversation_id, "content": user_msg}
        )
        db.execute(
            text("INSERT INTO conversation_messages (conversation_id, role, content) VALUES (:cid, 'assistant', :content)"),
            {"cid": conversation_id, "content": ai_msg}
        )
        # Update conversation updated_at
        db.execute(
            text("UPDATE conversations SET updated_at = :now WHERE id = :cid"),
            {"cid": conversation_id, "now": datetime.datetime.utcnow()}
        )
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[AI] Failed to save conversation turn: {e}")


def _get_or_create_conversation(db: Session, user_id: int, context: str = "general") -> int:
    """Get existing or create new conversation for user+context. Returns conversation_id."""
    try:
        from sqlalchemy import text
        row = db.execute(
            text("SELECT id FROM conversations WHERE user_id = :uid AND context = :ctx ORDER BY updated_at DESC LIMIT 1"),
            {"uid": user_id, "ctx": context}
        ).fetchone()
        if row:
            return row[0]
        # Create new
        result = db.execute(
            text("INSERT INTO conversations (user_id, context) VALUES (:uid, :ctx)"),
            {"uid": user_id, "ctx": context}
        )
        db.commit()
        return result.lastrowid
    except Exception:
        return 0  # Graceful degradation — no history


@router.post("/doubt", response_model=AIDoubtResponse)
@limiter.limit("20/minute")
async def ask_doubt(
    request: Request,
    request_in: AIDoubtRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Socratic AI Doubt Solver with backend-managed multi-turn conversation memory."""
    # Get or create conversation session for this user
    conversation_id = _get_or_create_conversation(db, current_user.id, context="tutor")

    # Fetch last 6 messages securely from DB (NOT from frontend)
    history = _get_conversation_history(db, conversation_id, current_user.id, limit=6)

    # Call tutor agent with history for context-aware response
    doubt_response = await ai_gateway.tutor.answer_doubt(request_in.question, history=history)

    # Persist this turn to DB for future context
    ai_answer = doubt_response.get("answer", "")
    _save_conversation_turn(db, conversation_id, request_in.question, ai_answer)

    # Include conversation_id in response so frontend can track session
    doubt_response["conversation_id"] = conversation_id
    return doubt_response


@router.post("/doubt/new-session")
async def start_new_conversation(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Start a fresh conversation (clears context for a new topic)."""
    try:
        from sqlalchemy import text
        result = db.execute(
            text("INSERT INTO conversations (user_id, context) VALUES (:uid, 'tutor')"),
            {"uid": current_user.id}
        )
        db.commit()
        return {"conversation_id": result.lastrowid, "message": "New conversation started"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/test-generate")
@limiter.limit("20/minute")
async def generate_custom_test(
    request: Request,
    request_in: AITestGenerateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    from app.models.all_models import Quiz, QuizQuestion, Chapter
    import json

    subject = db.query(Subject).filter(Subject.id == request_in.subject_id).first()
    subject_title = subject.title if subject else "General Computer Science"

    first_chapter = db.query(Chapter).filter(Chapter.subject_id == request_in.subject_id).first()
    if not first_chapter:
        raise HTTPException(status_code=400, detail="Cannot generate quiz for a subject with no chapters")

    # Async call to AI examiner
    raw_quiz_data = await ai_gateway.examiner.generate_quiz(
        subject_title, request_in.difficulty, request_in.num_questions
    )

    try:
        quiz_json = json.loads(raw_quiz_data) if isinstance(raw_quiz_data, str) else raw_quiz_data

        new_quiz = Quiz(
            chapter_id=first_chapter.id,
            title=f"AI Generated Test: {subject_title}",
            description=f"AI Custom {request_in.difficulty} Mock Test for {subject_title}.",
            status="published"
        )
        db.add(new_quiz)
        db.commit()
        db.refresh(new_quiz)

        questions_list = quiz_json.get("questions", [])
        for index, q in enumerate(questions_list):
            new_question = QuizQuestion(
                quiz_id=new_quiz.id,
                text=q.get("question_text", q.get("text", "Question")),
                options=q.get("options", ["A", "B", "C", "D"]),
                correct_option_index=q.get("correct_option_index", 0),
                order=index
            )
            db.add(new_question)

        db.commit()
        return {
            "success": True,
            "message": "AI Custom Test generated successfully",
            "quiz_id": new_quiz.id,
            "title": new_quiz.title,
            "total_questions": len(questions_list)
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save generated quiz: {str(e)}")


@router.get("/coach-tip")
@limiter.limit("20/minute")
async def get_coach_tip(
    request: Request,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    revisions_due = len(progress_repo.get_spaced_revisions_due(db, current_user.id))
    coach_data = await ai_gateway.coach.generate_coach_message(
        student_name=current_user.name,
        streak=current_user.streak,
        xp=current_user.xp,
        revisions_due=revisions_due
    )
    return coach_data


@router.get("/study-plan")
async def get_study_plan(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Rule-based Daily Study Planner (V1 — deterministic, fast, cheap).
    Uses: spaced revisions due + unresolved mistakes + onboarding profile.
    AI only writes the motivational explanation text.
    """
    from sqlalchemy import text

    profile = current_user.onboarding_profile or {}
    daily_minutes = int(profile.get("daily_time_minutes", 60))

    # Rule Engine: Collect tasks by priority
    plan_items = []
    total_minutes = 0

    # Priority 1: Spaced Revisions Due (Memory retention — highest cognitive priority)
    revisions = progress_repo.get_spaced_revisions_due(db, current_user.id)
    for rev in revisions[:3]:  # Max 3 revisions per day
        if total_minutes + 10 <= daily_minutes:
            plan_items.append({
                "type": "spaced_revision",
                "priority": 1,
                "title": f"Review: {rev.lesson_id}",
                "duration_minutes": 10,
                "reason": "Spaced revision due — reinforces long-term memory retention",
                "link": f"/lessons/{rev.lesson_id}"
            })
            total_minutes += 10

    # Priority 2: Unresolved Mistakes (Error correction)
    try:
        mistake_count = db.execute(
            text("SELECT COUNT(*) FROM mistake_journals WHERE user_id = :uid AND resolved = 0"),
            {"uid": current_user.id}
        ).scalar() or 0
        if mistake_count > 0 and total_minutes + 15 <= daily_minutes:
            plan_items.append({
                "type": "mistake_journal",
                "priority": 2,
                "title": f"Fix {min(mistake_count, 3)} Mistakes in Journal",
                "duration_minutes": 15,
                "reason": f"You have {mistake_count} unresolved mistake(s) — resolving them closes knowledge gaps",
                "link": "/journal"
            })
            total_minutes += 15
    except Exception:
        pass

    # Priority 3: Weak Subject lessons (from onboarding profile)
    weak_subjects = profile.get("weak_subjects", [])
    if weak_subjects and total_minutes + 30 <= daily_minutes:
        plan_items.append({
            "type": "lesson",
            "priority": 3,
            "title": f"Study: {weak_subjects[0]}",
            "duration_minutes": 30,
            "reason": f"You marked '{weak_subjects[0]}' as a weak subject — focused practice builds mastery",
            "link": "/courses"
        })
        total_minutes += 30

    # Priority 4: General new lesson (continue progress)
    if total_minutes + 25 <= daily_minutes:
        plan_items.append({
            "type": "new_lesson",
            "priority": 4,
            "title": "Continue Next Lesson",
            "duration_minutes": 25,
            "reason": "Consistent forward progress — compound learning effect",
            "link": "/courses"
        })
        total_minutes += 25

    # AI writes the motivational summary (only role of AI in V1 planner)
    summary_prompt = (
        f"Write a 2-sentence motivational study plan summary for {current_user.name}. "
        f"They have {current_user.streak} study days streak, {current_user.xp} XP. "
        f"Today's plan: {len(plan_items)} tasks, {total_minutes} minutes. Be warm and specific."
    )
    try:
        ai_summary_raw = await ai_gateway.coach.provider.generate_text(
            "You are a warm, expert study coach. Write brief, specific motivational messages.",
            summary_prompt
        )
        # Strip JSON if offline provider
        try:
            import json
            parsed = json.loads(ai_summary_raw)
            ai_summary = parsed.get("answer", ai_summary_raw)
        except Exception:
            ai_summary = ai_summary_raw
    except Exception:
        ai_summary = (
            f"Great work, {current_user.name}! Today's {total_minutes}-minute plan is designed "
            "to maximize your retention using spaced repetition and active recall."
        )

    return {
        "student_name": current_user.name,
        "date": datetime.datetime.utcnow().strftime("%A, %d %B %Y"),
        "total_minutes_planned": total_minutes,
        "daily_target_minutes": daily_minutes,
        "items": plan_items,
        "ai_summary": ai_summary,
        "streak": current_user.streak,
        "xp": current_user.xp
    }
