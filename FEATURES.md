# Villages — AI-Powered Student Community Platform

## Overview

**Villages** is a web platform where students form small study cohorts ("Villages") powered by AI facilitation. Students create profiles, get AI-matched to a Village, participate in discussion forums, take on collaborative challenges, and interact with the "Village Elder" AI.

---

## Architecture

```
┌────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)             │
│  localhost:5173                                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │  Home    │ │ Villages │ │  Forum   │ │ Profile  │ │
│  │  Page    │ │  Page    │ │  Page    │ │  Page    │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐ │
│  │Onboarding│ │Village   │ │  Components:         │ │
│  │          │ │Detail    │ │  Layout, PostCard,   │ │
│  └──────────┘ └──────────┘ │  VillageCard, Login  │ │
│                            └──────────────────────┘ │
│  ┌──────────────────────────────────────────────┐    │
│  │  api.ts (HTTP client → /api/*)               │    │
│  │  supabase.ts (Supabase client, auth + realtime)│  │
│  └──────────────────────────────────────────────┘    │
└───────────────────────┬────────────────────────────┘
                        │ proxy: /api → localhost:8000
                        │ (Vite dev proxy)
┌───────────────────────▼────────────────────────────┐
│               Backend (FastAPI + Uvicorn)           │
│  localhost:8000                                    │
│  ┌────────────┐ ┌────────────┐ ┌────────────────┐ │
│  │  /users/*  │ │/villages/*│ │  /posts/*      │ │
│  │  profile   │ │ CRUD, join│ │  CRUD, upvote, │ │
│  │  CRUD      │ │ AI match  │ │  comments      │ │
│  └────────────┘ └────────────┘ └────────────────┘ │
│  ┌────────────┐ ┌────────────────────────────────┐ │
│  │  /ai/*     │ │  Services:                     │ │
│  │  Elder     │ │  ai_service.py (Groq API)      │ │
│  │  Challenge │ │  auth.py (JWT verification)    │ │
│  └────────────┘ │  database.py (Supabase client) │ │
│                 └────────────────────────────────┘ │
└───────────────────────┬────────────────────────────┘
                        │ service_role_key (bypasses RLS)
┌───────────────────────▼────────────────────────────┐
│              Supabase (PostgreSQL + Auth)           │
│  Tables: profiles, villages, village_members,       │
│          posts, comments, challenges                │
│  Realtime enabled on: posts, comments               │
│  Row Level Security with policies                   │
│  Auth: Magic link email OTP                         │
└────────────────────────────────────────────────────┘
```

---

## Features

### 1. Authentication (Magic Link)

- **File:** `frontend/src/pages/Login.tsx`, `backend/app/auth.py`
- **How it works:** Users enter their email → Supabase Auth sends a magic link → clicking the link creates/validates a session → the JWT is stored in the Supabase client.
- **Backend auth extraction:** `auth.py` reads the `Authorization: Bearer <token>` header, decodes it with `jose.jwt` using `supabase_jwt_secret`, and returns the `sub` (user UUID).
- **Protected routes:** All mutation endpoints use `Depends(get_current_user)`.

### 2. Onboarding / Profile Creation

- **File:** `frontend/src/pages/Onboarding.tsx`, `backend/app/api/routes/users.py`
- **3-step flow:**
  1. **Basic info:** Display name + academic level (dropdown: Middle School → College Freshman)
  2. **Goals:** Multi-select from 11 common goals (SAT Math, AP Calculus, College Essays, etc.)
  3. **Strengths & Weaknesses:** Same goal list color-coded green (strengths) / red (needs help)
- **API:** `POST /users/profile` → upserts into `public.profiles` table.
- **Auto-redirect:** If a user has no profile, `Home.tsx` catches the 404 and redirects to `/onboarding`.

### 3. AI Village Matching

- **File:** `frontend/src/pages/Home.tsx:42-52`, `backend/app/api/routes/villages.py:22-39`, `backend/app/services/ai_service.py:34-67`
- **Trigger:** "AI Match me" button on the Home page when the user has no Village.
- **Backend flow:**
  1. Fetches the user's profile (goals, strengths, weaknesses, academic_level)
  2. Fetches all active villages with available slots
  3. Calls Groq API (LLM) with a system prompt describing the matching task
  4. Returns `{ village_id, reasoning }` explaining the match
