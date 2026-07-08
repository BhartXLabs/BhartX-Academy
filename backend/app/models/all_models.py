import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, JSON, Float, Index
from sqlalchemy.orm import relationship
from app.db.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)
    role = Column(String, default="student")  # student, instructor, content_manager, admin, super_admin
    streak = Column(Integer, default=0)
    xp = Column(Integer, default=0)
    onboarded = Column(Boolean, default=False)
    onboarding_profile = Column(JSON, nullable=True)
    provider = Column(String, default="email")
    provider_id = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    last_login = Column(DateTime, nullable=True)
    login_count = Column(Integer, default=0)
    last_active_date = Column(DateTime, default=datetime.datetime.utcnow)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    refresh_sessions = relationship("RefreshSession", back_populates="user", cascade="all, delete-orphan")
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")
    enrollments = relationship("Enrollment", back_populates="user", cascade="all, delete-orphan")
    progress_logs = relationship("LessonProgress", back_populates="user", cascade="all, delete-orphan")
    reflections = relationship("LessonReflection", back_populates="user", cascade="all, delete-orphan")
    spaced_revisions = relationship("SpacedRevision", back_populates="user", cascade="all, delete-orphan")
    quiz_attempts = relationship("QuizAttempt", back_populates="user", cascade="all, delete-orphan")
    mock_attempts = relationship("MockAttempt", back_populates="user", cascade="all, delete-orphan")
    mistakes = relationship("MistakeJournal", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    device = Column(String, nullable=True)
    browser = Column(String, nullable=True)
    ip = Column(String, nullable=True)
    login_at = Column(DateTime, default=datetime.datetime.utcnow)
    logout_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="sessions")



class RefreshSession(Base):
    __tablename__ = "refresh_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    refresh_token = Column(String, unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    is_revoked = Column(Boolean, default=False)

    user = relationship("User", back_populates="refresh_sessions")


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    code = Column(String, unique=True, index=True, nullable=False)
    banner_url = Column(String, nullable=True)
    status = Column(String, default="published")  # published, draft, archived
    order = Column(Integer, default=0)

    # Relationships
    batches = relationship("Batch", back_populates="course", cascade="all, delete-orphan")
    semesters = relationship("Semester", back_populates="course", cascade="all, delete-orphan")
    subjects = relationship("Subject", back_populates="course", cascade="all, delete-orphan")  # Direct subjects (non-semester courses)


class Batch(Base):
    __tablename__ = "batches"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    start_date = Column(DateTime, default=datetime.datetime.utcnow)
    end_date = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)

    # Relationships
    course = relationship("Course", back_populates="batches")
    enrollments = relationship("Enrollment", back_populates="batch", cascade="all, delete-orphan")


class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    batch_id = Column(Integer, ForeignKey("batches.id", ondelete="CASCADE"), nullable=False)
    enrolled_at = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String, default="active")  # active, suspended, completed

    user = relationship("User", back_populates="enrollments")
    batch = relationship("Batch", back_populates="enrollments")


class Semester(Base):
    __tablename__ = "semesters"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    order = Column(Integer, default=0)

    course = relationship("Course", back_populates="semesters")
    subjects = relationship("Subject", back_populates="semester", cascade="all, delete-orphan")


class Subject(Base):
    """
    Generic Subject/Module — works in two modes:

    Mode A (Semester-based courses, e.g. NIELIT A-Level):
        Course → Semester → Subject → Chapter → Lesson
        semester_id is set, course_id is NULL.

    Mode B (Non-semester courses, e.g. UPSC, CCC, AI/ML):
        Course → Subject → Chapter → Lesson
        course_id is set, semester_id is NULL.

    One engine handles all course types without code changes.
    """
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    # Semester-mode FK (nullable — not required for non-semester courses)
    semester_id = Column(Integer, ForeignKey("semesters.id", ondelete="CASCADE"), nullable=True)
    # Direct course-mode FK (nullable — not required for semester courses)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    code = Column(String, nullable=False)
    order = Column(Integer, default=0)
    status = Column(String, default="published")  # published, draft, archived

    semester = relationship("Semester", back_populates="subjects")
    course = relationship("Course", back_populates="subjects")
    chapters = relationship("Chapter", back_populates="subject", cascade="all, delete-orphan")
    pyqs = relationship("PYQ", back_populates="subject", cascade="all, delete-orphan")
    mock_tests = relationship("MockTest", back_populates="subject", cascade="all, delete-orphan")


