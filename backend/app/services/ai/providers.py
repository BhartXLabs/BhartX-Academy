"""
AI Providers — Async HTTP with Retry + Fallback Chain
Architecture:
  Primary: Groq (fastest — LLaMA 3.3 70B)
  Fallback: Gemini (reliable)
  Last Resort: OfflineFAQProvider (always available)

All providers are async-native using httpx.
Timeout: 20s, Retry: 2 attempts per provider before falling back.
"""
import httpx
import json
import asyncio
from typing import Optional, Dict, Any, List

TIMEOUT = httpx.Timeout(20.0, connect=5.0)
MAX_RETRIES = 2


class BaseAIProvider:
    async def generate_text(self, system_prompt: str, user_prompt: str, history: Optional[List[dict]] = None) -> str:
        raise NotImplementedError

    def _build_messages(self, system_prompt: str, user_prompt: str, history: Optional[List[dict]] = None) -> List[dict]:
        """Build OpenAI-compatible messages list with optional conversation history."""
        messages = [{"role": "system", "content": system_prompt}]
        if history:
            # Include last 6 messages max (3 turns) for token efficiency
            messages.extend(history[-6:])
        messages.append({"role": "user", "content": user_prompt})
        return messages


class GroqProvider(BaseAIProvider):
    """Primary provider — fastest, cheapest. LLaMA 3.3 70B via Groq."""
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.url = "https://api.groq.com/openai/v1/chat/completions"
        self.model = "llama-3.3-70b-versatile"

    async def generate_text(self, system_prompt: str, user_prompt: str, history: Optional[List[dict]] = None) -> str:
        messages = self._build_messages(system_prompt, user_prompt, history)
        payload = {"model": self.model, "messages": messages, "max_tokens": 1024}
        headers = {"Content-Type": "application/json", "Authorization": f"Bearer {self.api_key}"}

        for attempt in range(MAX_RETRIES):
            try:
                async with httpx.AsyncClient(timeout=TIMEOUT) as client:
                    response = await client.post(self.url, json=payload, headers=headers)
                    response.raise_for_status()
                    return response.json()["choices"][0]["message"]["content"]
            except (httpx.TimeoutException, httpx.HTTPStatusError) as e:
                if attempt == MAX_RETRIES - 1:
                    raise
                await asyncio.sleep(1.0 * (attempt + 1))  # Exponential backoff
        return "Error: Max retries exceeded"


class GeminiProvider(BaseAIProvider):
    """Fallback provider — Gemini 1.5 Flash."""
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"

    async def generate_text(self, system_prompt: str, user_prompt: str, history: Optional[List[dict]] = None) -> str:
        # Gemini uses a flat text format — concatenate history manually
        context = ""
        if history:
            for msg in history[-6:]:
                role = "Student" if msg["role"] == "user" else "Tutor"
                context += f"{role}: {msg['content']}\n"

        full_prompt = f"{system_prompt}\n\n{context}Student: {user_prompt}"
        payload = {"contents": [{"parts": [{"text": full_prompt}]}]}

        for attempt in range(MAX_RETRIES):
            try:
                async with httpx.AsyncClient(timeout=TIMEOUT) as client:
                    response = await client.post(self.url, json=payload)
                    response.raise_for_status()
                    return response.json()["candidates"][0]["content"]["parts"][0]["text"]
            except (httpx.TimeoutException, httpx.HTTPStatusError) as e:
                if attempt == MAX_RETRIES - 1:
                    raise
                await asyncio.sleep(1.0 * (attempt + 1))
        return "Error: Max retries exceeded"


class OpenAIProvider(BaseAIProvider):
    """Optional provider — GPT-4o mini."""
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.url = "https://api.openai.com/v1/chat/completions"
        self.model = "gpt-4o-mini"

    async def generate_text(self, system_prompt: str, user_prompt: str, history: Optional[List[dict]] = None) -> str:
        messages = self._build_messages(system_prompt, user_prompt, history)
        payload = {"model": self.model, "messages": messages, "max_tokens": 1024}
        headers = {"Content-Type": "application/json", "Authorization": f"Bearer {self.api_key}"}

        for attempt in range(MAX_RETRIES):
            try:
                async with httpx.AsyncClient(timeout=TIMEOUT) as client:
                    response = await client.post(self.url, json=payload, headers=headers)
                    response.raise_for_status()
                    return response.json()["choices"][0]["message"]["content"]
            except (httpx.TimeoutException, httpx.HTTPStatusError) as e:
                if attempt == MAX_RETRIES - 1:
                    raise
                await asyncio.sleep(1.0 * (attempt + 1))
        return "Error: Max retries exceeded"