- **Prompt engineering:** The system prompt tells the model to act as an "AI matching system" and respond with JSON only.

### 4. Village CRUD & Discovery

- **File:** `frontend/src/pages/Villages.tsx`, `backend/app/api/routes/villages.py`
- **List all villages:** `GET /villages` with optional `focus_area` filter
- **Search:** Client-side filtering by name or focus area
- **Create village:** Expandable form with name, description, focus_area, resources (comma-separated)
  - Creator is auto-joined as `role: "chief"`
  - Creator's profile is updated with `village_id`
- **Join village:** "Join" button on each card, checks capacity (`member_count < max_members`), prevents duplicates
- **Grid layout:** Responsive 1/2/3-column grid of `VillageCard` components

### 5. Village Detail & Real-time Discussion

- **File:** `frontend/src/pages/VillageDetail.tsx`
- **Header:** Village name, description, focus area badge, member count, resources, live status indicator
- **Tabs:** "Discussion" and "Members"
- **Discussion tab:**
  - Post textarea with "Post" button
  - Sort by most recent (API orders by `created_at DESC`)
  - **Realtime:** Supabase Realtime subscription on `posts` table filtered by `village_id=eq.{id}` — new posts appear instantly without refresh
  - Deduplication via `postIdsRef` Set
- **Members tab:** List of members with avatar initials, display name, academic level, role badge
- **Village Elder button:** See AI features below

### 6. Global Forum

- **File:** `frontend/src/pages/Forum.tsx`
- **Scope:** Posts where `village_id IS NULL` (global, not scoped to any village)
- **Realtime:** Same as village detail but for all posts (client-side filters out village-scoped posts)
- **Live indicator:** Green "Live" badge when Realtime subscription is active

### 7. Post & Comment System

- **File:** `frontend/src/components/PostCard.tsx`, `backend/app/api/routes/posts.py`
- **Post features:**
  - Author name + avatar initial (Village Elder gets bot icon)
  - Content display with `whitespace-pre-wrap`
  - Upvote button with live count update
  - Date display
  - AI-generated posts highlighted with village-colored border and background
- **Comment features:**
  - Toggle comments section
  - Load comments from API on first open
  - Inline add comment with Enter key support
  - Each comment shows author initial, name, and content
- **Content moderation:** Each post and comment is sent through `moderate_content` AI service before saving

### 8. AI Village Elder (Discussion Prompts)

- **File:** `frontend/src/pages/VillageDetail.tsx:70-92`, `backend/app/api/routes/ai.py:11-34`, `backend/app/services/ai_service.py:70-84`
- **Trigger:** "Ask Village Elder" button
- **Flow:**
  1. Backend fetches village data (name, focus_area, resources)
  2. Calls Groq API with an "AI facilitator" prompt
  3. Creates a new post in the village with `author_id: "village-elder-ai"` and `is_ai_generated: true`
  4. The post appears in real-time in the discussion feed
- **System prompt:** The model is asked to generate "a short, engaging discussion prompt (2-3 sentences)" — warm, encouraging, academically focused

### 9. AI Study Challenges

- **File:** `frontend/src/pages/VillageDetail.tsx:94-106`, `backend/app/api/routes/ai.py:37-68`, `backend/app/services/ai_service.py:87-104`
- **Trigger:** User types a subject and clicks "Challenge"
- **Flow:**
  1. Backend fetches village name + member count
  2. Calls Groq API with a "collaborative challenge" prompt
  3. Parses JSON response: `{ title, description, steps[] }`
  4. Inserts into `public.challenges` table
- **Difficulty levels:** Defaults to "medium", supports easy/medium/hard

### 10. AI Content Moderation

- **File:** `backend/app/services/ai_service.py:107-114`
- **Applied to:** All posts and comments before insert
- **Flow:**
  1. Content is sent to Groq API with a moderation system prompt
  2. Response: `{ safe: boolean, reason: string }`
  3. If `safe === false`, the API returns HTTP 400 with the moderation reason
- **Prompt:** "You are a content moderator for a student platform (ages 13-18)"

### 11. Profile Management

