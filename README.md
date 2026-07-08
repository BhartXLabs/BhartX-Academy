# BhartX Academy — AI-Powered Cognitive Learning Operating System

> **Learning > Watching. Mastery > Completion. Thinking > Memorization.**

BhartX Academy is not a course-selling platform. It is an **AI-powered Cognitive Learning Operating System** built on cognitive science, habit psychology, and modern software engineering — designed to take every student from their current knowledge state to **deep, verifiable, long-term mastery**.

---

## 🎯 Mission

> To help every student achieve **mastery** instead of mere course completion.

Most EdTech platforms optimise for watch time. BhartX optimises for **learning outcomes**. Every architectural decision — from the SM-2 memory scheduler to the Socratic AI Doubt Solver — is driven by a single obsession: *did the student actually understand?*

---

## ✨ What Makes BhartX Different

| Feature | Traditional LMS | BhartX Academy |
|---|---|---|
| Content delivery | Passive video | Active Feynman Recall workspace |
| Assessment | End-of-course quiz | Inline MCQ checkpoints + mastery gates |
| Memory | None | SM-2 Spaced Revision Scheduler (true E-Factor) |
| Doubt solving | Forum / Q&A | Socratic AI Tutor (Groq → Gemini → Offline) |
| Analytics | Watch percentage | Cognitive indexes (accuracy, memory, calibration) |
| Personalisation | None | AI-generated study plans + mistake-journal review |
| Offline support | None | PWA + Service Worker asset cache |

---

## 🏗️ V1 Architecture

Simple, proven, and sufficient for the entire V1 roadmap:

```
academy.bhartx.in
        │
   ┌────▼────┐
   │  Vercel  │  Next.js 16 PWA (Frontend)
   └────┬────┘
        │  HTTPS JSON API
   ┌────▼────────────────┐
   │     AWS EC2          │
   │  ┌───────────────┐  │
   │  │   FastAPI     │  │  Gunicorn -k UvicornWorker -w 4
   │  └───────┬───────┘  │
   │  ┌───────▼───────┐  │
   │  │  PostgreSQL   │  │  All structured data
   │  └───────────────┘  │
   │  ┌───────────────┐  │
   │  │     Nginx     │  │  Reverse proxy + SSL termination
   │  └───────────────┘  │
   └─────────────────────┘
        │
   ┌────▼────┐
   │ YouTube  │  All video content (embedded via video_id)
   └─────────┘
        │
   ┌────▼──────────────────────────┐
   │       AI Provider Chain        │
   │  Groq → Gemini → Offline FAQ  │
   └───────────────────────────────┘
```

### What lives where

| Data | Storage |
|---|---|
| Users, Auth, Sessions | PostgreSQL |
| Enrollments, Progress | PostgreSQL |
| Quiz Attempts, Mock Tests | PostgreSQL |
| Mistake Journal | PostgreSQL |
| AI Chat History | PostgreSQL |
| Notifications | PostgreSQL |
| Spaced Revision Schedule | PostgreSQL |
| Analytics | PostgreSQL |
| **Videos** | **YouTube embed** (only `video_id` stored in DB) |
| **Notes / Resources** | **Public URL** (GitHub, Google Docs, CDN link) |

> **No file storage in V1.** Students don't upload anything. Content is delivered via YouTube embeds and public URLs. This eliminates an entire infrastructure layer and keeps the system simple and reliable.

---

## 🧩 Generic Course Plugin Architecture

The schema is deliberately course-agnostic. One engine handles every course type:

```
Mode A — Semester-based (e.g. NIELIT A-Level, B-Level)
  Course → Semester → Subject → Chapter → Lesson

Mode B — Topic-based (e.g. UPSC, CCC, AI/ML, Cyber Security)
  Course → Subject → Chapter → Lesson
```

`Semester` is fully optional. A new course can be added **without any code changes** — just seed the database with the right structure.

