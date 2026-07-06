from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from app.repositories.base import BaseRepository
from app.models.all_models import Course, Batch, Enrollment, Semester, Subject, Chapter, Lesson, Resource, PYQ

class CourseRepository(BaseRepository[Course]):
    def get_active_courses(self, db: Session) -> List[Course]:
        return db.query(Course).filter(Course.status == "published").order_by(Course.order).all()

    def get_batches(self, db: Session, course_id: int) -> List[Batch]:
        return db.query(Batch).filter(Batch.course_id == course_id, Batch.is_active == True).all()

    def create_enrollment(self, db: Session, user_id: int, batch_id: int) -> Enrollment:
        existing = db.query(Enrollment).filter(
            Enrollment.user_id == user_id, 
            Enrollment.batch_id == batch_id
        ).first()
        if existing:
            return existing
        enrollment = Enrollment(user_id=user_id, batch_id=batch_id, status="active")
        db.add(enrollment)
        db.commit()
        db.refresh(enrollment)
        return enrollment

    def get_user_enrollments(self, db: Session, user_id: int) -> List[Enrollment]:
        return db.query(Enrollment).options(joinedload(Enrollment.batch).joinedload(Batch.course)).filter(
            Enrollment.user_id == user_id,
            Enrollment.status == "active"
        ).all()

    def get_semesters_by_course(self, db: Session, course_id: int) -> List[Semester]:
        return db.query(Semester).options(
            joinedload(Semester.subjects)
        ).filter(Semester.course_id == course_id).order_by(Semester.order).all()

    def get_subject_with_chapters(self, db: Session, subject_id: int) -> Optional[Subject]:
        return db.query(Subject).options(
            joinedload(Subject.chapters).joinedload(Chapter.lessons).joinedload(Lesson.resources)
        ).filter(Subject.id == subject_id).first()

    def get_lesson(self, db: Session, lesson_id: int) -> Optional[Lesson]:
        return db.query(Lesson).options(
            joinedload(Lesson.prompts),
            joinedload(Lesson.resources)
        ).filter(Lesson.id == lesson_id).first()

    def get_pyqs_by_subject(self, db: Session, subject_id: int) -> List[PYQ]:
        return db.query(PYQ).filter(PYQ.subject_id == subject_id).order_by(PYQ.year.desc()).all()

    def global_search(self, db: Session, query: str, limit: int = 20) -> List[dict]:
        search_query = f"%{query}%"
        results = []
        
        # Search Courses
        courses = db.query(Course).filter(Course.title.like(search_query) | Course.description.like(search_query)).limit(5).all()
        for c in courses:
            results.append({"type": "course", "id": c.id, "title": c.title, "description": c.description})

        # Search Subjects
        subjects = db.query(Subject).filter(Subject.title.like(search_query) | Subject.description.like(search_query)).limit(5).all()
        for s in subjects:
            results.append({"type": "subject", "id": s.id, "title": s.title, "description": s.description})

        # Search Lessons
        lessons = db.query(Lesson).filter(Lesson.title.like(search_query) | Lesson.description.like(search_query)).limit(10).all()
        for l in lessons:
            results.append({"type": "lesson", "id": l.id, "title": l.title, "description": l.description})

        return results[:limit]

course_repo = CourseRepository(Course)