- **File:** `frontend/src/pages/Profile.tsx`, `backend/app/api/routes/users.py:38-47`
- **View:** Avatar initial, email, academic level, goals badges
- **Edit (inline):** Display name, academic level, goals, strengths, weaknesses — all using the same toggle-chip UI as onboarding
- **Sign out:** Button calls `supabase.auth.signOut()`
- **API:** `PATCH /users/profile` updates only provided fields (`model_dump(exclude_none=True)`)

### 12. Supabase Realtime

- **Enabled tables (SQL):** `posts`, `comments`
- **Frontend channels:**
  - `village-posts-{id}` — filtered to specific village
  - `global-forum-posts` — all posts, client-filtered for `village_id IS NULL`
- **Deduplication:** `postIdsRef` (a `useRef<Set<string>>`) prevents duplicate inserts from stale subscription callbacks

### 13. Row-Level Security (Supabase)

- **File:** `supabase/migrations/001_initial_schema.sql`
- **All tables have RLS enabled** with selective policies:
  - `profiles`: everyone can view, users can update/insert their own
  - `villages`: everyone can view, authenticated users can create
  - `posts`: everyone can view, authenticated users (or `village-elder-ai`) can insert
  - `comments`: everyone can view, authenticated users can insert
  - `challenges`: everyone can view
  - `village_members`: everyone can view, users can insert their own membership
- **Service role key:** The backend uses `supabase_service_role_key` which bypasses all RLS, acting as a trusted intermediary.

### 14. Root CLI Utility

- **File:** `main.py`
- **Purpose:** Standalone command-line interface for quick village data lookup
- **Commands:**
  - `list` — Show hardcoded villages (AlphaVillage, BetaHamlet, GammaTown)
  - `get <name>` — Show population + resources for a village
  - `exit` — Quit

---

## Database Schema (Supabase / PostgreSQL)

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `profiles` | Student profiles | `id` (FK auth.users), `display_name`, `academic_level`, `goals[]`, `strengths[]`, `weaknesses[]`, `village_id` |
| `villages` | Study cohorts | `name`, `description`, `focus_area`, `resources[]`, `max_members`, `member_count`, `created_by` |
| `village_members` | Many-to-many | `user_id`, `village_id`, `role` (member/chief) |
| `posts` | Discussions | `content`, `author_id`, `author_name`, `village_id` (nullable=global), `is_ai_generated`, `upvotes` |
| `comments` | Post comments | `post_id`, `content`, `author_id`, `author_name`, `is_ai_generated` |
| `challenges` | Collaborative challenges | `village_id`, `title`, `description`, `subject`, `difficulty`, `completed_by[]` |

---

## Dependencies

### Backend (`backend/requirements.txt`)

| Package | Version | Purpose |
|---------|---------|---------|
| `fastapi` | 0.115.0 | Web framework for the REST API |
| `uvicorn[standard]` | 0.30.6 | ASGI server |
| `supabase` | 2.7.4 | Supabase PostgreSQL client (admin access via service_role_key) |
| `python-dotenv` | 1.0.1 | Load `.env` file |
| `httpx` | 0.27.2 | Async HTTP client (for Groq API calls) |
| `pydantic` | 2.9.2 | Data validation / settings management |
| `pydantic-settings` | 2.5.2 | `.env` → `Settings` class binding |
| `python-jose[cryptography]` | 3.3.0 | JWT token decoding for auth |
| `passlib[bcrypt]` | 1.7.4 | Password hashing (unused — auth is magic-link only) |
| `python-multipart` | 0.0.12 | Form data parsing (required by FastAPI internals) |

### Frontend (`frontend/package.json`)

