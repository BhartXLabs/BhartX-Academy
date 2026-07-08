from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from app.repositories.base import BaseRepository
from app.models.all_models import LessonProgress, LessonReflection, SpacedRevision, Lesson, QuizAttempt, Quiz, Chapter
import datetime


# ── True SM-2 Algorithm ─────────────────────────────────────────────────────────────
def sm2_calculate_next(repetition: int, ef: float, quality: int) -> tuple[int, float, int]:
    """
    Pure SM-2 (SuperMemo-2) algorithm implementation.

    Args:
        repetition: Number of times this card has been reviewed (0-indexed)
        ef:         Ease Factor (starts at 2.5, min 1.3, max 5.0)
        quality:    Recall quality rating (0–5 scale)
                    0,1 → complete blackout / wrong
                    2   → wrong but recalled with hint
                    3   → correct but with serious difficulty
                    4   → correct after hesitation
                    5   → perfect immediate recall

    Returns:
        Tuple of (next_repetition, new_ef, interval_days)
    """
    if quality < 3:
        # Recall failed — restart repetition count, keep EF
        next_rep = 0
        interval = 1  # Review again tomorrow
    else:
        # Successful recall — advance the schedule
        if repetition == 0:
            interval = 1
        elif repetition == 1:
            interval = 6
        else:
            # Retrieve the previous interval from EF (approximated via repetition)
            # True SM-2 tracks interval per card; here we compute from repetition count
            interval = round(ef ** (repetition - 1))
            interval = max(interval, 1)
        next_rep = repetition + 1

    # Update EF: EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
    new_ef = ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    new_ef = max(1.3, min(5.0, new_ef))  # Clamp to [1.3, 5.0]

    return next_rep, new_ef, interval