### Lesson Schema (the content atom)
```sql
lessons
  id              INT         Primary key
  chapter_id      INT         FK → chapters
  title           VARCHAR     "Introduction to Python Lists"
  description     TEXT        Markdown notes / lesson overview
  video_provider  VARCHAR     'youtube' (default) | 'vimeo' | 'bunny'
  video_id        VARCHAR     YouTube video ID e.g. 'dQw4w9WgXcQ'
  notes_url       VARCHAR     Public URL to notes (optional)
  duration_seconds INT        Video length in seconds
  order           INT         Position within chapter
  status          VARCHAR     'published' | 'draft'
  prerequisites   TEXT        Markdown prerequisite list
  outcomes        TEXT        Markdown learning outcomes
```

### When will Cloudflare R2 be added?

Only when one of these features is built:
- Student assignment / project file upload
- Admin PDF notes upload
- Generated completion certificates
- Profile pictures
- AI-generated downloadable files
- Coding project ZIP submissions

Until then: **no object storage needed.**

---

## 🧠 Core Cognitive Engines

### 1. Learning Engine (Active Video Workspace)
- **Pre-Learning Focus Contract** — Students declare study boundaries before starting.
- **Dynamic MCQ Checkpoints** — Video pauses at key timestamps via YouTube IFrame API.
- **Feynman Recall** — Post-video retrieval: students summarise in own words.
- **Metacognitive Calibration** — Confidence self-rating (1–5) tracked per lesson.

### 2. Assessment Engine (Mastery Gates)
- **Prerequisite Locks** — Chapters locked until prior modules completed.
- **Mastery Gates** — ≥ 80% quiz score required to unlock next chapter.
- **Confidence-Weighted Scoring** — High-confidence wrong answers penalised more.

### 3. Memory Engine (True SM-2 Algorithm)
- Implements the **SuperMemo-2 algorithm** with adaptive E-Factor.
- Ease Factor (EF) starts at 2.5 and updates per recall quality: `EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))`
- EF clamped to [1.3, 5.0]. Failed recalls reset interval to 1 day with EF penalty.
- 5 review stages with adaptive intervals based on individual recall performance.

### 4. Socratic AI Doubt Solver
- Async 2× retry with backoff before falling to next provider.
- Conversation history (last 6 messages) stored server-side.
- Socratic dialogue mode: AI guides rather than just answers.
- **Fallback chain**: Groq LLaMA 3.3 (70B) → Gemini 1.5 Flash → Offline FAQ Matcher

### 5. Analytics Engine
- **Learning Index** — Quiz accuracy + lesson completion rate.
- **Memory Index** — SM-2 revision compliance + mistake resolution rate.
- **Calibration Score** — Confidence accuracy correlation.
- **Recommendation Vectors** — Priority-sorted action list (overdue → low accuracy → unresolved mistakes).

---

## 🔒 Security Architecture

| Layer | Implementation |
|---|---|
| Authentication | JWT (HS256) stored in `HttpOnly` cookies — XSS-proof |
| Session refresh | Sliding refresh token rotation on every authenticated request |
| CSRF Protection | Origin + Referer header validation on all state-mutating requests |
| Google OAuth | Server-side `id_token` verification via Google token info endpoint |
| Password storage | `bcrypt` hashing with adaptive cost factor |
| Rate limiting | Per-IP via slowapi (AI: 20 req/min; Auth: 5 attempts) |
| CORS | Strict allowlist — only registered frontend origins |
| Input validation | Pydantic v2 schema validation on all request bodies |
| Security headers | `X-Content-Type-Options`, `X-Frame-Options`, `HSTS` (prod) |
| Cookie policy | Dev: `Secure=False; SameSite=Lax` / Prod: `Secure=True; SameSite=None` |
| SQL injection | SQLAlchemy ORM parameterised queries — no raw SQL |

---

## 📊 Monitoring & Observability

### Health Endpoints

| Endpoint | Type | Purpose |
|---|---|---|
| `GET /health` | Liveness | Server process alive — returns 200 immediately |
| `GET /ready` | Readiness | DB connectivity check — returns 503 if DB unreachable |

