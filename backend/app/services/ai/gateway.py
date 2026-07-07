"""
AI Gateway — Provider Chain with automatic fallback
Chain: Groq (Primary) → OpenAI (Secondary) → Gemini (Tertiary) → Offline (Last Resort)
Supports dynamic runtime key toggles and fallback triggers.
"""
from app.core.config import settings
from app.services.ai.providers import (
    GroqProvider, OpenAIProvider, GeminiProvider,
    OfflineFAQProvider, AIProviderChain
)
from app.services.ai.agents.tutor import TutorAgent
from app.services.ai.agents.coach import CoachAgent
from app.services.ai.agents.examiner import ExaminerAgent


class AIGateway:
    def __init__(self):
        providers_list = []
        names_list = []

        # 1. Groq — Primary (Fastest, LLaMA 3.3 70B)
        if settings.GROQ_API_KEY:
            providers_list.append(GroqProvider(settings.GROQ_API_KEY))
            names_list.append("Groq (LLaMA-3.3)")

        # 2. OpenAI — Secondary (Highly reliable, GPT-4o-mini)
        if settings.OPENAI_API_KEY:
            providers_list.append(OpenAIProvider(settings.OPENAI_API_KEY))
            names_list.append("OpenAI (GPT-4o-mini)")

        # 3. Gemini — Tertiary (Backup Cloud, Gemini 1.5 Flash)
        if settings.GEMINI_API_KEY:
            providers_list.append(GeminiProvider(settings.GEMINI_API_KEY))
            names_list.append("Gemini (1.5-Flash)")

        # 4. Offline FAQ Provider — Always Last Resort
        offline = OfflineFAQProvider()
        providers_list.append(offline)
        names_list.append("Offline KB")

        # Compile the AI Provider Chain
        self.provider = AIProviderChain(providers_list, names_list)
        self.provider_name = " → ".join(names_list)

        # Instantiate Agents with the chain provider
        self.tutor = TutorAgent(self.provider)
        self.coach = CoachAgent(self.provider)
        self.examiner = ExaminerAgent(self.provider)

        print(f"[AIGateway] Initialized with 4-step chain: {self.provider_name}")


ai_gateway = AIGateway()