| Package | Version | Purpose |
|---------|---------|---------|
| **Production** | | |
| `@supabase/supabase-js` | ^2.45.0 | Supabase client (auth session + realtime subscriptions) |
| `react` | ^18.3.1 | UI library |
| `react-dom` | ^18.3.1 | React DOM renderer |
| `react-router-dom` | ^6.26.2 | Client-side routing |
| `react-hot-toast` | ^2.4.1 | Toast notifications |
| `lucide-react` | ^0.441.0 | Icon library |
| **Dev** | | |
| `@types/react` | ^18.3.5 | TypeScript types for React |
| `@types/react-dom` | ^18.3.0 | TypeScript types for ReactDOM |
| `@vitejs/plugin-react` | ^4.3.1 | Vite React plugin (HMR, JSX transform) |
| `autoprefixer` | ^10.4.20 | PostCSS plugin for vendor prefixes |
| `postcss` | ^8.4.47 | CSS post-processor |
| `tailwindcss` | ^3.4.11 | Utility-first CSS framework |
| `typescript` | ^5.5.3 | Type checking |
| `vite` | ^5.4.6 | Build tool and dev server |

### Infrastructure (External)

| Service | Purpose | Configuration |
|---------|---------|---------------|
| **Supabase** | PostgreSQL database, Auth (magic link), Realtime | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET` |
| **OpenRouter** | LLM inference via free-tier `:free` models — $0 cost | `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` |

---

## Bugs Fixed (This Session)

| # | File | Issue | Fix |
|---|------|-------|-----|
| 1 | `main.py:22` | Empty input at CLI prompt crashed with `IndexError` (`.split()` returns `[]`, then `command[0]` fails) | Added `if not raw: continue` guard and try/except for `KeyboardInterrupt`/`EOFError` |
| 2 | `Profile.tsx` | `academic_level`, `strengths`, and `weaknesses` were not editable in the profile edit UI | Added `academic_level` select dropdown, strengths/weaknesses toggle-chip grids to the edit form |
| 3 | `Profile.tsx:85` | `toggleGoal` was removed but still referenced in edit mode | Replaced `toggleGoal` with the generic `toggleItem('goals', g)` |
| 4 | `PostCard.tsx:103` | Pressing Enter in the comment input could submit an empty/whitespace-only comment | Added `newComment.trim()` guard before `submitComment()` |

---

## Project Structure

```
Villages/
├── main.py                          # CLI utility (standalone)
├── FEATURES.md                      # This file
├── .gitignore
│
├── backend/
│   ├── requirements.txt
│   ├── .env.example
│   └── app/
│       ├── __init__.py
│       ├── main.py                  # FastAPI app entry point
│       ├── config.py                # Settings from .env
│       ├── database.py              # Supabase client singleton
│       ├── auth.py                  # JWT bearer token validation
│       ├── models/
│       │   ├── __init__.py
│       │   ├── user.py              # UserProfile, Create, Update
│       │   ├── village.py           # Village, VillageCreate, VillageMember
│       │   ├── post.py              # Post, PostCreate, Comment, CommentCreate
│       │   └── challenge.py         # Challenge, ChallengeCreate
│       ├── api/
│       │   ├── __init__.py
│       │   └── routes/
│       │       ├── __init__.py
│       │       ├── users.py         # Profile CRUD
│       │       ├── villages.py      # Village CRUD, join, AI match
│       │       ├── posts.py         # Post CRUD, upvote, comments
│       │       └── ai.py            # Village Elder prompts, challenges
│       └── services/
│           ├── __init__.py
│           └── ai_service.py        # Groq API integration
│
├── frontend/
│   ├── package.json
│   ├── index.html
│   ├── vite.config.ts               # Vite config + /api proxy
│   ├── tailwind.config.js           # Custom village color palette
│   ├── postcss.config.js
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── .env.example
│   ├── public/
│   │   └── village-icon.svg
│   └── src/
│       ├── main.tsx                 # React entry point
│       ├── index.css                # Tailwind + custom utility classes
│       ├── App.tsx                  # Auth gate + routing
│       ├── types/
│       │   └── index.ts            # TypeScript interfaces
│       ├── lib/
│       │   ├── supabase.ts         # Supabase client
│       │   └── api.ts             # Typed HTTP client for all endpoints
│       ├── components/
│       │   ├── Layout.tsx          # App shell (header + sidebar + main)
│       │   ├── VillageCard.tsx     # Village preview card
│       │   └── PostCard.tsx        # Post display + comments
│       └── pages/
│           ├── Login.tsx            # Magic link login
│           ├── Home.tsx             # Dashboard (village status + activity)
│           ├── Villages.tsx         # Browse/search/create villages
│           ├── VillageDetail.tsx    # Village discussion + members
│           ├── Forum.tsx            # Global forum
│           ├── Profile.tsx          # View/edit profile
│           └── Onboarding.tsx       # 3-step profile setup
│
└── supabase/
    └── migrations/
        └── 001_initial_schema.sql   # Full DDL + RLS policies + realtime
