from app.core.config import settings
from app.services.ai.providers import GeminiProvider, OpenAIProvider, OfflineFAQProvider
from app.services.ai.agents.tutor import TutorAgent
from app.services.ai.agents.coach import CoachAgent
from app.services.ai.agents.examiner import ExaminerAgent

class AIGateway:
    def __init__(self):
        # Select AI Provider based on API key availability
        if settings.GEMINI_API_KEY:
            self.provider = GeminiProvider(settings.GEMINI_API_KEY)
            self.provider_name = "gemini"
        elif settings.OPENAI_API_KEY:
            self.provider = OpenAIProvider(settings.OPENAI_API_KEY)
            self.provider_name = "openai"
        else:
            self.provider = OfflineFAQProvider()
            self.provider_name = "offline"

        # Instantiate Agents
        self.tutor = TutorAgent(self.provider)
        self.coach = CoachAgent(self.provider)
        self.examiner = ExaminerAgent(self.provider)

ai_gateway = AIGateway()
