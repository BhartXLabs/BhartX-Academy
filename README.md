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
   - Enforces a **Pre-learning Focus Contract** checklist before active study.
   - Integrates the **YouTube IFrame Player API** to pause video playback dynamically at custom timestamps, forcing the student to resolve **in-video MCQ checkpoints**.
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

## 🔑 Secure Authentication & Frictionless Onboarding

### 1. Unified Single-Screen Auth Flow (Security First)
To prevent **email enumeration attacks**, the system avoids checking email existence beforehand. Instead:
- **Google First Placement**: A colorful Google login CTA sits at the top of the interface.
- **Unified Email Form**: Enter email and password.
  - The backend (`POST /api/v1/auth/login-or-signup`) internally evaluates the state. If the email exists, it logs the user in. If not, it creates a new account automatically and signs them in, bypassing registration screens.

### 2. "First Success in 60 Seconds" Onboarding
Rather than presenting long, blocking questionnaires:
- **Step 1 (2 Clicks)**: New users only configure their target Name and Course ("NIELIT A-Level"), then click **"Start Learning"** to land straight on the dashboard.
- **Step 2 (Progressive Profiling)**: Study durations, exam target dates, and weak areas are prompted as gentle, single-question cards at the top of the dashboard over subsequent sessions:
  ```text
  [Signup -> Name/Course] ──> [Dashboard] ──> [Daily time check] ──> [Exam Date check]
  ```

### 3. Session & Provider Tracking
- **Analytical Updates**: `User` table stores social login providers, avatar URLs, login counts, and last login timestamps.
- **`UserSession` Logs**: Tracks client browsers, devices, IP addresses, and login/logout times for security audits.

---

## 🛠️ Developer Reference & Technical Architecture

### Tech Stack
* **Frontend**: Next.js 16 (App Router), React 19, Zustand (Client Session Store), TanStack Query v5 (Data caching/fetching), Tailwind CSS, Lucide Icons.
* **Backend**: FastAPI, Async SQLAlchemy, SQLite (Local Dev fallback) / PostgreSQL, raw `bcrypt` password encryption.
* **Infrastructure**: Docker Compose, Dockerfile setups.

### Database Schema Overview
The SQLite database file (`bhartx_academy.db`) maps 22 entities including:
- **`User`**: Account profiles, streaking records, and onboarding responses.
- **`UserSession`**: Browser, device, and login audit tracks.
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
| **New Signup** | Register via credentials | Select password | Triggers Onboarding Gateway Modal |
