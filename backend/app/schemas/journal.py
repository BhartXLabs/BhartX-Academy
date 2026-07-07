from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class MistakeJournalResponse(BaseModel):
    id: int
    user_id: int
    question_text: str
    options: List[str]
    selected_option_index: int
    correct_option_index: int
    confidence_rating: str
    explanation: Optional[str] = None
    source_type: str
    source_id: Optional[int] = None
    resolved: bool
    reviewed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class MistakeResolveRequest(BaseModel):
    selected_option_index: int

class MistakeCreateRequest(BaseModel):
    """Direct mistake logging — used by video prompts, AI test, and any non-quiz source."""
    question_text: str
    options: List[str]
    selected_option_index: int
    correct_option_index: int
    confidence_rating: str = "medium"
    explanation: Optional[str] = None
    source_type: str  # video_prompt, ai_test, manual
    source_id: Optional[int] = None  # lesson_id, subject_id, etc.