### Logging
- **Structured JSON logs** — every line is a valid JSON object parseable by Datadog, CloudWatch, Render Logs.
- Fields per log: `time`, `level`, `module`, `message`, `method`, `path`, `status`, `duration_ms`, `request_id`, `env`
- Health/ready probe traffic suppressed from access logs.

---

## 🏁 Feature Flags (Environment Variables)

```env
# AI Features
ENABLE_AI=true                   # Master AI switch
ENABLE_AI_TEST_GEN=true          # AI-generated practice tests
ENABLE_AI_STUDY_PLAN=true        # Personalised daily study plan

# Cognitive Engine
ENABLE_SM2=true                  # Spaced repetition scheduler
ENABLE_ANALYTICS=true            # Student cognitive analytics

# Infrastructure (off by default — not yet built)
ENABLE_REDIS_CACHE=false
ENABLE_NOTIFICATION_ENGINE=false
```

---

## 📂 Codebase Layout

### Backend (`/backend`)
```
backend/
├── app/
│   ├── api/v1/
│   │   ├── endpoints/
│   │   │   ├── auth.py          # Login, signup, logout, Google OAuth, token refresh
│   │   │   ├── courses.py       # Syllabus, lessons, unlock gate checks
│   │   │   ├── journal.py       # Mistake journal CRUD + resolve
│   │   │   ├── ai.py            # Socratic chat, AI test gen, study plan, coach tip
│   │   │   ├── analytics.py     # Student cognitive statistics
│   │   │   ├── progress.py      # Lesson progress, SM-2 revision completion
│   │   │   ├── quizzes.py       # Quiz attempts + mastery gate evaluation
│   │   │   ├── search.py        # Universal search across course content
│   │   │   ├── notifications.py # Notification read/mark endpoints
│   │   │   ├── mocks.py         # Mock test creation and attempts
│   │   │   └── admin.py         # Admin dashboard (role-gated)
│   │   └── router.py
│   ├── core/
│   │   ├── config.py            # Pydantic Settings v2 + Feature Flags
│   │   ├── security.py          # JWT create/verify, bcrypt hashing
│   │   ├── logging.py           # Structured JSON logging + middleware
│   │   └── ratelimit.py         # slowapi rate limiter config
│   ├── db/
│   │   └── session.py           # SQLAlchemy engine + session factory
│   ├── models/
│   │   └── all_models.py        # Unified ORM (all tables)
│   ├── repositories/            # Repository pattern — DB abstraction
│   └── services/
│       ├── ai/
│       │   ├── providers.py     # Groq → Gemini → Offline fallback chain
│       │   ├── gateway.py       # AI gateway — routes to correct agent
│       │   └── agents/          # Tutor, Coach, Examiner behaviours
│       └── analytics_service.py # Dynamic cognitive analytics
├── seed/
│   └── seed_data.py
├── Dockerfile
└── requirements.txt
```

### Frontend (`/frontend`)
```
frontend/
├── public/
│   ├── manifest.json            # PWA manifest
│   └── sw.js                    # Service Worker — cache-first
├── src/
│   ├── app/
│   │   ├── (dashboard)/         # All authenticated pages (shared layout)
│   │   │   ├── dashboard/       # Analytics, overdue revisions, recommendations
│   │   │   ├── courses/         # Syllabus tree (Course → Sem → Subject → Chapter)
│   │   │   ├── lessons/[id]/    # Video player, MCQ checkpoints, Feynman recall
│   │   │   ├── journal/         # Mistake notebook + resolve workflow
│   │   │   ├── ai-doubt/        # Socratic AI chat
│   │   │   ├── ai-test/         # AI-generated practice tests
│   │   │   ├── study-plan/      # Daily AI study planner
│   │   │   ├── pyqs/            # Previous year question bank
│   │   │   ├── mocks/           # Mock test sessions
│   │   │   ├── quizzes/         # Chapter mastery quizzes
│   │   │   ├── profile/         # Student profile
│   │   │   ├── settings/        # Account settings
│   │   │   └── admin/           # Admin dashboard
│   │   ├── login/               # Auth — email/password + Google OAuth redirect
│   │   └── page.tsx             # Landing page
│   ├── components/
│   │   ├── ProtectedRoute.tsx
│   │   ├── Navbar.tsx
│   │   └── Sidebar.tsx
│   ├── hooks/useApi.ts
│   └── store/
│       ├── useAuthStore.ts
│       └── useSidebarStore.ts
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.11+  |  Node.js 20+  |  PostgreSQL (prod) or SQLite (dev, auto-created)

### Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate   # macOS/Linux
# .\venv\Scripts\activate                           # Windows

pip install -r requirements.txt
cp .env.example .env      # Fill in your keys

python seed/seed_data.py  # Creates tables + seeds curriculum
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
# Create .env.local with: NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
npm run dev
```

