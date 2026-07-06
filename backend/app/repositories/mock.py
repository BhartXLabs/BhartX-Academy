from typing import List, Optional, Any
from sqlalchemy.orm import Session, joinedload
from app.repositories.base import BaseRepository
from app.models.all_models import MockTest, MockAttempt, MockQuestion

class MockRepository(BaseRepository[MockTest]):
    def get_mocks_by_subject(self, db: Session, subject_id: int) -> List[MockTest]:
        return db.query(MockTest).filter(MockTest.subject_id == subject_id).all()

    def get_mock_test_details(self, db: Session, mock_id: int) -> Optional[MockTest]:
        return db.query(MockTest).options(
            joinedload(MockTest.questions)
        ).filter(MockTest.id == mock_id).first()

    def create_mock_attempt(self, db: Session, user_id: int, mock_test_id: int, score: float, total_questions: int, review_palette: Any) -> MockAttempt:
        attempt = MockAttempt(
            user_id=user_id,
            mock_test_id=mock_test_id,
            score=score,
            total_questions=total_questions,
            review_palette=review_palette
        )
        db.add(attempt)
        db.commit()
        db.refresh(attempt)
        return attempt

mock_repo = MockRepository(MockTest)
