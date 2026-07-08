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
| Memory | None | SM-2 Spaced Revision Scheduler |
| Doubt solving | Forum / Q&A | Socratic AI Tutor (Groq → Gemini → Offline) |
| Analytics | Watch percentage | Cognitive indexes (accuracy, memory, calibration) |
| Personalisation | None | AI-generated study plans + mistake-journal review |
| Offline support | None | PWA + Service Worker asset cache |

---

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Student                                │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│            Learning Engine                              │
│  Pre-lesson focus contract · Dynamic MCQ checkpoints   │
│  Feynman recall · Metacognitive confidence calibration  │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│            Assessment Engine                            │
│  Prerequisite locks · Mastery gates (≥ 80%)            │
│  Confidence-weighted scoring                            │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│            Memory Engine                                │
│  SM-2 spaced repetition · Decay prediction             │
│  Flashcard stages 1-5 · Overdue recall dashboard       │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│            AI Tutor Engine                              │
│  Socratic dialogue · Context-aware last 6 messages     │
│  Groq LLaMA 3.3 (70B) → Gemini 1.5 Flash → Offline FAQ │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│            Analytics Engine                             │
│  Learning index · Memory index · Calibration score     │
│  Priority recommendation vectors                        │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│            Recommendation Engine  (Planned v2)          │
│  Learning DNA · Predictive analytics · Adaptive paths   │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│         Study Planner + Career Engine (Planned v3)      │
│  Daily priority scheduler · Exam countdown · Career AI  │
└─────────────────────────────────────────────────────────┘
```

---

## ⚙️ Technical Stack Architecture

```
                ┌──────────────────────────────────┐
                │    Next.js 16 PWA Client          │
                │  (Zustand Auth · TanStack Query)  │
                └─────────────┬────────────────────┘
                              │  JSON HTTP  Credentials: include
                              ▼
                ┌──────────────────────────────────┐
                │    FastAPI Backend Gateway        │
                │  Gunicorn -k UvicornWorker -w 4   │
                └────┬──────────┬──────────┬───────┘
                     │          │          │
         SQLAlchemy  │   httpx  │   httpx  │
                     ▼          │          ▼
          ┌──────────────┐      │   ┌──────────────┐
          │  PostgreSQL  │      │   │ LLaMA 3.3 70B│ Primary
          │  (Production)│      │   │  via Groq    │
          └──────────────┘      │   └──────┬───────┘
          ┌──────────────┐      │          │ Fallback
          │  SQLite      │      │          ▼
          │  (Dev only)  │      │   ┌──────────────┐
          └──────────────┘      │   │ Gemini 1.5   │ Secondary
                                │   │ Flash        │
          ┌──────────────┐      │   └──────┬───────┘
          │  Redis       │      │          │ Fallback
          │  (Planned)   │◄─────┘          ▼
          │  Session     │         ┌──────────────┐
          │  Rate limit  │         │ Offline FAQ  │ Last resort
          │  Task queue  │         │ Rule-based   │
          └──────────────┘         └──────────────┘

          ┌──────────────┐
          │ Cloudflare R2│ (Planned)
          │ PDFs · Images│
          │ Resources    │
          └──────────────┘
```

### AI Fallback Chain

```
Groq LLaMA 3.3 (70B)   — Primary   (fast inference, low cost)
        ↓ timeout / 5xx
Gemini 1.5 Flash        — Secondary (Google backbone reliability)
        ↓ timeout / quota
