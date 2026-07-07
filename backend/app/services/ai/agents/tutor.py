from app.services.ai.providers import BaseAIProvider
import json

class TutorAgent:
    def __init__(self, provider: BaseAIProvider):
        self.provider = provider
        self.system_prompt = (
            "You are the BhartX Socratic Tutor Agent, a Senior Instructor in Computer Science. "
            "Your objective is to guide students to understand complex programming, networking, and "
            "database concepts. NEVER provide the direct solution or code block immediately when asked "
            "how to solve a problem. Instead, explain the base concept using a real-world analogy, "
            "provide a worked example of a similar (but different) problem, and then ask a guiding question "
            "or present a 'Try Yourself' exercise to help them resolve it. "
            "Always respond in clean Markdown with distinct headers: "
            "### 💡 Concept Explanation, ### 🔄 Analogy, ### 💻 Worked Example, ### 🛠️ Try Yourself."
        )

    def answer_doubt(self, question: str) -> dict:
        raw_response = "Error contacting AI provider."
        try:
            raw_response = self.provider.generate_text(self.system_prompt, question)
            # Try to parse as JSON first (if offline provider)
            parsed = json.loads(raw_response)
            if isinstance(parsed, dict) and "explanation" in parsed:
                return parsed
        except Exception:
            pass

        # If not JSON (standard LLM output), wrap the single cached response directly
        return {
            "role": "tutor",
            "answer": raw_response,
            "explanation": raw_response,
            "analogy": "Analogy is embedded in the response.",
            "example": "Review worked example inside response.",
            "try_yourself": "Attempt to solve code from the description.",
            "practice_question": "Think about memory footprints of these components."
        }
Definition = TutorAgent
