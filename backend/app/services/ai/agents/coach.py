from app.services.ai.providers import BaseAIProvider
import json

class CoachAgent:
    def __init__(self, provider: BaseAIProvider):
        self.provider = provider
        self.system_prompt = (
            "You are the BhartX Study Coach Agent, a specialist in cognitive science and "
            "habit formation. Your goal is to guide students on maintaining high study streaks, "
            "planning their learning roadmaps, and scheduling their spaced revision queues. "
            "Be encouraging, motivational, and provide actionable tips like the Feynman Technique or Pomodoro."
        )

    def generate_coach_message(self, student_name: str, streak: int, xp: int, revisions_due: int) -> dict:
        prompt = (
            f"Hello Coach, please generate a personalized motivational check-in message for {student_name}. "
            f"Current stats: {streak} day streak, {xp} XP, and {revisions_due} spaced revisions scheduled for today."
        )
        
        raw_response = "Error contacting AI provider."
        try:
            raw_response = self.provider.generate_text(self.system_prompt, prompt)
            parsed = json.loads(raw_response)
            if isinstance(parsed, dict) and "explanation" in parsed:
                # Offline provider override
                msg = (
                    f"Hi {student_name}! You have a {streak}-day learning streak and {xp} XP. "
                    f"You have {revisions_due} topics scheduled for review today. "
                    "Remember: Spaced repetition is the secret to moving concepts from short-term to long-term memory! "
                    "Let's spend 10 minutes checking off today's revisions."
                )
                return {
                    "role": "coach",
                    "answer": msg,
                    "explanation": msg
                }
        except Exception:
            pass

        return {
            "role": "coach",
            "answer": raw_response,
            "explanation": raw_response
        }
