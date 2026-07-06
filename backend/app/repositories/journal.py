from typing import List, Optional
from sqlalchemy.orm import Session
from app.repositories.base import BaseRepository
from app.models.all_models import MistakeJournal
import datetime

class JournalRepository(BaseRepository[MistakeJournal]):
    def get_student_mistakes(self, db: Session, user_id: int, resolved: bool = False, skip: int = 0, limit: int = 20) -> List[MistakeJournal]:
        return db.query(MistakeJournal).filter(
            MistakeJournal.user_id == user_id,
            MistakeJournal.resolved == resolved
        ).offset(skip).limit(limit).all()

    def log_mistake(self, db: Session, user_id: int, question_text: str, options: List[str], selected_option_index: int, correct_option_index: int, confidence_rating: str, explanation: Optional[str], source_type: str, source_id: Optional[int]) -> MistakeJournal:
        # Check if identical unresolved mistake exists to prevent clutter
        existing = db.query(MistakeJournal).filter(
            MistakeJournal.user_id == user_id,
            MistakeJournal.question_text == question_text,
            MistakeJournal.resolved == False
        ).first()
        
        if existing:
            existing.selected_option_index = selected_option_index
            existing.confidence_rating = confidence_rating
            existing.created_at = datetime.datetime.utcnow()
            db.commit()
            db.refresh(existing)
            return existing

        mistake = MistakeJournal(
            user_id=user_id,
            question_text=question_text,
            options=options,
            selected_option_index=selected_option_index,
            correct_option_index=correct_option_index,
            confidence_rating=confidence_rating,
            explanation=explanation,
            source_type=source_type,
            source_id=source_id,
            resolved=False
        )
        db.add(mistake)
        db.commit()
        db.refresh(mistake)
        return mistake

    def resolve_mistake(self, db: Session, mistake_id: int) -> Optional[MistakeJournal]:
        mistake = db.query(MistakeJournal).filter(MistakeJournal.id == mistake_id).first()
        if mistake:
            mistake.resolved = True
            mistake.reviewed_at = datetime.datetime.utcnow()
            db.commit()
            db.refresh(mistake)
        return mistake

journal_repo = JournalRepository(MistakeJournal)
