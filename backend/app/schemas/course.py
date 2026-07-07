from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime

# Resource Schema
class ResourceBase(BaseModel):
    title: str
    resource_type: str
    url: str
    file_size: int
    mime_type: Optional[str] = None
    downloadable: bool = True

class ResourceResponse(ResourceBase):
    id: int
    lesson_id: int

    class Config:
        from_attributes = True

# Video Prompt Schema
class VideoPromptResponse(BaseModel):
    id: int
    lesson_id: int
    timestamp_seconds: int
    question_text: str
    options: List[str]
    correct_option_index: int

    class Config:
        from_attributes = True

# Lesson Schema
class LessonBase(BaseModel):
    title: str
    description: Optional[str] = None
    video_provider: str = "youtube"
    video_id: Optional[str] = None
    duration_seconds: int = 0
    order: int = 0
    prerequisites: Optional[str] = None
    outcomes: Optional[str] = None

class LessonResponse(LessonBase):
    id: int
    chapter_id: int
    subject_id: Optional[int] = None  # Populated at endpoint level via lesson.chapter.subject_id
    prompts: List[VideoPromptResponse] = []
    resources: List[ResourceResponse] = []

    class Config:
        from_attributes = True

# Chapter Schema
class ChapterBase(BaseModel):
    title: str
    description: Optional[str] = None
    order: int = 0

class ChapterResponse(ChapterBase):
    id: int
    subject_id: int
    lessons: List[LessonResponse] = []

    class Config:
        from_attributes = True

# Subject Schema
class SubjectBase(BaseModel):
    title: str
    description: Optional[str] = None
    code: str
    order: int = 0

class SubjectResponse(SubjectBase):
    id: int
    semester_id: int
    chapters: List[ChapterResponse] = []

    class Config:
        from_attributes = True

# Semester Schema
class SemesterResponse(BaseModel):
    id: int
    course_id: int
    title: str
    description: Optional[str] = None
    order: int
    subjects: List[SubjectResponse] = []

    class Config:
        from_attributes = True

# Course Schema
class CourseResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    code: str
    banner_url: Optional[str] = None
    order: int

    class Config:
        from_attributes = True

# Lesson Progress Update Schema
class ProgressUpdate(BaseModel):
    watch_percentage: float
    time_spent_seconds: int
    resume_position: int
    status: Optional[str] = "in_progress"  # started, in_progress, completed

# Lesson Progress Response
class ProgressResponse(BaseModel):
    id: int
    user_id: int
    lesson_id: int
    status: str
    watch_percentage: float
    resume_position: int
    confidence_rating: Optional[int] = None
    last_watched_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Reflection Submission
class ReflectionCreate(BaseModel):
    retrieval_text: str
    unresolved_question: Optional[str] = None
    confidence_rating: int  # 1-5 scale

class ReflectionResponse(BaseModel):
    id: int
    user_id: int
    lesson_id: int
    retrieval_text: str
    unresolved_question: Optional[str] = None
    submitted_at: datetime

    class Config:
        from_attributes = True

# Spaced Revision Schema
class SpacedRevisionResponse(BaseModel):
    id: int
    user_id: int
    lesson_id: int
    stage: int
    scheduled_date: datetime
    is_completed: bool
    completed_at: Optional[datetime] = None
    lesson_title: Optional[str] = None

    class Config:
        from_attributes = True
