from pydantic import BaseModel
from typing import List, Optional

class AIDoubtRequest(BaseModel):
    question: str
    lesson_id: Optional[int] = None
    subject_id: Optional[int] = None

class AIDoubtResponse(BaseModel):
    role: str  # tutor, coach, examiner
    answer: str
    explanation: Optional[str] = None
    analogy: Optional[str] = None
    example: Optional[str] = None
    try_yourself: Optional[str] = None
    practice_question: Optional[str] = None

class AITestGenerateRequest(BaseModel):
    subject_id: int
    difficulty: str  # easy, medium, hard
    num_questions: int = 5

class AITestQuestion(BaseModel):
    text: str
    options: List[str]
    correct_option_index: int
    explanation: Optional[str] = None

class AITestGenerateResponse(BaseModel):
    questions: List[AITestQuestion]
