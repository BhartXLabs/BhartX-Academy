"""
TutorAgent — Socratic AI Tutor with multi-turn conversation memory support.
Uses backend-managed conversation history (GPT recommendation: never trust frontend history).
"""
from app.services.ai.providers import BaseAIProvider, AIProviderChain
from typing import List, Optional
import json


class TutorAgent:
    def __init__(self, provider):
        self.provider = provider
        self.system_prompt = (
            "You are the BhartX Socratic Tutor, a Senior Instructor in Computer Science specializing in "
            "NIELIT A-Level curriculum (Python, Data Structures, DBMS, Networking, OS, IoT). "
            "NEVER give a direct answer immediately. Guide the student step by step using: "
            "1) A real-world analogy to build intuition. "
            "2) A worked example with a similar (different) problem. "
            "3) A 'Try Yourself' exercise to reinforce understanding. "
            "Use Markdown formatting with clear sections. Be encouraging, precise, and Socratic. "
            "If you remember previous messages in this conversation, maintain context and build on it."
        )

    async def answer_doubt(self, question: str, history: Optional[List[dict]] = None) -> dict:
        """
        Generate a Socratic response with optional multi-turn history.
        history: List of {"role": "user"|"assistant", "content": str}
        """
        raw_response = "I'm having trouble connecting right now. Please try again."
        try:
            raw_response = await self.provider.generate_text(
                self.system_prompt, question, history=history
            )
            # Try JSON parse first (offline provider returns JSON)
            try:
                parsed = json.loads(raw_response)
                if isinstance(parsed, dict) and "explanation" in parsed:
                    return parsed
            except Exception:
                pass
        except Exception as e:
            raw_response = f"Connection error: {str(e)}"

        # Standard LLM text response — wrap in structured format
        return {
            "role": "tutor",
            "answer": raw_response,
            "explanation": raw_response,
            "analogy": None,
            "example": None,
            "try_yourself": None,
            "practice_question": None
        }


Definition = TutorAgent
