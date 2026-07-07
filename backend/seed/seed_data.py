import datetime
import sys
import os

# Adjust path to import backend app components
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import engine, SessionLocal
from app.models import all_models
from app.core.security import get_password_hash

def seed_database():
    print("Seeding database data...")
    db = SessionLocal()
    try:
        # Check if database is already seeded to prevent duplicate record insertion or foreign key constraint crashes
        course_exists = db.query(all_models.Course).filter(all_models.Course.code == "a-level").first()
        if course_exists:
            print("Database already contains curriculum data. Skipping seeding.")
            return

        # 1. Create Default Users (Admin & Student)
        admin = all_models.User(
            name="Admin User",
            email="admin@bhartx.com",
            hashed_password=get_password_hash("adminpassword"),
            role="admin",
            xp=1000,
            streak=10
        )
        student = all_models.User(
            name="Shubh Student",
            email="student@bhartx.com",
            hashed_password=get_password_hash("studentpassword"),
            role="student",
            xp=250,
            streak=3,
            onboarded=True,
            onboarding_profile={
                "who_are_you": "Graduate student",
                "why_learning": "To get a Government diploma",
                "exam_date": "July 2026",
                "daily_time": "2 hours",
                "weak_subjects": ["Python Programming"],
                "strong_subjects": ["IT Tools & Networking"],
                "knowledge_level": "intermediate"
            }
        )
        db.add_all([admin, student])
        db.commit()
        db.refresh(student)

        # 2. Create Course & Batch
        course = all_models.Course(
            title="NIELIT A-Level Complete Preparation Program",
            description="Government-recognized Advanced Diploma level IT program covering Web Design, Python Programming, IoT, Data Structures, and Systems.",
            code="a-level",
            banner_url="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&auto=format&fit=crop",
            status="published",
            order=1
        )
        db.add(course)
        db.commit()
        db.refresh(course)

        batch = all_models.Batch(
            course_id=course.id,
            title="July 2026 Batch",
            description="Regular class cohort for July 2026 examinations cycle.",
            is_active=True,
            start_date=datetime.datetime.utcnow(),
            end_date=datetime.datetime.utcnow() + datetime.timedelta(days=365)
        )
        db.add(batch)
        db.commit()
        db.refresh(batch)

        # Enroll student in the July 2026 Batch
        enrollment = all_models.Enrollment(
            user_id=student.id,
            batch_id=batch.id,
            status="active"
        )
        db.add(enrollment)
        db.commit()

        # 3. Create Semesters
        semesters = [
            all_models.Semester(course_id=course.id, title="Semester 1", description="Foundations of IT and Programming", order=1),
            all_models.Semester(course_id=course.id, title="Semester 2", description="Systems Architecture and Data Structure", order=2),
            all_models.Semester(course_id=course.id, title="Semester 3", description="Database, Software Design and Project", order=3)
        ]
        db.add_all(semesters)
        db.commit()
        for sem in semesters:
            db.refresh(sem)

        # 4. Create Subjects (Modules 1 to 10)
        subjects = [
            # Semester 1 Subjects
            all_models.Subject(semester_id=semesters[0].id, title="IT Tools & Networking", code="A1-R5", order=1),
            all_models.Subject(semester_id=semesters[0].id, title="Web Designing", code="A2-R5", order=2),
            all_models.Subject(semester_id=semesters[0].id, title="Python Programming", code="A3-R5", order=3),
            # Semester 2 Subjects
            all_models.Subject(semester_id=semesters[1].id, title="Internet of Things", code="A4-R5", order=4),
            all_models.Subject(semester_id=semesters[1].id, title="Data Structure through Python", code="A5-R5", order=5),
            all_models.Subject(semester_id=semesters[1].id, title="Computer Organization", code="A6-R5", order=6),
            all_models.Subject(semester_id=semesters[1].id, title="Operating System", code="A7-R5", order=7),
            # Semester 3 Subjects
            all_models.Subject(semester_id=semesters[2].id, title="Database Technologies", code="A8-R5", order=8),
            all_models.Subject(semester_id=semesters[2].id, title="Software Engineering", code="A9-R5", order=9),
            all_models.Subject(semester_id=semesters[2].id, title="Project Guidance", code="A10-R5", order=10)
        ]
        db.add_all(subjects)
        db.commit()
        for sub in subjects:
            db.refresh(sub)

        # 5. Populate Chapters & Lessons for Module 3 (Python Programming)
        python_sub = subjects[2]  # Python Programming (A3-R5)

        # Chapter 1: Introduction to Python
        ch1 = all_models.Chapter(subject_id=python_sub.id, title="Introduction to Python Basics", description="Syntax variables and types", order=1)
        db.add(ch1)
        db.commit()
        db.refresh(ch1)

        l1 = all_models.Lesson(
            chapter_id=ch1.id,
            title="Introduction to Python Variables",
            description="In this lesson, we will explore Python programming basics. We will declare variables, look at memory spaces, and print values in the output console.",
            video_provider="youtube",
            video_id="Y8Tko2YC5hA",
            duration_seconds=300,
            prerequisites="None",
            outcomes="Write basic python output files, manipulate numeric types",
            order=1
        )
        db.add(l1)
        db.commit()
        db.refresh(l1)

        # Chapter 2: Python Lists & Manipulation
        ch2 = all_models.Chapter(subject_id=python_sub.id, title="Python Lists & Manipulation", description="Arrays, indices, slices and operations", order=2)
        db.add(ch2)
        db.commit()
        db.refresh(ch2)

        l2 = all_models.Lesson(
            chapter_id=ch2.id,
            title="Understanding Python Lists",
            description="This lesson teaches Python lists. You will learn list indexing, appending elements, and creating basic collection routines.",
            video_provider="youtube",
            video_id="9OeznAkyQz4",
            duration_seconds=600,
            prerequisites="Variables, loops structure",
            outcomes="Use lists, index manipulation, dynamic updates",
            order=1
        )
        db.add(l2)
        db.commit()
        db.refresh(l2)

        # Add In-Video Checkpoint MCQ to Lesson 2
        prompt = all_models.VideoPrompt(
            lesson_id=l2.id,
            timestamp_seconds=120,  # Pauses at 2:00
            question_text="What will print for list[1] if list = ['apple', 'banana', 'cherry']?",
            options=["apple", "banana", "cherry", "Error"],
            correct_option_index=1
        )
        db.add(prompt)
        db.commit()

        # Add Resources to Lesson 2
        resource1 = all_models.Resource(
            lesson_id=l2.id,
            title="Python Lists Cheat Sheet PDF",
            resource_type="pdf",
            url="https://www.python.org/static/files/media-pdf/cheat-sheet.pdf",
            file_size=1024 * 150,  # 150 KB
            mime_type="application/pdf"
        )
        resource2 = all_models.Resource(
            lesson_id=l2.id,
            title="Python Lists Exercises ZIP",
            resource_type="zip",
            url="https://example.com/files/lists-exercises.zip",
            file_size=1024 * 250,
            mime_type="application/zip"
        )
        db.add_all([resource1, resource2])
        db.commit()

        # Chapter 2 Quiz (Mastery checkpoint >= 80% to proceed to Chapter 3!)
        quiz = all_models.Quiz(
            chapter_id=ch2.id,
            title="Python Lists Mastery Checkpoint",
            description="Pass this quiz with at least 80% score to unlock the next chapter's lessons."
        )
        db.add(quiz)
        db.commit()
        db.refresh(quiz)

        q1 = all_models.QuizQuestion(
            quiz_id=quiz.id,
            text="Which of the following functions adds an element to the end of a Python List?",
            options=["add()", "append()", "push()", "insert()"],
            correct_option_index=1
        )
        q2 = all_models.QuizQuestion(
            quiz_id=quiz.id,
            text="How do you access the last element of a Python List dynamically?",
            options=["list[len(list)]", "list[-1]", "list[last]", "list.last()"],
            correct_option_index=1
        )
        q3 = all_models.QuizQuestion(
            quiz_id=quiz.id,
            text="Is a Python List mutable or immutable?",
            options=["Mutable", "Immutable", "Depends on elements", "None of these"],
            correct_option_index=0
        )
        q4 = all_models.QuizQuestion(
            quiz_id=quiz.id,
            text="What is the output of: print([1, 2] * 2)?",
            options=["[1, 2, 1, 2]", "[2, 4]", "[1, 2], [1, 2]", "Error"],
            correct_option_index=0
        )
        q5 = all_models.QuizQuestion(
            quiz_id=quiz.id,
            text="How do you remove an item from a list by index?",
            options=["list.remove(index)", "del list[index]", "list.delete(index)", "list.pop_at(index)"],
            correct_option_index=1
        )
        db.add_all([q1, q2, q3, q4, q5])
        db.commit()

        # Chapter 3: Loops and Iterations (Locked initially until Ch2 Quiz complete!)
        ch3 = all_models.Chapter(subject_id=python_sub.id, title="Loops and Iterations", description="For while loops syntax", order=3)
        db.add(ch3)
        db.commit()
        db.refresh(ch3)

        l3 = all_models.Lesson(
            chapter_id=ch3.id,
            title="For and While Loops in Python",
            description="This lesson covers iterations using loops in python.",
            video_provider="youtube",
            video_id="6iF8Xb7Z3kQ",
            duration_seconds=400,
            prerequisites="Understanding variables, Lists index",
            outcomes="Iterate arrays, manage loop exits",
            order=1
        )
        db.add(l3)
        db.commit()

        # 6. Seed a Mock Test (Negative Marking simulation)
        mock = all_models.MockTest(
            subject_id=python_sub.id,
            title="A-Level Python Programming Comprehensive Mock 01",
            difficulty="medium",
            duration_minutes=60,
            total_questions=3,
            negative_marks_per_question=0.25
        )
        db.add(mock)
        db.commit()
        db.refresh(mock)

        mq1 = all_models.MockQuestion(
            mock_test_id=mock.id,
            text="Which keyword is used to create a function in Python?",
            options=["function", "fun", "def", "define"],
            correct_option_index=2,
            explanation="The def keyword defines a function block."
        )
        mq2 = all_models.MockQuestion(
            mock_test_id=mock.id,
            text="What is the output of print(type([]) == list)?",
            options=["True", "False", "Error", "None"],
            correct_option_index=0,
            explanation="Evaluating type([]) yields list, making it equivalent to list == list (True)."
        )
        mq3 = all_models.MockQuestion(
            mock_test_id=mock.id,
            text="Which of these handles exception safety blocks in Python?",
            options=["try-catch", "try-except", "throw-catch", "rescue"],
            correct_option_index=1,
            explanation="Python utilizes the try-except syntax to handle error checks."
        )
        db.add_all([mq1, mq2, mq3])
        db.commit()

        # 7. Seed Past Year Papers (PYQ 2024, 2025)
        pyq1 = all_models.PYQ(
            subject_id=python_sub.id,
            year=2024,
            title="NIELIT A-Level A3-R5 January 2024 Exam Paper",
            pdf_url="https://example.com/papers/a3-r5-2024-jan.pdf",
            video_solution_url="https://youtube.com/watch?v=mock_video_solution"
        )
        pyq2 = all_models.PYQ(
            subject_id=python_sub.id,
            year=2025,
            title="NIELIT A-Level A3-R5 January 2025 Exam Paper",
            pdf_url="https://example.com/papers/a3-r5-2025-jan.pdf",
            video_solution_url="https://youtube.com/watch?v=mock_video_solution2"
        )
        db.add_all([pyq1, pyq2])
        db.commit()

        # 8. Seed default notification alerts for the student
        notif1 = all_models.Notification(
            user_id=student.id,
            title="Welcome to BhartX Academy!",
            message="Your learning workspace for the July 2026 Batch of NIELIT A-Level is active. Begin with Semester 1 courses.",
            type="announcement",
            is_read=False
        )
        notif2 = all_models.Notification(
            user_id=student.id,
            title="Spaced Repetition Checklist Active",
            message="Your dashboard now manages the forgetting curve. Revisions appear automatically here.",
            type="reminder",
            is_read=False
        )
        db.add_all([notif1, notif2])
        db.commit()

        print("Database seeded successfully with curriculum data!")
    except Exception as e:
        print(f"Error seeding database: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
