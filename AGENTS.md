# Villages — Agent Instructions

## Project Overview

AI-powered student community platform. Students form study cohorts ("Villages"), get AI-matched, discuss in forums, take collaborative challenges, and interact with the "Village Elder" AI.

**Stack:** React + Vite (frontend), FastAPI + Python (backend), Supabase (DB + Auth + Realtime), OpenRouter (AI via free `:free` models)

## Completed (by previous agent)

- Full codebase audit + FEATURES.md written as central hub
- Bugs fixed: `main.py` empty input crash, `Profile.tsx` missing edit fields, `PostCard.tsx` empty comment on Enter
- AI provider swapped: Groq → OpenRouter (`call_groq()` → `call_llm()`)
- Primary/fallback model logic: retries with secondary model on HTTP 429
- Zero-cost configured: `:free` model variants only (Llama 3.3 70B + Gemini 2.0 Flash)
- `backend/.env` populated with real keys (Supabase from AI-Teacher project, OpenRouter from AI-Teacher)
- `frontend/.env` populated with Supabase anon key
- `backend/.env.example` reverted to placeholders
- `frontend/vercel.json` added with production API rewrites
- CORS updated in `backend/app/main.py` for Vercel domains
- `supabase/migrations/001_initial_schema.sql` — full DDL + RLS + Realtime ready
- `run.sh` — script to start both backend + frontend locally

## Key Files

| File | Purpose |
|------|---------|
| `FEATURES.md` | Complete project documentation, architecture, master todo list |
| `AGENTS.md` | This file — instructions for Claude Code |
| `run.sh` | Script to run everything locally (`./run.sh`) |
| `backend/app/config.py` | Settings (env vars: Supabase, OpenRouter) |
| `backend/app/services/ai_service.py` | AI calls with primary/fallback model logic |
| `backend/app/main.py` | FastAPI app entry, CORS config |
| `backend/app/auth.py` | JWT bearer token validation |
| `backend/app/database.py` | Supabase admin client singleton |
| `backend/.env` | Actual keys (gitignored) |
| `frontend/.env` | Frontend Supabase keys (gitignored) |
| `frontend/vercel.json` | Vercel deploy + API rewrite config |
| `supabase/migrations/001_initial_schema.sql` | Database schema + RLS + Realtime |

## How to Run Locally

```bash
# One command — installs deps + starts both servers:
./run.sh

# Or manually:
# Terminal 1 — Backend
cd backend && uvicorn app.main:app --reload

# Terminal 2 — Frontend
cd frontend && npm run dev
```

## Hosting Architecture (Zero-Cost)

```
Users → https://villages.vercel.app
                │
        ┌───────┴───────┐
        │   Vercel       │  ← Frontend (React/Vite)
        │  (free tier)   │     Always-on, global CDN, SSL
        └───────┬───────┘
                │  /api/* → https://villages-api.onrender.com
        ┌───────┴───────┐
        │   Render       │  ← Backend (FastAPI/Python)
        │  (free tier)   │     750 hrs/mo, auto-deploy from GitHub
        │                │     Spins down after 15min idle
        │                │     → cron-job.org pings every 14min
        └───────┬───────┘
                │  SUPABASE_SERVICE_ROLE_KEY
        ┌───────┴───────┐
        │   Supabase     │  ← Database + Auth + Realtime
        │  (free tier)   │     500MB DB, 50k users, Realtime
        │                │     → cron-job.org also prevents 7-day pause
        └───────────────┘

Keep-alive: cron-job.org (free) → pings /health every 14 minutes
             → Prevents Render spin-down + Supabase 7-day pause
             → ~90 pings/day, well within free tier
```

## Phase 1 — Launch: Step-by-Step Delegation

### Task 1.1: Create Supabase Project (👤 Human)

1. Go to https://supabase.com/dashboard → **New project**
2. Organization: Use existing or create new (free)
3. Name: `villages`
4. Database password: Save it somewhere
5. Region: Choose closest to your users
6. Wait ~2 min for provisioning
7. Go to **Project Settings → API** and copy:
   - `Project URL`
   - `anon public` key
   - `service_role` key
   - `JWT Secret` (under JWT Settings)
8. **Tell Claude** when done — Claude will update the `.env` files

### Task 1.2: Update .env Files with New Project Keys (⬜ Claude Code)

When the human provides the new Supabase project keys, update:

```bash
# backend/.env
SUPABASE_URL=<new-project-url>
SUPABASE_ANON_KEY=<new-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<new-service-role-key>
SUPABASE_JWT_SECRET=<new-jwt-secret>

# frontend/.env
VITE_SUPABASE_URL=<new-project-url>
VITE_SUPABASE_ANON_KEY=<new-anon-key>
```

### Task 1.3: Run Database Migration (👤 Human)

1. Open Supabase Dashboard → **SQL Editor**
2. Paste the entire contents of `supabase/migrations/001_initial_schema.sql`
3. Click **Run**
4. Verify all 6 tables were created: `profiles`, `villages`, `village_members`, `posts`, `comments`, `challenges`
5. Tell Claude when done

