from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class QuizQuestionResponse(BaseModel):
    id: int
    quiz_id: int
    text: str
    options: List[str]

    class Config:
        from_attributes = True

class QuizResponse(BaseModel):
    id: int
    chapter_id: int
    title: str
    description: Optional[str] = None
    questions: List[QuizQuestionResponse] = []

    class Config:
        from_attributes = True

class QuestionAnswer(BaseModel):
    question_id: int
    selected_option_index: int
    confidence_rating: str  # high, medium, low

class QuizAttemptSubmit(BaseModel):
    answers: List[QuestionAnswer]

class QuizAttemptResponse(BaseModel):
    id: int
    user_id: int
    quiz_id: int
    score: float
    total_questions: int
    completed_at: datetime

    class Config:
        from_attributes = True
