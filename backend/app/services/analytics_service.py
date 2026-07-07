"""
AnalyticsService — Real student cognitive metrics computed from DB.
Structured in 3 sections per GPT review:
  - learning: completion + accuracy metrics
  - memory: spaced revision + mistake resolution
  - recommendations: prioritized action items
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from typing import Optional
import datetime


class AnalyticsService:
    def get_student_analytics(self, db: Session, user_id: int) -> dict:
        """Compute full student analytics. Returns 3-section structured response."""
        learning = self._compute_learning_metrics(db, user_id)
        memory = self._compute_memory_metrics(db, user_id)
        recommendations = self._compute_recommendations(db, user_id, learning, memory)

        return {
            "learning": learning,
            "memory": memory,
            "recommendations": recommendations,
            "computed_at": datetime.datetime.utcnow().isoformat()
        }

    def _compute_learning_metrics(self, db: Session, user_id: int) -> dict:
        """Lesson completion, quiz accuracy, reflection quality."""
        try:
            # Total lessons + completed lessons
            total_lessons = db.execute(text("SELECT COUNT(*) FROM lessons")).scalar() or 1
            completed_lessons = db.execute(
                text("SELECT COUNT(*) FROM lesson_progress WHERE user_id = :uid AND status = 'completed'"),
                {"uid": user_id}
            ).scalar() or 0

            completion_pct = round((completed_lessons / max(total_lessons, 1)) * 100, 1)

            # Average quiz accuracy
            avg_quiz_score = db.execute(
                text("SELECT AVG(score) FROM quiz_attempts WHERE user_id = :uid"),
                {"uid": user_id}
            ).scalar()
            quiz_accuracy = round(float(avg_quiz_score or 0), 1)

            # Average watch percentage across all lessons
            avg_watch = db.execute(
                text("SELECT AVG(watch_percentage) FROM lesson_progress WHERE user_id = :uid"),
                {"uid": user_id}
            ).scalar()
            avg_watch_pct = round(float(avg_watch or 0), 1)

            # Average confidence from reflections
            avg_confidence = db.execute(
                text("SELECT AVG(confidence_rating) FROM lesson_reflections WHERE user_id = :uid"),
                {"uid": user_id}
            ).scalar()
            confidence_score = round(float(avg_confidence or 0), 1)

            # Total quiz attempts
            total_attempts = db.execute(
                text("SELECT COUNT(*) FROM quiz_attempts WHERE user_id = :uid"),
                {"uid": user_id}
            ).scalar() or 0

            # Get completion rates per subject dynamically (Upgrade-3 extension)
            subject_progress = {}
            try:
                subject_lessons = db.execute(text("""
                    SELECT s.id, COUNT(l.id) 
                    FROM subjects s
                    JOIN chapters c ON c.subject_id = s.id
                    JOIN lessons l ON l.chapter_id = c.id
                    GROUP BY s.id
                """)).fetchall()
                
                user_completed = db.execute(text("""
                    SELECT s.id, COUNT(lp.id)
                    FROM subjects s
                    JOIN chapters c ON c.subject_id = s.id
                    JOIN lessons l ON l.chapter_id = c.id
                    JOIN lesson_progress lp ON lp.lesson_id = l.id
                    WHERE lp.user_id = :uid AND lp.status = 'completed'
                    GROUP BY s.id
                """), {"uid": user_id}).fetchall()
                
                total_map = {row[0]: row[1] for row in subject_lessons}
                comp_map = {row[0]: row[1] for row in user_completed}
                
                for s_id, tot in total_map.items():
                    completed = comp_map.get(s_id, 0)
                    subject_progress[str(s_id)] = round((completed / max(tot, 1)) * 100, 1)
            except Exception as se:
                print(f"[Analytics] Subject progress error: {se}")

            return {
                "lessons_completed": completed_lessons,
                "lessons_total": total_lessons,
                "completion_percentage": completion_pct,
                "quiz_accuracy": quiz_accuracy,
                "avg_watch_percentage": avg_watch_pct,
                "avg_confidence_rating": confidence_score,
                "total_quiz_attempts": total_attempts,
                "concept_understanding": min(100, round((quiz_accuracy * 0.6) + (completion_pct * 0.4), 1)),
                "subject_progress": subject_progress
            }
        except Exception as e:
            print(f"[Analytics] Learning metrics error: {e}")
            return {"completion_percentage": 0, "quiz_accuracy": 0, "lessons_completed": 0, "lessons_total": 0, "subject_progress": {}}

    def _compute_memory_metrics(self, db: Session, user_id: int) -> dict:
        """Spaced revision compliance, mistake resolution rate."""
        try:
            # Spaced revision stats
            total_revisions = db.execute(
                text("SELECT COUNT(*) FROM spaced_revisions WHERE user_id = :uid"),
                {"uid": user_id}
            ).scalar() or 0
            completed_revisions = db.execute(
                text("SELECT COUNT(*) FROM spaced_revisions WHERE user_id = :uid AND completed = 1"),
                {"uid": user_id}
            ).scalar() or 0
            revision_compliance = round(
                (completed_revisions / max(total_revisions, 1)) * 100, 1
            )

            # Mistake resolution stats
            total_mistakes = db.execute(
                text("SELECT COUNT(*) FROM mistake_journals WHERE user_id = :uid"),
                {"uid": user_id}
            ).scalar() or 0
            resolved_mistakes = db.execute(
                text("SELECT COUNT(*) FROM mistake_journals WHERE user_id = :uid AND resolved = 1"),
                {"uid": user_id}
            ).scalar() or 0
            resolution_rate = round(
                (resolved_mistakes / max(total_mistakes, 1)) * 100, 1
            )

            # Due today
            revisions_due_today = db.execute(
                text("""
                    SELECT COUNT(*) FROM spaced_revisions
                    WHERE user_id = :uid AND completed = 0
                    AND next_review_date <= :now
                """),
                {"uid": user_id, "now": datetime.datetime.utcnow()}
            ).scalar() or 0

            return {
                "total_revisions_scheduled": total_revisions,
                "revisions_completed": completed_revisions,
                "revision_compliance_rate": revision_compliance,
                "total_mistakes_logged": total_mistakes,
                "mistakes_resolved": resolved_mistakes,
                "unresolved_mistakes": total_mistakes - resolved_mistakes,
                "mistake_resolution_rate": resolution_rate,
                "revisions_due_today": revisions_due_today,
                "long_term_retention_score": round((revision_compliance * 0.6) + (resolution_rate * 0.4), 1),
            }
        except Exception as e:
            print(f"[Analytics] Memory metrics error: {e}")
            return {"revision_compliance_rate": 0, "mistake_resolution_rate": 0, "revisions_due_today": 0}

    def _compute_recommendations(self, db: Session, user_id: int, learning: dict, memory: dict) -> list:
        """Priority-sorted action recommendations based on real metrics."""
        recs = []

        # Critical: Unresolved mistakes
        unresolved = memory.get("unresolved_mistakes", 0)
        if unresolved > 0:
            recs.append({
                "priority": 1,
                "type": "mistake_journal",
                "title": f"Fix {unresolved} Mistake(s) in Journal",
                "description": "Unresolved mistakes create knowledge gaps that compound over time.",
                "action": "Open Mistake Journal",
                "link": "/journal",
                "urgency": "high"
            })

        # Critical: Overdue revisions
        due_today = memory.get("revisions_due_today", 0)
        if due_today > 0:
            recs.append({
                "priority": 2,
                "type": "spaced_revision",
                "title": f"{due_today} Spaced Revision(s) Due Today",
                "description": "Missing scheduled revisions breaks the SM-2 memory curve.",
                "action": "Start Revisions",
                "link": "/dashboard",
                "urgency": "high"
            })

        # Medium: Low quiz accuracy
        quiz_acc = learning.get("quiz_accuracy", 0)
        if quiz_acc < 60 and quiz_acc > 0:
            recs.append({
                "priority": 3,
                "type": "quiz_practice",
                "title": f"Improve Quiz Accuracy (Currently {quiz_acc}%)",
                "description": "Below 60% accuracy indicates concept gaps. Re-study and re-attempt quizzes.",
                "action": "Practice Quizzes",
                "link": "/courses",
                "urgency": "medium"
            })

        # Low: Continue progress
        completion = learning.get("completion_percentage", 0)
        if completion < 100:
            recs.append({
                "priority": 4,
                "type": "continue_learning",
                "title": f"Continue Syllabus ({completion}% Complete)",
                "description": "Stay consistent — compound learning compounds results.",
                "action": "Open Courses",
                "link": "/courses",
                "urgency": "low"
            })

        return sorted(recs, key=lambda x: x["priority"])


analytics_service = AnalyticsService()