```

---

## How to Run

### Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate     # Windows
pip install -r requirements.txt
cp .env.example .env       # Fill in your Supabase & Groq credentials
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env       # Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev                # Starts on localhost:5173
```

### Supabase Migration
```sql
-- Run 001_initial_schema.sql in the Supabase SQL Editor
```

---

## API Token Reuse from AI-Teacher (`../AI-Teacher/`)

The sibling `AI-Teacher` project (PrepForge AI) already has a fully configured **Supabase** instance with live API keys. These can be shared with Villages since both projects use separate tables.

### Reusable Credentials (found in `AI-Teacher/.env.local`)

| Variable | Value | Reuse for Villages? |
|----------|-------|---------------------|
| `OPENROUTER_API_KEY` | `sk-or-v1-28cf25bb...` | **Yes** — already swapped in! Backend now uses OpenRouter instead of Groq |
| `Clerk keys` | `pk_test_...` / `sk_test_...` | **No** — Villages uses Supabase Auth (magic link), not Clerk |
| Supabase keys | from AI-Teacher project | **Probably not** — separate Supabase project recommended (see below) |

### Supabase Sharing Strategy

Both projects can coexist on the same Supabase instance because they use **different table names**:

| AI-Teacher (PrepForge) Tables | Villages Tables |
|-------------------------------|-----------------|
| `profiles` | `profiles` ⚠️ **CONFLICT** |
| `questions` | `villages` |
| `attempts` | `village_members` |
| `essay_grades` | `posts` |
| `flags` | `comments` |
| | `challenges` |

**⚠️ Conflict:** Both projects use a `profiles` table but with different schemas.

**Recommendation: Create a separate Supabase project for Villages.** Supabase's free plan allows **2 active projects** per organization at no cost. A separate project avoids the schema conflict entirely and keeps the two apps isolated.

| Factor | Shared Project | Separate Project ✅ |
|--------|---------------|-------------------|
| Schema conflict | Must rename or merge `profiles` table | None — independent tables |
| Free tier cost | $0 | $0 (2 free projects allowed) |
| DB space | Shares 500MB with AI-Teacher | Gets its own 500MB allocation |
| Auth isolation | Same auth.users (shared logins) | Separate auth, separate users |
| Management | One project to monitor | Two projects to monitor |
| Risk isolation | One hits limit → both affected | Each is independent |
| Supabase quota | 500MB DB, 50k MAU, 5GB egress **shared** across org | Same org-level cap, but less contention |

**How to create:** Supabase Dashboard → New Project → Name it `villages` → Choose region → Database password → Create. Then run `supabase/migrations/001_initial_schema.sql` in the SQL Editor.

**⚠️ Free tier gotcha:** Supabase pauses free projects after **1 week of inactivity**. To keep Villages online 24/7, you'll need to either:
- Use a **cron job** (e.g., GitHub Actions every 3 days, or cron-job.org free tier) to hit the `/health` endpoint and keep the project alive
- Or upgrade to Pro ($25/mo, no pausing) — **not needed until you exceed free limits**

### AI Provider: Swapped from Groq → OpenRouter ✅

Villages **originally** used Groq (`groq_api_key` in config). This has been swapped to **OpenRouter** to reuse the existing key from AI-Teacher:

| Change | File |
|--------|------|
| `groq_api_key` → `openrouter_api_key` | `backend/app/config.py` |
| `groq_model` → `openrouter_model` | `backend/app/config.py` |
| `call_groq()` → `call_llm()` targeting `https://openrouter.ai/api/v1/chat/completions` | `backend/app/services/ai_service.py` |
| Added `HTTP-Referer` + `X-Title` headers (required by OpenRouter) | `backend/app/services/ai_service.py` |
| `.env.example` updated with actual keys | `backend/.env.example` |

OpenRouter gives access to **200+ models** through one key — more flexible than Groq alone. This project strictly uses **free-tier `:free` variants** so there are **zero API costs**.