Offline FAQ Matcher     — Last resort (keyword rule engine, zero cost)
```

### Database Strategy

| Environment | Database | Reasoning |
|---|---|---|
| Development | SQLite | Zero-config local setup |
| Production | PostgreSQL only | ACID compliance, concurrent writes, JSON indexing |

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

### 3. Memory Engine (SM-2 Scheduler)
- Implements the **SuperMemo-2 algorithm** for spaced repetition.
- Predicts memory decay; schedules next review based on recall performance.
- Stages 1–5 tracked per flashcard; overdue cards surfaced on dashboard.

### 4. Socratic AI Doubt Solver
- Async 2× retry with backoff before falling to next provider.
- Conversation history (last 6 messages) stored server-side — prevents token overload.
- Socratic dialogue mode: AI guides rather than just answers.

### 5. Analytics Engine
- **Learning Index** — Quiz accuracy + lesson completion rate.
- **Memory Index** — Spaced revision compliance + mistake resolution rate.
- **Calibration Score** — Confidence accuracy correlation.
- **Recommendation Vectors** — Priority-sorted action list (overdue → low-accuracy → unresolved mistakes).

---

## 🔒 Security Architecture

| Layer | Implementation |
|---|---|
| Authentication | JWT (HS256) stored in `HttpOnly` cookies — XSS-proof |
| Session refresh | Sliding refresh token rotation on every authenticated request |
| Google OAuth | Server-side `id_token` verification via Google token info endpoint |
| Password storage | `bcrypt` hashing with adaptive cost factor |
| Rate limiting | Per-IP middleware (AI endpoints: 10 req/min; Auth: 5 req/min) |
| CORS | Strict allowlist — only registered frontend origins |
| Input validation | Pydantic v2 schema validation on all request bodies |
| Cookie policy | Dev: `Secure=False; SameSite=Lax` / Prod: `Secure=True; SameSite=None` |
| SQL injection | SQLAlchemy ORM parameterised queries — no raw SQL |

---

## 🏁 Feature Flags (Environment Variables)

Control feature availability without code changes:

```env
# AI Features
ENABLE_AI=true                   # Master AI switch (Doubt solver, Test gen, Study plan)
ENABLE_AI_TEST_GEN=true          # AI-generated practice test questions
ENABLE_AI_STUDY_PLAN=true        # Personalised daily study plan generation

# Cognitive Engine Toggles
ENABLE_SM2=true                  # Spaced repetition memory scheduler
ENABLE_STUDY_PLAN=true           # Study planner dashboard widget
ENABLE_ANALYTICS=true            # Student cognitive analytics engine

# Infrastructure (Planned)
ENABLE_REDIS_CACHE=false         # Redis-backed response caching
ENABLE_NOTIFICATION_ENGINE=false # Push notification / reminder service
```

---

## 📊 Monitoring & Observability

### Health Endpoints

| Endpoint | Purpose |
|---|---|
| `GET /health` | Liveness check — server is running |
| `GET /ready` | Readiness check — DB connection alive |

### Logging Strategy
- Structured JSON logs: `timestamp`, `level`, `module`, `message`.
- All AI provider calls logged with latency and fallback chain events.
- Auth events (login, logout, token refresh, failures) logged with IP.

### Error Tracking (Planned)
- Sentry integration for production exception capture.
- Uptime monitoring via BetterUptime / UptimeRobot.

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
│   │   │   ├── journal.py       # Mistake journal CRUD + resolve endpoint
│   │   │   ├── ai.py            # Socratic chat, AI test gen, study plan AI
│   │   │   └── analytics.py     # Student cognitive statistics API
│   │   └── router.py
│   ├── core/
│   │   ├── config.py            # Pydantic Settings v2 — ENV, API keys, CORS, flags
│   │   └── security.py          # JWT create/verify, bcrypt password hashing
│   ├── db/
│   │   └── session.py           # SQLAlchemy async engine + session factory
│   ├── models/
│   │   └── all_models.py        # Unified ORM (29 tables)
│   ├── repositories/            # Repository pattern — DB abstraction layer
│   └── services/
│       ├── ai/
│       │   ├── providers.py     # Async LLM clients with Groq→Gemini→Offline chain
│       │   └── agents/          # Tutor, Coach, Examiner agent behaviours
│       └── analytics_service.py
├── seed/
│   └── seed_data.py             # Curriculum mock data seeder
├── Dockerfile                   # Gunicorn -k UvicornWorker -w 4
└── requirements.txt
```

### Frontend (`/frontend`)
```
frontend/
├── public/
│   ├── manifest.json            # PWA manifest (standalone, theme, icons)
│   └── sw.js                    # Service Worker — cache-first asset strategy
├── src/
│   ├── app/
│   │   ├── (dashboard)/         # Route group — shared ProtectedRoute + layout
│   │   │   ├── dashboard/       # Main workspace, analytics, overdue cards
│   │   │   ├── courses/         # Syllabus index, chapter/lesson pages
│   │   │   ├── lessons/[id]/    # Video player, MCQ checkpoints, Feynman recall
│   │   │   ├── journal/         # Mistake notebook, review games
│   │   │   ├── ai-doubt/        # Socratic AI chat with markdown rendering
│   │   │   ├── ai-test/         # AI-generated practice tests
│   │   │   ├── study-plan/      # Daily priority planner
│   │   │   ├── pyqs/            # Previous year questions bank
│   │   │   ├── profile/         # Student profile page
│   │   │   ├── settings/        # Account settings
│   │   │   └── admin/           # Admin dashboard (role-gated)
│   │   ├── login/               # Auth page — email/password + Google OAuth
│   │   └── page.tsx             # Landing page
│   ├── components/
│   │   ├── ProtectedRoute.tsx   # JWT auth guard
│   │   ├── Navbar.tsx           # Global header — search, streak, hamburger
│   │   └── Sidebar.tsx          # Responsive nav drawer (Zustand state)
│   ├── hooks/
│   │   └── useApi.ts            # TanStack Query data-fetching hooks
│   └── store/
│       ├── useAuthStore.ts      # Zustand user session state
│       └── useSidebarStore.ts   # Zustand sidebar mobile open/close state
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 20+
- PostgreSQL (production) or SQLite (dev — auto-created)

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate       # macOS/Linux
.\venv\Scripts\activate        # Windows

pip install -r requirements.txt
cp .env.example .env           # Configure your environment

python seed/seed_data.py       # Seed curriculum data
uvicorn main:app --reload --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.local.example .env.local   # Add NEXT_PUBLIC_API_URL
npm run dev
```

