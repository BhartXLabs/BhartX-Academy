from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from app.repositories.base import BaseRepository
from app.models.all_models import LessonProgress, LessonReflection, SpacedRevision, Lesson, QuizAttempt, Quiz, Chapter
import datetime

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
        # Check if already scheduled
        existing = db.query(SpacedRevision).filter(
            SpacedRevision.user_id == user_id,
            SpacedRevision.lesson_id == lesson_id
        ).first()
        if existing:
            return

        intervals = [1, 3, 7, 15, 30]  # Days
        now = datetime.datetime.utcnow()
        
        for i, days in enumerate(intervals):
            revision = SpacedRevision(
                user_id=user_id,
                lesson_id=lesson_id,
                stage=i + 1,
                scheduled_date=now + datetime.timedelta(days=days),
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

    def complete_spaced_revision(self, db: Session, revision_id: int) -> Optional[SpacedRevision]:
        revision = (
            db.query(SpacedRevision)
            .options(joinedload(SpacedRevision.lesson))  # Eager load for lesson_title in response
            .filter(SpacedRevision.id == revision_id)
            .first()
        )
        if revision:
            revision.is_completed = True
            revision.completed_at = datetime.datetime.utcnow()
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