**Zero cost — free models only:** All AI inference uses OpenRouter's **`:free`** model variants, which cost **$0 per token**. No API credits needed.

**Model fallback:** The service tries the **primary model** first (`meta-llama/llama-3.3-70b-instruct:free`). If OpenRouter returns HTTP 429 (rate limited), it automatically falls back to the **secondary model** (`google/gemini-2.0-flash-exp:free` — different provider, unlikely to hit the same rate limit). This ensures AI features remain available even when one model is throttled.

Configured via:
- `OPENROUTER_MODEL` — primary model (first choice, `:free` variant)
- `OPENROUTER_MODEL_FALLBACK` — fallback model (used on 429, `:free` variant)

**OpenRouter Free Tier Limits (as of June 2026):**
| Limit | Value |
|-------|-------|
| Requests per day | 50 (free acct, no credit card needed) |
| Requests per minute | 20 |
| Free models available | 28+ (Llama 3.3 70B, Gemini Flash, DeepSeek R1, Qwen3 Coder, etc.) |
| Context window | Up to 10M tokens (Llama 4 Scout) |
| Credit card required? | No |

---

## Deployment Plan (24/7 Online Hosting)

### Architecture Overview

```
Users → https://villages.yourdomain.com
                │
        ┌───────┴───────┐
        │   Vercel      │  ← Frontend (React + Vite, static build)
        │  (free tier)  │
        └───────┬───────┘
                │  proxy /api/* → backend
        ┌───────┴───────┐
        │   Render /    │  ← Backend (FastAPI, Python)
        │   Railway     │     or DigitalOcean App Platform
        └───────┬───────┘
                │  service_role_key
        ┌───────┴───────┐
        │   Supabase    │  ← Database + Auth + Realtime
        │  (free tier)  │     (shared with AI-Teacher or separate)
        └───────────────┘
```

### Option 1: Vercel (Frontend) + Render (Backend) + Supabase (DB) — **Recommended**

| Component | Service | Free Tier | Config |
|-----------|---------|-----------|--------|
| **Frontend** (React) | **Vercel** | 100GB bandwidth, 6000 build mins/mo | Connect GitHub repo, set `FRAMEWORK=Vite`, build command `npm run build`, output `dist/` |
| **Backend** (FastAPI) | **Render** | 750 hrs/mo (always-on), 512MB RAM | Use Render Web Service, start command `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| **Database** | **Supabase** | 500MB DB, 2GB bandwidth, 50k users | Already exists (`ooarycauxwefmxdlpxvc.supabase.co`) or create new |
| **AI** | **OpenRouter (free models)** | 28+ free models (`:free` suffix), 50 req/day, 20 RPM | `OPENROUTER_API_KEY` already configured |

#### Step-by-Step

**1. Frontend → Vercel**
```bash
# Connect your GitHub repo to Vercel
# Settings:
#   Framework: Vite
#   Build: npm run build
#   Output: dist/
#   Root: frontend/
# Environment variables (from frontend/.env.example):
#   VITE_SUPABASE_URL=https://ooarycauxwefmxdlpxvc.supabase.co
#   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

**2. Backend → Render**
```bash
# Create a Web Service on Render
#   Root: ./ (or backend/)
#   Build: pip install -r backend/requirements.txt
#   Start: cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT
# Environment variables (from backend/.env.example):
#   SUPABASE_URL=https://ooarycauxwefmxdlpxvc.supabase.co
#   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
#   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
#   SUPABASE_JWT_SECRET=<get from Supabase Dashboard>
#   OPENROUTER_API_KEY=sk-or-v1-28cf25bb...
```

**3. Update Vite proxy for production**
```typescript
// frontend/vite.config.ts — proxy only needed for local dev
// In production, Vercel rewrites handle /api → backend URL
```
Add a `vercel.json` to `frontend/`:
```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://villages-api.onrender.com/$1" }
  ]
}
```

**4. Run Supabase migration**
```sql
-- Run 001_initial_schema.sql in the Supabase SQL Editor
-- on your chosen Supabase project
```

### Option 2: All-in-One — Railway

Railway can host the frontend (static), backend (Docker/Python), and even run PostgreSQL. But Supabase's free tier (with auth + realtime built in) is hard to beat.