### Environment Variables (Backend)
```env
# App
ENV=development                    # development | production
SECRET_KEY=your-256-bit-secret

# Database
DATABASE_URL=postgresql+asyncpg://user:pass@host/db   # Production
# DATABASE_URL=sqlite+aiosqlite:///./bhartx.db         # Dev fallback

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://academy.bhartx.in

# AI Providers
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=AIza...

# Google OAuth
GOOGLE_CLIENT_ID=...apps.googleusercontent.com

# Feature Flags
ENABLE_AI=true
ENABLE_SM2=true
ENABLE_ANALYTICS=true
```

---

## ☁️ Production Deployment

### Frontend → Vercel
- Root directory: `frontend/`
- Env var: `NEXT_PUBLIC_API_URL=https://api.bhartx.in/api/v1`

### Backend → Render (Docker)
Dockerfile start command:
```bash
gunicorn main:app -k uvicorn.workers.UvicornWorker -w 4 --bind 0.0.0.0:8000
```
Required env vars in Render dashboard:
```
ENV=production
DATABASE_URL=postgresql+asyncpg://...?ssl=require
ALLOWED_ORIGINS=https://academy.bhartx.in
GROQ_API_KEY=...
GEMINI_API_KEY=...
GOOGLE_CLIENT_ID=...
```

### Storage → Cloudflare R2 (Planned)
PDFs, resource files, and images will be hosted on **Cloudflare R2** (S3-compatible, zero egress cost).

---

## 🗺️ Roadmap

```
V1 — Foundation (Current)
  ├── A-Level Computer Science curriculum
  ├── CCC (Course on Computer Concepts)
  ├── Core Cognitive Engines (Learning, Assessment, Memory, AI, Analytics)
  ├── Google OAuth + JWT authentication
  ├── PWA + offline support
  └── Admin dashboard

V2 — Expansion + Intelligence
  ├── UPSC Prelims · AI · IoT · Cyber Security · Cloud courses
  ├── Redis + Celery notification engine (revision reminders)
  ├── Universal search across all content
  ├── Recommendation Engine (Learning DNA)
  ├── Predictive analytics + adaptive learning paths
  └── Course Plugin System (add courses without code changes)

V3 — Adaptive Operating System
  ├── Knowledge Graph per student
  ├── Full adaptive learning (AI re-sequences content per learner)
  ├── Career Engine (goal-aligned curriculum mapping)
  ├── Peer collaboration + cohort features
  └── Mobile app (React Native)
```

---

## 📚 Developer Documentation

Full technical docs in [`/docs`](./docs/):

| Document | Contents |
|---|---|
| [Architecture Decisions](./docs/ADR.md) | Why specific tech choices were made |
| [API Reference](./docs/API.md) | All endpoints, request/response schemas |
| [Database Schema](./docs/SCHEMA.md) | All 29 tables, relationships, indexes |
| [AI Architecture](./docs/AI.md) | LLM chain, agents, prompt design |
| [Cognitive Engine](./docs/COGNITIVE_ENGINE.md) | SM-2 implementation, analytics formulas |
| [Security Guide](./docs/SECURITY.md) | Auth flows, token lifecycle, hardening |
| [Deployment Guide](./docs/DEPLOYMENT.md) | Render + Vercel + Docker full setup |
| [Contributing Guide](./docs/CONTRIBUTING.md) | Dev workflow, PR standards, code style |

---

## 📄 License

MIT License — see [LICENSE](./LICENSE) for details.

---

*BhartX Academy is built with the belief that every student, regardless of background or resources, deserves a learning system that works as hard as they do.*