### Environment Variables (Backend `.env`)
```env
ENV=development
SECRET_KEY=your-256-bit-random-secret
DATABASE_URL=sqlite:///./bhartx_academy.db     # Dev
# DATABASE_URL=postgresql+asyncpg://...         # Prod

ALLOWED_ORIGINS=http://localhost:3000

GROQ_API_KEY=gsk_...
GEMINI_API_KEY=AIza...
GOOGLE_CLIENT_ID=...apps.googleusercontent.com

ENABLE_AI=true
ENABLE_SM2=true
ENABLE_ANALYTICS=true
```

---

## ☁️ Production Deployment

### Frontend → Vercel
```
Root Directory  : frontend/
NEXT_PUBLIC_API_URL = https://api.bhartx.in/api/v1
```

### Backend → AWS EC2 (Docker)
```dockerfile
# Dockerfile start command:
gunicorn main:app -k uvicorn.workers.UvicornWorker -w 4 --bind 0.0.0.0:8000
```
```
ENV=production
DATABASE_URL=postgresql+asyncpg://user:pass@localhost/bhartx?ssl=require
ALLOWED_ORIGINS=https://academy.bhartx.in
GROQ_API_KEY=...
GEMINI_API_KEY=...
GOOGLE_CLIENT_ID=...
```

Nginx config proxies `academy.bhartx.in/api` → FastAPI on port 8000.

---

## 🗺️ Roadmap

```
V1 — Private Beta (Current)
  ├── NIELIT A-Level Computer Science
  ├── CCC (Course on Computer Concepts)
  ├── All 5 Cognitive Engines implemented
  ├── Google OAuth + JWT auth
  ├── PWA + offline support
  ├── Admin dashboard
  └── AWS EC2 + PostgreSQL deployment

V2 — Expansion + Intelligence
  ├── UPSC Prelims, O-Level, AI/ML, Cyber Security, Cloud courses
  │   (same engine, just new seed data — no code changes)
  ├── Redis + Celery notification engine (revision reminders)
  ├── Universal push notifications
  ├── Recommendation Engine (Learning DNA)
  └── Course Plugin System (admin can add courses via UI)

V3 — Adaptive Operating System
  ├── Knowledge Graph per student
  ├── Full adaptive learning (AI re-sequences content)
  ├── Career Engine (goal-aligned curriculum)
  ├── Student assignment upload → Cloudflare R2
  ├── Generated PDF certificates → Cloudflare R2
  └── Mobile app (React Native)
```

---

## 📚 Developer Documentation

Full docs in [`/docs`](./docs/) (in progress):

| Document | Status |
|---|---|
| [API Reference](./docs/API.md) | In progress |
| [Database Schema](./docs/SCHEMA.md) | In progress |
| [AI Architecture](./docs/AI.md) | In progress |
| [Cognitive Engine](./docs/COGNITIVE_ENGINE.md) | In progress |
| [Security Guide](./docs/SECURITY.md) | In progress |
| [Deployment Guide](./docs/DEPLOYMENT.md) | In progress |

---

## 📄 License

MIT — see [LICENSE](./LICENSE)

---

*BhartX Academy is built with the belief that every student, regardless of background or resources, deserves a learning system that works as hard as they do.*
