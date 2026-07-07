# BhartX Academy — AI-Powered Cognitive Learning Operating System

BhartX Academy is **not** a traditional Learning Management System (LMS) built to sell static videos. It is an **AI-powered Cognitive Learning Operating System** designed using cognitive science, habit psychology, and modern software architectures to systematically guide students from their current knowledge state to deep, long-term mastery.

---

## 🏗️ System & Architectural Blueprint

BhartX Academy separates its concerns into a high-performance **FastAPI asynchronous backend service** and a **Next.js 16 (App Router) mobile-first PWA frontend**.

```
                           +----------------------------------------+
                           |       Next.js 16 PWA Client            |
                           |  (Zustand Auth + TanStack Query Hooks) |
                           +-------------------+--------------------+
                                               |
                                     JSON HTTP | Credentials: "include"
                                               v
                           +----------------------------------------+
                           |       FastAPI Backend Gateway          |
                           |    (Uvicorn / Gunicorn ASGI Server)    |
                           +----+--------------+---------------+----+
                                |              |               |
         Async SQL (SQLAlchemy) |              | httpx Async   | httpx Async
                                v              |               v
                     +----------+---+          |         +-----+------+
                     |  Postgres /  |          |         | LLaMA 3.3  | (Primary)
                     |  SQLite DB   |          |         | (via Groq) |
                     +--------------+          |         +-----+------+
                                               |               | Fallback
                                               |               v
                                               |         +-----+------+
                                               |         | Gemini 1.5 | (Secondary)
                                               |         |   Flash    |
                                               |         +-----+------+
                                               |               | Fallback
                                               v               v
                                         +-----+------+  +-----+------+
                                         | Rule-based |  | Offline    | (Last Resort)
                                         | Scheduler  |  | FAQ tutor  |
                                         +------------+  +------------+
```

---

## 🧠 Core Cognitive Engines (Active Pedagogy)

The platform implements five interconnected cognitive engines:

### 1. Learning Engine (Active Video Workspace)
- **Pre-Learning Focus Contract**: Prompts users to declare physical boundaries (no distractions, honest study) before launching a lesson.
- **Dynamic Checkpoint MCQ Prompts**: Pauses video playback at specific timestamps via YouTube IFrame player integration, prompting the user to solve checkpoints.
- **Feynman Recall & Metacognitive Calibration**: Post-video active retrieval prompt where students summarize lessons in their own words and report confidence levels (1–5).
- **Direct Mistake Logging**: Incorrect prompt attempts are logged directly into the `mistake_journals` table via a secure POST `/journal` endpoint.

### 2. Assessment Engine (Mastery Gates)
- **Eligibility Lock**: Lesson paths and chapter quizzes are locked until prerequisites are met.
- **Mastery Gates**: Chapter check quizzes require a $\ge 80\%$ passing score to unlock next chapter modules.
- **Metacognitive Calibration**: Every quiz question requires selecting a confidence indicator (High, Medium, Low) to measure calibration scores.

### 3. Memory Engine (Spaced Revision Scheduler)
- Uses the **SM-2 (SuperMemo-2) algorithm** to predict memory decay.
- Tracks correct/incorrect revision recalls, updating stages ($1\dots 5$) and next review timestamps.
- Displays overdue memory revision cards on the user's dashboard.

### 4. Socratic AI Doubt Solver (Mentor)
- **Async Falling Pipeline**: Executes async API calls with automated 2x retries and backoff. If Groq LLaMA 3.3 (70B) fails, it falls back to Gemini 1.5 Flash, then to the local Offline FAQ keyword match.
- **Conversation Session Context**: Backend-managed conversation history table retrieves the last 6 messages dynamically, preventing token overload and client-side history manipulation.

### 5. Real Analytics Engine
- Computes student cognitive indexes dynamically:
  - **Learning**: Quiz accuracy, lesson completions, self-reported confidence.
  - **Memory**: Spaced revision compliance, mistake resolution rates.
  - **Recommendations**: Priority-sorted action vectors (overdue tasks, unresolved mistakes, low-accuracy subjects).

