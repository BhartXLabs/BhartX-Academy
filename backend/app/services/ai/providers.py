import os
import urllib.request
import json
from typing import Optional, Dict, Any

class BaseAIProvider:
    def generate_text(self, system_prompt: str, user_prompt: str) -> str:
        raise NotImplementedError

class GeminiProvider(BaseAIProvider):
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.api_key}"

    def generate_text(self, system_prompt: str, user_prompt: str) -> str:
        # Construct raw HTTP payload for Gemini API
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": f"{system_prompt}\n\nUser Question: {user_prompt}"}
                    ]
                }
            ]
        }
        try:
            req = urllib.request.Request(
                self.url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=10) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                return res_data["candidates"][0]["content"]["parts"][0]["text"]
        except Exception as e:
            return f"Error contacting Gemini API: {str(e)}"

class OpenAIProvider(BaseAIProvider):
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.url = "https://api.openai.com/v1/chat/completions"

    def generate_text(self, system_prompt: str, user_prompt: str) -> str:
        payload = {
            "model": "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]
        }
        try:
            req = urllib.request.Request(
                self.url,
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.api_key}"
                },
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=10) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                return res_data["choices"][0]["message"]["content"]
        except Exception as e:
            return f"Error contacting OpenAI API: {str(e)}"

class OfflineFAQProvider(BaseAIProvider):
    def __init__(self):
        # Seeded curriculum topics matching for Socratic answers
        self.kb: Dict[str, Dict[str, str]] = {
            "list": {
                "explanation": "A Python List is an ordered, mutable collection of items. Think of it as a storage shelf where you can place multiple data items inside a single variable.",
                "analogy": "Imagine a shopping list printed on a strip of paper. You can read items from first to last, change an item (cross it out and write eggs instead of milk), or append new items at the end.",
                "example": "```python\n# Creating and modifying a list\nshopping = ['books', 'pens']\nshopping.append('notebook')\nshopping[0] = 'textbook'\nprint(shopping)  # Outputs: ['textbook', 'pens', 'notebook']\n```",
                "try_yourself": "Create a list containing five different colors. Write a line of code to swap the second and fourth color, then print the list.",
                "practice_question": "Explain the difference in memory utilization and speed when accessing a Python List vs a Python Tuple."
            },
            "loop": {
                "explanation": "Loops are control flow structures that repeat a block of statements as long as a condition is satisfied (while loop) or iterate over items of a sequence (for loop).",
                "analogy": "Imagine a clock mechanism. The second hand completes a full loop 60 times before the minute hand increments by one.",
                "example": "```python\n# Iterating with a loop\nfor i in range(1, 4):\n    print(f'Iteration: {i}')\n```",
                "try_yourself": "Write a `while` loop that prints integers starting from 10 down to 1 (countdown) and then prints 'Launch!'",
                "practice_question": "What is an infinite loop? Provide a scenario where an infinite loop is explicitly intended (e.g. server listening ports)."
            },
            "function": {
                "explanation": "A Python Function is a modular, reusable block of code that is executed only when it is explicitly invoked. It can accept input arguments and return output values.",
                "analogy": "Think of a microwave oven. You put raw food inside (input parameters), select a settings timer, and it outputs a warm meal (returned value). You do not need to rebuild the microwave each time you cook.",
                "example": "```python\n# Defining and calling a function\ndef greet_student(name):\n    return f'Welcome to BhartX, {name}!'\n\nmessage = greet_student('Shubh')\nprint(message)  # Outputs: Welcome to BhartX, Shubh!\n```",
                "try_yourself": "Create a function called `calculate_area` that accepts a rectangle's width and height. It should return the area value.",
                "practice_question": "Explain the scopes of local variables declared inside a function versus global variables declared outside."
            },
            "database": {
                "explanation": "A Database is a structured collection of data stored and organized electronically. In relational databases (RDBMS), data is stored in tables linked via keys.",
                "analogy": "Imagine a giant spreadsheet workbook containing sheets for Students, Courses, and Enrollments. By linking student ID cells across sheets, we create relational data links.",
                "example": "```sql\n-- Querying a database\nSELECT users.name, courses.title \nFROM enrollments\nJOIN users ON enrollments.user_id = users.id\nJOIN courses ON enrollments.course_id = courses.id;\n```",
                "try_yourself": "Write a SQL query that retrieves all students registered in the 'A-Level' course whose registration date is after January 2026.",
                "practice_question": "Define the four ACID parameters in database transaction management and explain why Atomicity is critical."
            },
            "operating system": {
                "explanation": "An Operating System (OS) is system software that manages computer hardware components, coordinates shared resources, and provides common services for application programs.",
                "analogy": "Think of an OS as a traffic police coordinator at a busy intersection, managing intersections (CPU time) and lane queues (RAM allocation) so that drivers (software applications) do not crash.",
                "example": "```text\nProcesses -> Scheduler (Round Robin) -> CPU core execution\n```",
                "try_yourself": "Compare paging with segmentation in memory management. Draft a simple table contrasting their base principles.",
                "practice_question": "What is a deadlock scenario in Operating Systems? Describe the four necessary conditions (Coffman conditions) for a deadlock to occur."
            }
        }

        # Catch-all generic fallback response
        self.default_topic = {
            "explanation": "This topic covers critical concepts of the NIELIT A-Level curriculum. Let's analyze it step-by-step using structural models.",
            "analogy": "Think of this topic as a building block. You assemble smaller components to establish a stable structural setup.",
            "example": "```python\n# Standard conceptual model\ndef conceptual_process(data):\n    # Process data and return outcomes\n    return data\n```",
            "try_yourself": "Draft a short summary explaining what you understand about this topic's primary utility.",
            "practice_question": "How does this topic relate to general computer networking or programming architectures?"
        }

    def generate_text(self, system_prompt: str, user_prompt: str) -> str:
        # Match keywords in prompt string
        q_lower = user_prompt.lower()
        matched = self.default_topic
        
        for key in self.kb:
            if key in q_lower:
                matched = self.kb[key]
                break

        # Socratic Tutor format response wrapper
        response_json = {
            "role": "tutor",
            "answer": matched["explanation"],
            "explanation": matched["explanation"],
            "analogy": f"Analogy: {matched['analogy']}",
            "example": matched["example"],
            "try_yourself": matched["try_yourself"],
            "practice_question": matched["practice_question"]
        }
        return json.dumps(response_json)
