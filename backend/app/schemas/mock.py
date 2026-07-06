from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime

class MockQuestionResponse(BaseModel):
    id: int
    mock_test_id: int
    text: str
    options: List[str]
    explanation: Optional[str] = None

    class Config:
        from_attributes = True

class MockTestResponse(BaseModel):
    id: int
    subject_id: int
    title: str
    difficulty: str
    duration_minutes: int
    total_questions: int
    negative_marks_per_question: float
    questions: List[MockQuestionResponse] = []

    class Config:
        from_attributes = True

class MockAnswerSubmit(BaseModel):
    question_id: int
    selected_option_index: int  # -1 represents skipped
    confidence_rating: str  # high, medium, low

class MockAttemptSubmit(BaseModel):
    answers: List[MockAnswerSubmit]
    review_palette: Any  # JSON list tracking status (flagged, skipped, etc.)

class MockAttemptResponse(BaseModel):
    id: int
    user_id: int
    mock_test_id: int
    score: float
    total_questions: int
    review_palette: Any
    completed_at: datetime

    class Config:
        from_attributes = True
