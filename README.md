# BhartX Academy — AI-Powered Cognitive Growth Platform

> BhartX Academy is **not** a Learning Management System (LMS) designed to sell videos. It is a **Cognitive Growth Platform (Human Potential Operating System)** built to systematically guide any student — weak, average, or topper — from their current knowledge state to their highest possible cognitive potential.

---

## 👁️ Founder & C-Level Strategy

### The Paradigm Shift: Growth over Progress
Traditional LMS platforms focus on **feature lists** and **completion percentages** (e.g., "75% of videos watched"). BhartX Academy shifts the core metric to **Mastery Growth**:

```
[Input: Learner] ──> [AI Cognitive Engine] ──> [Dynamic Interventions] ──> [Mastery Output]
```

Every feature on this platform must justify its existence by answering one question: **"Does this improve student learning outcomes?"** If yes, we build it. If no, we reject it.

### The 5 Core Cognitive Engines
1. **Learning Engine (Active Playback)**:
   - Blocks passive scrolling by enforcing a **Pre-learning Focus Contract** checklist.
   - Embeds **concept checks (in-video MCQs)** at specific playhead intervals. If a student fails or clears it, the state is dynamically captured.
   - Enforces **active retrieval (Feynman recall essay)** and confidence self-calibration (1-5 score rating) post-video.
2. **Assessment Engine (Mastery gates)**:
   - Employs chapter-end **mastery gates requiring a &ge; 80% passing score** to unlock subsequent chapters.
   - Enforces metacognitive **Confidence Calibration (High/Medium/Low indicators)** per question.
3. **Memory Engine (Spaced Revision Scheduler)**:
   - Tracks recall success and automates spaced revision intervals on the student's dashboard based on memory decay curves.
4. **AI Socratic Engine (Active Mentorship)**:
   - Socratic chatbot that guides learners through analogies, worked examples, and "Try Yourself" drills rather than providing copy-paste solutions.
5. **Analytics Engine (Multi-Dimensional Diagnostics)**:
   - Computes 6 Growth Metrics dynamically:
     - **Concept Understanding**: Accuracy rates on checkpoints.
     - **Long-Term Retention**: Performance on spaced review recall checks.
     - **Practical Application**: Coding exercises/practical quiz metrics.
     - **Metacognitive Confidence**: Alignment of self-reported confidence with actual accuracy.
     - **Study Consistency**: Streaks and daily active learning habits.
     - **Cognitive Focus**: Interrupted vs. uninterrupted study sessions.

---

## 🛠️ Developer Reference & Technical Architecture

### Tech Stack
* **Frontend**: Next.js 16 (App Router), React 19, Zustand (Client Session Store), TanStack Query v5 (Data caching/fetching), Tailwind CSS, Lucide Icons.
* **Backend**: FastAPI, Async SQLAlchemy, SQLite (Local Dev fallback) / PostgreSQL, raw `bcrypt` password encryption.
* **Infrastructure**: Docker Compose, Dockerfile setups.

### Database Schema Overview
The SQLite database file (`bhartx_academy.db`) maps 22 entities including:
- **`User`**: Account profiles, streaking records, and onboarding responses.
- **`Course`, `Subject`, `Chapter`, `Lesson`**: Hierarchical content trees.
- **`VideoPrompt`**: Seeded MCQ metadata triggered at specific timestamps.
- **`ProgressLog`**: Tracks playback position, percentage watched, and completion status.
- **`MistakeJournal`**: Unresolved student errors, correct/incorrect choices, and retry histories.
- **`SpacedRevision`**: Scheduled revision tasks with Stage indicators.

---

## 🚀 Getting Started

### 1. Backend Setup (Local Dev)
Navigate to the backend directory, configure a Python environment, install libraries, seed data, and launch:
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt

# Seed curriculum hierarchy, video prompts, and test users
python seed/seed_data.py

# Launch FastAPI development server
uvicorn main:app --reload --port 8000
```
- API Swagger Docs: `http://localhost:8000/docs`

### 2. Frontend Setup
Install npm packages and spin up the Next.js compilation server:
```bash
cd frontend
npm install
npm run dev
```
- Local dashboard address: `http://localhost:3000`

---

## 🔑 Seeding User Profiles
Test the end-to-end flows with these pre-seeded accounts:

| Role | Email | Password | Onboarding State |
| :--- | :--- | :--- | :--- |
| **Student** | `student@bhartx.com` | `studentpassword` | Onboarded *(View growth metrics immediately)* |
| **Admin** | `admin@bhartx.com` | `adminpassword` | Authorized Admin Center views |
| **New Signup** | Register via tab | Select password | Triggers Onboarding Questionnaire Modal |