### Option 3: DigitalOcean App Platform

Similar to Render — supports static sites + Python services with free-tier credits.

### Environment Variables Checklist

Create these in your hosting dashboards:

| File | Variable | Source |
|------|----------|--------|
| Backend | `SUPABASE_URL` | Supabase Project Settings → API |
| Backend | `SUPABASE_ANON_KEY` | Supabase Project Settings → API |
| Backend | `SUPABASE_SERVICE_ROLE_KEY` | Supabase Project Settings → API |
| Backend | `SUPABASE_JWT_SECRET` | Supabase Dashboard → Settings → API → JWT Settings |
| Backend | `OPENROUTER_API_KEY` | Already in `AI-Teacher/.env.local` |
| Backend | `OPENROUTER_MODEL` | `meta-llama/llama-3.3-70b-instruct:free` (primary) |
| Backend | `OPENROUTER_MODEL_FALLBACK` | `google/gemini-2.0-flash-exp:free` (fallback on 429) |
| Frontend | `VITE_SUPABASE_URL` | Same as backend `SUPABASE_URL` |
| Frontend | `VITE_SUPABASE_ANON_KEY` | Same as backend `SUPABASE_ANON_KEY` |

### Domain Setup

- Buy a domain (e.g. `villages.app`) from Cloudflare, Namecheap, etc.
- Point DNS to Vercel (CNAME `cname.vercel-dns.com` or use Vercel's nameservers)
- Vercel handles SSL automatically (Let's Encrypt)
- Backend gets a subdomain: `api.villages.app` → Render/Railway

---

## Master Project Checklist

**Legend:** ✅ Done | ⬜ Needs Claude Code (AI agent) | 👤 Needs human action (create accounts, click buttons)

### Phase 0 — Foundation ✅ (Completed by AI)

| # | Status | Task | Details |
|---|--------|------|---------|
| 0.1 | ✅ | Explore codebase & document all features | `FEATURES.md` written — central hub for all project info |
| 0.2 | ✅ | Fix bugs: `main.py` crash on empty input | Added empty-input guard + KeyboardInterrupt handler |
| 0.3 | ✅ | Fix bugs: `Profile.tsx` missing edit fields | Added `academic_level`, `strengths`, `weaknesses` to profile edit UI |
| 0.4 | ✅ | Fix bugs: `PostCard.tsx` empty comment on Enter | Added `trim()` guard before submit |
| 0.5 | ✅ | Swap AI provider Groq → OpenRouter | `config.py`, `ai_service.py`, `backend/.env`, `backend/.env.example` |
| 0.6 | ✅ | Add primary + fallback AI models | On HTTP 429, auto-fallback to secondary model |
| 0.7 | ✅ | Ensure $0 cost — use `:free` OpenRouter models | `meta-llama/llama-3.3-70b-instruct:free` + `google/gemini-2.0-flash-exp:free` |
| 0.8 | ✅ | Populate `backend/.env` with real keys | Supabase (AI-Teacher project, temporary) + OpenRouter from AI-Teacher |
| 0.9 | ✅ | Populate `frontend/.env` with real keys | Supabase anon key for frontend client |
| 0.10 | ✅ | Revert `backend/.env.example` to placeholders | Real keys were in `.env.example` — moved to `.env` (gitignored) |
| 0.11 | ✅ | Add `frontend/vercel.json` | Production API proxy rewrites |
| 0.12 | ✅ | Update CORS for production domains | `backend/app/main.py` — added Vercel domains |

### Phase 1 — Launch Prep (⬜ Claude Code + 👤 Human)

| # | Status | Task | Who | Details |
|---|--------|------|-----|---------|
| 1.1 | ⬜ | **Create separate Supabase project for Villages** | 👤 **Human** | Go to https://supabase.com/dashboard → New Project → Name `villages` → Note the new URL + anon key + service_role key + JWT secret |
| 1.2 | ⬜ | **Update `.env` files with new Supabase project keys** | ⬜ Claude | Replace backend `.env` + frontend `.env` with keys from the new Villages Supabase project |
| 1.3 | ⬜ | **Get Supabase JWT secret & update backend `.env`** | 👤 **Human** | Supabase Dashboard → Settings → API → JWT Settings → Copy `SUPABASE_JWT_SECRET` |
| 1.4 | ⬜ | **Run `001_initial_schema.sql`** | 👤 **Human** | Supabase SQL Editor → paste the migration → Run. Creates all 6 tables + RLS + Realtime |
| 1.5 | ⬜ | **Deploy frontend to Vercel** | 👤 **Human** | Connect GitHub repo → Vite preset → Root `frontend/` → Set env vars from `frontend/.env` → Deploy |
| 1.6 | ⬜ | **Deploy backend to Render** | 👤 **Human** | Web Service → Python → Start command: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT` → Set env vars from `backend/.env` → Deploy |
| 1.7 | ⬜ | **Update vercel.json with real Render URL** | ⬜ Claude | After Render deploy, update `frontend/vercel.json` destination URL |
| 1.8 | ⬜ | **Set up keep-alive cron job** | 👤 **Human** | Use cron-job.org (free): ping `https://villages-api.onrender.com/health` every 5 min to prevent Render sleep + Supabase project pause |
| 1.9 | ⬜ | **Verify full flow works end-to-end** | ⬜ Claude | Test: sign up → onboarding → create/join village → post → AI match → Village Elder → challenge |
| 1.10 | ⬜ | **Buy domain & point DNS** | 👤 **Human** | Optional: purchase domain → point to Vercel → update CORS in backend |

### Phase 2 — Feature Completion (⬜ Claude Code)

| # | Status | Task | Files | Notes |
|---|--------|------|-------|-------|
| 2.1 | ⬜ | **Notifications system** — `unread_count` or notifications table | Schema + API + frontend badge | Required for engagement |
| 2.2 | ⬜ | **Post pagination** — infinite scroll or "Load more" | `VillageDetail.tsx`, `Forum.tsx` | Currently loads all posts at once |
| 2.3 | ⬜ | **AI Village Elder replies** — Elder can comment on posts | `backend/app/api/routes/ai.py` | Completes the AI facilitation loop |
| 2.4 | ⬜ | **Challenge completion** — "Mark as done" button | `VillageDetail.tsx`, backend route | Challenges exist but can't complete |
| 2.5 | ⬜ | **Profile avatar upload** via Supabase Storage | `Profile.tsx`, Supabase bucket | Currently just shows initials |
| 2.6 | ⬜ | **Mobile responsive nav** — sidebar collapses to bottom tabs | `Layout.tsx` | Current sidebar wastes space on mobile |

### Phase 3 — Quality & Scale (⬜ Claude Code)

| # | Status | Task | Files | Notes |
|---|--------|------|-------|-------|
| 3.1 | ⬜ | **Add TypeScript lint** — eslint config | `frontend/package.json` | Currently no linting |
| 3.2 | ⬜ | **Backend tests** — pytest + httpx async | `backend/tests/` | Zero test coverage |
| 3.3 | ⬜ | **Rate limiting** on AI endpoints | `backend/app/api/routes/ai.py` | Prevent API key abuse |
| 3.4 | ⬜ | **Cache AI responses** in DB | `ai_service.py` | Store elder prompts, deduplicate |
| 3.5 | ⬜ | **CI/CD pipeline** — GitHub Actions | `.github/workflows/` | Auto-test + auto-deploy on push |
| 3.6 | ⬜ | **Error monitoring** — Sentry integration | Backend + Frontend | Catch production errors |

### Phase 4 — Future Growth (⬜ Claude Code)

| # | Status | Task | Notes |
|---|--------|------|-------|
| 4.1 | ⬜ | Study resource upload (PDFs, links) per village | Supabase Storage |
| 4.2 | ⬜ | Scheduled study sessions / calendar | Time-based coordination |
| 4.3 | ⬜ | Gamification — XP, levels, leaderboards | Engagement |
| 4.4 | ⬜ | Private messaging between members | Communication |
| 4.5 | ⬜ | Video/voice chat (Daily.co, LiveKit) | Real-time study rooms |
| 4.6 | ⬜ | Admin dashboard | Moderation |
| 4.7 | ⬜ | Mobile app (React Native / Expo) | Broader reach |