### Task 1.4: Deploy Frontend to Vercel (⬜ Claude Code + 👤 Human)

Steps for Claude to walk the human through:

1. Go to https://vercel.com → **Add New → Project**
2. Import the `Villages` GitHub repo
3. Configure:
   - **Root Directory:** `frontend/`
   - **Framework:** Vite
   - **Build:** `npm run build`
   - **Output:** `dist/`
4. Add environment variables (from `frontend/.env`):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Click **Deploy**
6. After deploy, the Vercel URL will be `https://villages-*.vercel.app`
7. Tell Claude the URL — Claude will update CORS in the backend

### Task 1.5: Deploy Backend to Render (⬜ Claude Code + 👤 Human)

Steps for Claude to walk the human through:

1. Go to https://dashboard.render.com → **New + → Web Service**
2. Connect your GitHub repo
3. Configure:
   - **Name:** `villages-api`
   - **Root Directory:** (leave as repo root, or specify `./`)
   - **Runtime:** Python
   - **Build:** `pip install -r backend/requirements.txt`
   - **Start:** `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables (all from `backend/.env`):
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_JWT_SECRET`
   - `OPENROUTER_API_KEY`
   - `OPENROUTER_MODEL`
   - `OPENROUTER_MODEL_FALLBACK`
5. Click **Deploy Web Service**
6. Wait for build + deploy (first deploy may take 2-5 min)
7. Render URL will be `https://villages-api.onrender.com`
8. Tell Claude the URL

### Task 1.6: Update vercel.json with real Render URL (⬜ Claude Code)

Update `frontend/vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://villages-api.onrender.com/$1"
    }
  ]
}
```

Then open a PR to merge to `main` — Vercel auto-deploys.

### Task 1.7: Update CORS in Backend (⬜ Claude Code)

Update `backend/app/main.py` to include the real Vercel URL:

```python
allow_origins=[
    "http://localhost:5173",
    "https://villages-xxx.vercel.app",  # ← real Vercel URL
    "https://villages.app",             # ← custom domain (optional)
],
```

Open a PR → merged → Render auto-deploys.

### Task 1.8: Set Up Keep-Alive Cron Job (👤 Human via Claude walkthrough)

1. Go to https://cron-job.org → **Sign up** (free, no CC)
2. Create a cron job:
   - **URL:** `https://villages-api.onrender.com/health`
   - **Schedule:** Every 5 minutes
   - **Save**
3. This prevents:
   - Render free tier spin-down (15 min idle)
   - Supabase free project pause (7 days idle)
4. Tell Claude when done

### Task 1.9: Verify End-to-End (⬜ Claude Code)

After everything is deployed, verify:

1. Visit `https://villages-xxx.vercel.app` — Login page loads
2. Enter email → Magic link sent
3. Click magic link → Onboarding flow works
4. Create profile → AI matching works
5. Create/join village → Discussion works
6. Post a message → Real-time subscription works
7. Upvote → Counter updates
8. "Ask Village Elder" → AI generates a discussion prompt
9. "Challenge" → AI generates a challenge
10. Profile edit → Save works
11. Sign out → Sign back in works

Log any issues found.

### Task 1.10: Buy Domain + Point DNS (👤 Human, Optional)

1. Buy a domain (e.g. `villages.app`) from Cloudflare, Namecheap, etc.
2. In Vercel dashboard → Project → Domains → Add `villages.app`
3. Point DNS to Vercel nameservers
4. Update CORS in `backend/app/main.py` to include `https://villages.app`
5. Update `frontend/vercel.json` to use custom domain if needed

---

## Phase 2+ — Feature Work (⬜ Claude Code)

After launch, work through the FEATURES.md master checklist:

| Priority | Task | Files |
|----------|------|-------|
| P1 | Notifications system | Schema + API + frontend badge |
| P1 | Post pagination | `VillageDetail.tsx`, `Forum.tsx` |
| P1 | AI Village Elder replies | `backend/app/api/routes/ai.py` |
| P1 | Challenge completion button | `VillageDetail.tsx` + backend route |
| P1 | Profile avatar upload | `Profile.tsx` + Supabase Storage |
| P1 | Mobile responsive nav | `Layout.tsx` |
| P2 | TypeScript lint | `frontend/` eslint config |
| P2 | Backend tests | `backend/tests/` |
| P2 | Rate limiting on AI | `backend/app/api/routes/ai.py` |
| P2 | Cache AI responses | `ai_service.py` |
| P2 | CI/CD pipeline | `.github/workflows/` |

---

## OpenRouter Free Tier Limits

- 50 requests/day (no credit card needed)
- 20 requests/minute
- 28+ free models with `:free` suffix
- Current models: `meta-llama/llama-3.3-70b-instruct:free` (primary), `google/gemini-2.0-flash-exp:free` (fallback)