class OfflineFAQProvider(BaseAIProvider):
    """Last-resort offline fallback — always available, zero latency."""
    def __init__(self):
        self.kb: Dict[str, Dict[str, str]] = {
            "list": {
                "explanation": "A Python List is an ordered, mutable collection. Think of it as a storage shelf with numbered slots.",
                "analogy": "Imagine a shopping list on paper — you can read, update, or add items at any position.",
                "example": "```python\nshopping = ['books', 'pens']\nshopping.append('notebook')\nprint(shopping)  # ['books', 'pens', 'notebook']\n```",
                "try_yourself": "Create a list of 5 colors. Swap the 2nd and 4th color, then print it.",
                "practice_question": "What is the memory difference between a List and a Tuple in Python?"
            },
            "loop": {
                "explanation": "Loops repeat a block of code while a condition holds (while) or over a sequence (for).",
                "analogy": "A clock's second hand completes a full loop 60 times before the minute hand moves once.",
                "example": "```python\nfor i in range(1, 4):\n    print(f'Step: {i}')\n```",
                "try_yourself": "Write a while loop that counts down from 10 to 1 then prints 'Go!'",
                "practice_question": "When would you use a for loop vs a while loop? Give one example of each."
            },
            "function": {
                "explanation": "A function is a reusable block of code that runs only when called. It accepts parameters and can return values.",
                "analogy": "A microwave: you put food in (input), press start, and get hot food (output) — without rebuilding it each time.",
                "example": "```python\ndef greet(name):\n    return f'Welcome, {name}!'\n\nprint(greet('Shubh'))\n```",
                "try_yourself": "Write a function `rectangle_area(width, height)` that returns the area.",
                "practice_question": "Explain local vs global scope of variables in Python functions."
            },
            "database": {
                "explanation": "A Database stores structured data electronically. Relational databases link data across tables via keys.",
                "analogy": "Multiple spreadsheet sheets — Students, Courses, Enrollments — linked by IDs.",
                "example": "```sql\nSELECT u.name, c.title\nFROM enrollments e\nJOIN users u ON e.user_id = u.id\nJOIN courses c ON e.course_id = c.id;\n```",
                "try_yourself": "Write SQL to fetch all students enrolled after Jan 2026.",
                "practice_question": "Define the 4 ACID properties and why Atomicity matters in transactions."
            },
            "operating system": {
                "explanation": "An OS manages hardware resources — CPU, memory, I/O — and provides services to application programs.",
                "analogy": "A traffic cop at a busy junction: manages intersections (CPU time) and lanes (RAM) so cars (apps) don't crash.",
                "example": "```text\nProcess Queue → Scheduler (Round Robin) → CPU Core\n```",
                "try_yourself": "Compare Paging vs Segmentation in memory management in a 2-column table.",
                "practice_question": "What is a deadlock? Name the 4 Coffman conditions required for it to occur."
            }
        }
        self.default = {
            "explanation": "This is a key NIELIT A-Level concept. Let's break it down step by step.",
            "analogy": "Think of this concept as a building block in a larger system.",
            "example": "```python\n# Conceptual model\ndef process(data):\n    return data\n```",
            "try_yourself": "Write a short paragraph explaining this concept in your own words.",
            "practice_question": "How does this topic relate to other computer science concepts you've studied?"
        }

    async def generate_text(self, system_prompt: str, user_prompt: str, history: Optional[List[dict]] = None) -> str:
        q_lower = user_prompt.lower()
        matched = self.default
        for key in self.kb:
            if key in q_lower:
                matched = self.kb[key]
                break

        return json.dumps({
            "role": "tutor",
            "answer": matched["explanation"],
            "explanation": matched["explanation"],
            "analogy": f"**Analogy:** {matched['analogy']}",
            "example": matched["example"],
            "try_yourself": matched["try_yourself"],
            "practice_question": matched["practice_question"]
        })


class AIProviderChain:
    """
    Fallback chain: Primary → Secondary → Offline
    Tries each provider in order, falls back on any exception.
    """
    def __init__(self, primary: BaseAIProvider, secondary: BaseAIProvider, fallback: OfflineFAQProvider):
        self.chain = [primary, secondary, fallback]
        self.provider_names = ["Primary", "Secondary", "Offline"]

    async def generate_text(self, system_prompt: str, user_prompt: str, history: Optional[List[dict]] = None) -> str:
        for i, provider in enumerate(self.chain):
            try:
                result = await provider.generate_text(system_prompt, user_prompt, history)
                if result and not result.startswith("Error"):
                    return result
            except Exception as e:
                print(f"[AIProviderChain] {self.provider_names[i]} failed: {e}. Trying next.")
        return "I'm having trouble connecting to the AI right now. Please try again in a moment."