class Chapter(Base):
    __tablename__ = "chapters"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    order = Column(Integer, default=0)
    status = Column(String, default="published")

    subject = relationship("Subject", back_populates="chapters")
    lessons = relationship("Lesson", back_populates="chapter", cascade="all, delete-orphan")
    quizzes = relationship("Quiz", back_populates="chapter", cascade="all, delete-orphan")


class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    chapter_id = Column(Integer, ForeignKey("chapters.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)  # Markdown notes / lesson overview
    # V1: YouTube only. Future: vimeo, bunny, cloudflare-stream
    video_provider = Column(String, default="youtube")  # youtube | vimeo | bunny | cloudflare
    video_id = Column(String, nullable=True)            # e.g. 'dQw4w9WgXcQ' for YouTube
    notes_url = Column(String, nullable=True)           # Optional: public URL to notes (GitHub, CDN, etc.)
    duration_seconds = Column(Integer, default=0)
    order = Column(Integer, default=0)
    status = Column(String, default="published")
    prerequisites = Column(Text, nullable=True)  # Markdown list / text overview
    outcomes = Column(Text, nullable=True)        # Markdown learning outcomes

    chapter = relationship("Chapter", back_populates="lessons")
    prompts = relationship("VideoPrompt", back_populates="lesson", cascade="all, delete-orphan")
    resources = relationship("Resource", back_populates="lesson", cascade="all, delete-orphan")
    progress_logs = relationship("LessonProgress", back_populates="lesson", cascade="all, delete-orphan")
    reflections = relationship("LessonReflection", back_populates="lesson", cascade="all, delete-orphan")
    spaced_revisions = relationship("SpacedRevision", back_populates="lesson", cascade="all, delete-orphan")


class VideoPrompt(Base):
    __tablename__ = "video_prompts"

    id = Column(Integer, primary_key=True, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False)
    timestamp_seconds = Column(Integer, nullable=False)  # Time in video when question triggers
    question_text = Column(Text, nullable=False)
    options = Column(JSON, nullable=False)  # Array of strings
    correct_option_index = Column(Integer, nullable=False)

    lesson = relationship("Lesson", back_populates="prompts")


class Resource(Base):
    """
    URL-linked resources attached to lessons.
    V1: External URLs only (YouTube playlist, public GitHub, Google Docs, etc.)
    V2+: If file upload is added (assignments, certificates, PDFs), Cloudflare R2 URLs go here.
    No file data is stored in the DB — only the URL pointer.
    """
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    resource_type = Column(String, nullable=False)  # link, pdf, video, repo, doc
    url = Column(String, nullable=False)             # Always a public URL — no file upload in V1
    visibility = Column(String, default="published")  # published, draft

    lesson = relationship("Lesson", back_populates="resources")


class LessonProgress(Base):
    __tablename__ = "lesson_progress"
    __table_args__ = (
        Index("idx_user_lesson", "user_id", "lesson_id"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String, default="started")  # started, in_progress, completed
    watch_percentage = Column(Float, default=0.0)
    time_spent_seconds = Column(Integer, default=0)
    resume_position = Column(Integer, default=0)  # Playback head location in seconds
    confidence_rating = Column(Integer, nullable=True)  # 1 to 5 scale
    last_watched_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="progress_logs")
    lesson = relationship("Lesson", back_populates="progress_logs")


class LessonReflection(Base):
    __tablename__ = "lesson_reflections"
    __table_args__ = (
        Index("idx_user_reflection", "user_id", "lesson_id"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False, index=True)
    retrieval_text = Column(Text, nullable=False)  # Explain what they learned
    unresolved_question = Column(Text, nullable=True)  # What they still didn't understand
    submitted_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="reflections")
    lesson = relationship("Lesson", back_populates="reflections")


class SpacedRevision(Base):
    __tablename__ = "spaced_revisions"
    __table_args__ = (
        Index("idx_user_scheduled", "user_id", "scheduled_date"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False, index=True)
    stage = Column(Integer, default=1)        # SM-2 repetition count (1-indexed stage)
    ease_factor = Column(Float, default=2.5)  # SM-2 E-Factor: starts at 2.5, range [1.3, 5.0]
    last_quality_rating = Column(Integer, nullable=True)  # Last recall quality (0-5 SM-2 scale)
    scheduled_date = Column(DateTime, nullable=False, index=True)
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="spaced_revisions")
    lesson = relationship("Lesson", back_populates="spaced_revisions")



class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    chapter_id = Column(Integer, ForeignKey("chapters.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, default="published")  # published, draft, archived — required by AI test generation

    chapter = relationship("Chapter", back_populates="quizzes")
    questions = relationship("QuizQuestion", back_populates="quiz", cascade="all, delete-orphan")
    attempts = relationship("QuizAttempt", back_populates="quiz", cascade="all, delete-orphan")


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    text = Column(Text, nullable=False)
    options = Column(JSON, nullable=False)  # JSON array of strings
    correct_option_index = Column(Integer, nullable=False)
    order = Column(Integer, default=0)  # Question order within quiz — required by AI test generation

    quiz = relationship("Quiz", back_populates="questions")


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    score = Column(Float, default=0.0)  # Score in percentage or raw score
    total_questions = Column(Integer, nullable=False)
    completed_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="quiz_attempts")
    quiz = relationship("Quiz", back_populates="attempts")


class MistakeJournal(Base):
    __tablename__ = "mistake_journals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    question_text = Column(Text, nullable=False)
    options = Column(JSON, nullable=False)  # JSON array
    selected_option_index = Column(Integer, nullable=False)
    correct_option_index = Column(Integer, nullable=False)
    confidence_rating = Column(String, default="medium")  # high, medium, low (Confidence Calibration)
    explanation = Column(Text, nullable=True)
    source_type = Column(String, nullable=False)  # quiz, mock, video_prompt
    source_id = Column(Integer, nullable=True)  # ID of quiz or mock or video prompt
    resolved = Column(Boolean, default=False, index=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    user = relationship("User", back_populates="mistakes")


class MockTest(Base):
    __tablename__ = "mock_tests"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    difficulty = Column(String, default="medium")  # easy, medium, hard
    duration_minutes = Column(Integer, default=180)
    total_questions = Column(Integer, nullable=False)
    negative_marks_per_question = Column(Float, default=0.25)

    subject = relationship("Subject", back_populates="mock_tests")
    questions = relationship("MockQuestion", back_populates="mock_test", cascade="all, delete-orphan")
    attempts = relationship("MockAttempt", back_populates="mock_test", cascade="all, delete-orphan")


class MockQuestion(Base):
    __tablename__ = "mock_questions"

    id = Column(Integer, primary_key=True, index=True)
    mock_test_id = Column(Integer, ForeignKey("mock_tests.id", ondelete="CASCADE"), nullable=False)
    text = Column(Text, nullable=False)
    options = Column(JSON, nullable=False)  # array of options
    correct_option_index = Column(Integer, nullable=False)
    explanation = Column(Text, nullable=True)

    mock_test = relationship("MockTest", back_populates="questions")


class MockAttempt(Base):
    __tablename__ = "mock_attempts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    mock_test_id = Column(Integer, ForeignKey("mock_tests.id", ondelete="CASCADE"), nullable=False, index=True)
    score = Column(Float, default=0.0)
    total_questions = Column(Integer, nullable=False)
    review_palette = Column(JSON, nullable=True)  # Track flags like flagged, skipped, etc.
    completed_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    user = relationship("User", back_populates="mock_attempts")
    mock_test = relationship("MockTest", back_populates="attempts")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String, default="announcement")  # assignment, exam, reminder, announcement
    is_read = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    user = relationship("User", back_populates="notifications")


class PYQ(Base):
    __tablename__ = "pyqs"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    year = Column(Integer, nullable=False)
    title = Column(String, nullable=False)
    pdf_url = Column(String, nullable=False)
    video_solution_url = Column(String, nullable=True)
    parsed_questions = Column(JSON, nullable=True)  # JSON structure of parsed questions for AI consumption

    subject = relationship("Subject", back_populates="pyqs")