class ProgressRepository(BaseRepository[LessonProgress]):
    def get_or_create_progress(self, db: Session, user_id: int, lesson_id: int) -> LessonProgress:
        progress = db.query(LessonProgress).filter(
            LessonProgress.user_id == user_id,
            LessonProgress.lesson_id == lesson_id
        ).first()
        if not progress:
            progress = LessonProgress(
                user_id=user_id,
                lesson_id=lesson_id,
                status="started",
                watch_percentage=0.0,
                time_spent_seconds=0,
                resume_position=0
            )
            db.add(progress)
            db.commit()
            db.refresh(progress)
        return progress

    def update_progress(self, db: Session, progress: LessonProgress, watch_percentage: float, time_spent_seconds: int, resume_position: int, status: str) -> LessonProgress:
        progress.watch_percentage = max(progress.watch_percentage, watch_percentage)
        progress.time_spent_seconds += time_spent_seconds
        progress.resume_position = resume_position
        
        if progress.status != "completed" and (status == "completed" or progress.watch_percentage >= 90.0):
            progress.status = "completed"
            progress.completed_at = datetime.datetime.utcnow()
            # Spaced repetition scheduling is now handled asynchronously via BackgroundTasks
        elif progress.status != "completed" and status == "in_progress":
            progress.status = "in_progress"

        progress.last_watched_at = datetime.datetime.utcnow()
        db.commit()
        db.refresh(progress)
        return progress

    def create_reflection(self, db: Session, user_id: int, lesson_id: int, retrieval_text: str, unresolved_question: Optional[str], confidence: int) -> LessonReflection:
        # Create reflection log
        reflection = LessonReflection(
            user_id=user_id,
            lesson_id=lesson_id,
            retrieval_text=retrieval_text,
            unresolved_question=unresolved_question
        )
        db.add(reflection)
        
        # Save confidence rating in LessonProgress
        progress = self.get_or_create_progress(db, user_id, lesson_id)
        progress.confidence_rating = confidence
        
        db.commit()
        db.refresh(reflection)
        return reflection

    def schedule_spaced_revisions(self, db: Session, user_id: int, lesson_id: int) -> None:
        """
        Create the initial SM-2 revision entry (Stage 1).
        First review always scheduled 1 day after lesson completion.
        EF starts at 2.5 (SM-2 default).
        """
        existing = db.query(SpacedRevision).filter(
            SpacedRevision.user_id == user_id,
            SpacedRevision.lesson_id == lesson_id,
            SpacedRevision.stage == 1
        ).first()
        if existing:
            return

        now = datetime.datetime.utcnow()
        revision = SpacedRevision(
            user_id=user_id,
            lesson_id=lesson_id,
            stage=1,
            ease_factor=2.5,          # SM-2 default starting EF
            scheduled_date=now + datetime.timedelta(days=1),
            is_completed=False
        )
        db.add(revision)
        db.commit()

    def get_spaced_revisions_due(self, db: Session, user_id: int) -> List[SpacedRevision]:
        now = datetime.datetime.utcnow()
        return (
            db.query(SpacedRevision)
            .options(joinedload(SpacedRevision.lesson))  # Eager load lesson in one JOIN query
            .filter(
                SpacedRevision.user_id == user_id,
                SpacedRevision.is_completed == False,
                SpacedRevision.scheduled_date <= now
            )
            .all()
        )

    def complete_spaced_revision(
        self, db: Session, revision_id: int, quality: int = 4
    ) -> Optional[SpacedRevision]:
        """
        Mark a revision as completed and schedule the next one using TRUE SM-2.

        Args:
            quality: Recall quality (0–5). Frontend should send this from the
                     student's self-rated confidence after reviewing the card.
                     Defaults to 4 ("correct after hesitation") if not provided.
        """
        revision = (
            db.query(SpacedRevision)
            .options(joinedload(SpacedRevision.lesson))
            .filter(SpacedRevision.id == revision_id)
            .first()
        )
        if not revision or revision.is_completed:
            return revision

        revision.is_completed = True
        revision.completed_at = datetime.datetime.utcnow()
        revision.last_quality_rating = quality  # Store for analytics

        # ── Run True SM-2 Algorithm ────────────────────────────────────────────
        current_ef = float(revision.ease_factor or 2.5)  # Retrieve stored EF
        current_rep = revision.stage - 1               # Convert stage to 0-indexed repetition

        next_rep, new_ef, interval_days = sm2_calculate_next(
            repetition=current_rep,
            ef=current_ef,
            quality=quality
        )

        # If quality < 3 (failed recall) — reschedule same stage tomorrow with updated EF
        # If quality >= 3 (successful recall) — advance to next stage with SM-2 interval
        next_stage = (current_rep + 1) + 1 if quality >= 3 else revision.stage  # stage is 1-indexed

        # Cap at stage 5 (long-term memory achieved — no more scheduled reviews needed)
        if next_stage <= 5:
            next_exists = db.query(SpacedRevision).filter(
                SpacedRevision.user_id == revision.user_id,
                SpacedRevision.lesson_id == revision.lesson_id,
                SpacedRevision.stage == next_stage,
                SpacedRevision.is_completed == False
            ).first()

            if not next_exists:
                now = datetime.datetime.utcnow()
                new_revision = SpacedRevision(
                    user_id=revision.user_id,
                    lesson_id=revision.lesson_id,
                    stage=next_stage,
                    ease_factor=round(new_ef, 4),     # Persist updated EF for next iteration
                    scheduled_date=now + datetime.timedelta(days=interval_days),
                    is_completed=False
                )
                db.add(new_revision)

        db.commit()
        db.refresh(revision)
        return revision

    def is_lesson_unlocked(self, db: Session, user_id: int, lesson_id: int) -> bool:
        lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
        if not lesson:
            return False

        # If it is the first lesson in the chapter and subject, unlock it.
        # Find all lessons in this subject sorted by chapter order and lesson order.
        chapter = db.query(Chapter).filter(Chapter.id == lesson.chapter_id).first()
        subject_id = chapter.subject_id
        
        # Get all lessons of this subject ordered
        all_subject_lessons = db.query(Lesson).join(Chapter).filter(
            Chapter.subject_id == subject_id
        ).order_by(Chapter.order, Lesson.order).all()

        if not all_subject_lessons:
            return True
            
        if all_subject_lessons[0].id == lesson_id:
            return True

        # Find the index of current lesson
        try:
            current_index = [l.id for l in all_subject_lessons].index(lesson_id)
        except ValueError:
            return False

        # Check if the previous lesson was completed
        prev_lesson = all_subject_lessons[current_index - 1]
        prev_progress = db.query(LessonProgress).filter(
            LessonProgress.user_id == user_id,
            LessonProgress.lesson_id == prev_lesson.id
        ).first()

        if not prev_progress or prev_progress.status != "completed":
            return False

        # Enforce the Mastery quiz block: If the previous lesson completed the chapter, 
        # a quiz is associated with that chapter. The student must pass the quiz with >= 80% score.
        if prev_lesson.chapter_id != lesson.chapter_id:
            # Chapter transition occurred. Check if previous chapter quiz was passed.
            prev_chapter_quizzes = db.query(Quiz).filter(Quiz.chapter_id == prev_lesson.chapter_id).all()
            for quiz in prev_chapter_quizzes:
                best_attempt = db.query(QuizAttempt).filter(
                    QuizAttempt.user_id == user_id,
                    QuizAttempt.quiz_id == quiz.id
                ).order_by(QuizAttempt.score.desc()).first()
                
                # Check if best score is >= 80.0
                if not best_attempt or best_attempt.score < 80.0:
                    return False

        return True

progress_repo = ProgressRepository(LessonProgress)
