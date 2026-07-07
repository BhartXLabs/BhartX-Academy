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

    async def generate_coach_message(self, student_name: str, streak: int, xp: int, revisions_due: int) -> dict:
        prompt = (
            f"Generate a personalized motivational check-in for {student_name}. "
            f"Stats: {streak}-day streak, {xp} XP, {revisions_due} spaced revisions due today. "
            "Be concise, warm, and actionable. Mention one specific study technique."
        )
        try:
            raw_response = await self.provider.generate_text(self.system_prompt, prompt)
            # Try JSON parse first (offline provider)
            try:
                parsed = json.loads(raw_response)
                if isinstance(parsed, dict) and "explanation" in parsed:
                    msg = (
                        f"Hi {student_name}! You have a {streak}-day streak and {xp} XP. "
                        f"{revisions_due} spaced revision(s) are due today. "
                        "Use the Feynman Technique: explain what you've learned as if teaching someone else — "
                        "gaps in your explanation reveal gaps in your understanding!"
                    )
                    return {"role": "coach", "answer": msg, "explanation": msg}
            except Exception:
                pass
        except Exception as e:
            raw_response = f"Keep going, {student_name}! Every study session compounds."

        return {"role": "coach", "answer": raw_response, "explanation": raw_response}