---

## 📂 Codebase Directory Layout

### Backend (`/backend`)
```text
backend/
├── app/
│   ├── api/v1/
│   │   ├── endpoints/
│   │   │   ├── auth.py          # Unified login/signup, logout, refresh session
│   │   │   ├── courses.py       # Syllabus index, lesson queries with unlock check
│   │   │   ├── journal.py       # Mistake journal queries & resolve endpoint
│   │   │   ├── ai.py            # AI Socratic chat, AI test gen, AI Study Planner
│   │   │   └── analytics.py     # Real student cognitive statistics API
│   │   └── router.py            # API route inclusion index
│   ├── core/
│   │   ├── config.py            # Pydantic Settings (ENV, API keys, CORS)
│   │   └── security.py          # JWT Token create, verify, password hashing
│   ├── db/
│   │   └── session.py           # SQLAlchemy engines and session factories
│   ├── models/
│   │   └── all_models.py        # SQLAlchemy Unified ORM definitions (29 tables)
│   ├── repositories/            # DB communication layers (Base Repository pattern)
│   └── services/
│       ├── ai/
│       │   ├── providers.py     # Async HTTP LLM clients with chain fallback
│       │   └── agents/          # Agent behaviors (Tutor, Coach, Examiner)
│       └── analytics_service.py # Dynamic DB cognitive analytics calculations
├── Dockerfile                   # Multi-worker Gunicorn Uvicorn production container
└── requirements.txt             # Python dependencies manifest
```

### Frontend (`/frontend`)
```text
frontend/
├── public/
│   ├── manifest.json            # PWA Web Manifest (native standalone metadata)
│   └── sw.js                    # Service Worker caching assets & offline support
├── src/
│   ├── app/                     # Next.js App Router folders
│   │   ├── courses/             # Syllabus index and subject detailed pages
│   │   ├── dashboard/           # Main workspace panel, real analytics indicators
│   │   ├── journal/             # Mistake notebook list and review games
│   │   ├── lessons/[lessonId]/  # Feynman recall inputs, contract gateways, video MCQ
│   │   ├── ai-doubt/            # Socratic AI chat with markdown code rendering
│   │   └── study-plan/          # Today's daily study tasks priority planner
│   ├── components/
│   │   ├── ProtectedRoute.tsx   # Auth validation guard wrapper
│   │   ├── Sidebar.tsx          # Responsive navigation links with drawer overlay
│   │   └── Navbar.tsx           # Global search headers, streak counts, hamburger
│   ├── hooks/
│   │   └── useApi.ts            # TanStack Query custom data-fetching hooks
│   └── store/
│       └── useAuthStore.ts      # Zustand client user state session memory
```

---

## 🚀 Deployment & Getting Started

### Local Setup (Backend)
1. Navigate to the backend directory and set up a virtual environment:
   ```bash
   cd backend
   python -m venv venv
   .\venv\Scripts\activate   # Windows
   source venv/bin/activate  # macOS/Linux
   ```
2. Install package dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the database migrations & seed curriculum mock data:
   ```bash
   python seed/seed_data.py
   ```
4. Start the FastAPI development server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

### Local Setup (Frontend)
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Spin up the Next.js development server:
   ```bash
   npm run dev
   ```

### Hosting on Vercel + Render
- **Frontend (Vercel)**: Point repository to `/frontend` directory. Add env variable:
  - `NEXT_PUBLIC_API_URL` = `https://your-backend-render-app.onrender.com/api/v1`
- **Backend (Render)**: Deploy as **Docker Web Service** using the backend Dockerfile. Add env variables:
  - `ENV` = `production`
  - `DATABASE_URL` = `postgresql://your-neon-postgres-connection-string?sslmode=require`
  - `ALLOWED_ORIGINS` = `https://your-frontend-vercel-app.vercel.app`
  - Setup API Keys (`OPENAI_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`) safely in Render's dashboard.
