"""
AI Gateway — Provider Chain with automatic fallback
Chain: Groq (fastest) → Gemini (reliable) → Offline (always available)
"""
from app.core.config import settings
from app.services.ai.providers import (
    GroqProvider, GeminiProvider, OpenAIProvider,
    OfflineFAQProvider, AIProviderChain
)
from app.services.ai.agents.tutor import TutorAgent
from app.services.ai.agents.coach import CoachAgent
from app.services.ai.agents.examiner import ExaminerAgent


class AIGateway:
    def __init__(self):
        offline = OfflineFAQProvider()

        # Build primary + secondary based on available keys
        if settings.GROQ_API_KEY and settings.GEMINI_API_KEY:
            primary = GroqProvider(settings.GROQ_API_KEY)
            secondary = GeminiProvider(settings.GEMINI_API_KEY)
            self.provider_name = "groq→gemini→offline"
        elif settings.GROQ_API_KEY:
            primary = GroqProvider(settings.GROQ_API_KEY)
            secondary = offline
            self.provider_name = "groq→offline"
        elif settings.GEMINI_API_KEY:
            primary = GeminiProvider(settings.GEMINI_API_KEY)
            secondary = offline
            self.provider_name = "gemini→offline"
        elif settings.OPENAI_API_KEY:
            primary = OpenAIProvider(settings.OPENAI_API_KEY)
            secondary = offline
            self.provider_name = "openai→offline"
        else:
            primary = offline
            secondary = offline
            self.provider_name = "offline"

        # Chain: Primary → Secondary → Offline (always last)
        self.provider = AIProviderChain(primary, secondary, offline)

        # Instantiate Agents with the chain provider
        self.tutor = TutorAgent(self.provider)
        self.coach = CoachAgent(self.provider)
        self.examiner = ExaminerAgent(self.provider)

        print(f"[AIGateway] Initialized with chain: {self.provider_name}")


ai_gateway = AIGateway()
