# Villages — Agent Instructions

## Project Overview

AI-powered **community learning platform** for students **and adult learners**. Users form study cohorts ("Villages"), get AI-matched, discuss in forums, take collaborative challenges, interact with the "Village Elder" AI, and use the **Topic Explorer** to turn confusing information into plain language + checklists + next steps.

**Competition context:** Built for an AI competition/hackathon (Brief 1 — community support & understanding). The AI acts as a "Crisis-to-Action Translator" — helping groups understand complex topics together. Human-in-the-loop + responsible AI guardrails throughout.

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
- `supabase/migrations/002_performance_indexes.sql` — 7 indexes for query speed
- `backend/Dockerfile` — for Koyeb deployment
- `run.sh` — script to start both backend + frontend locally
- `AGENTS.md` — This file — instructions for Claude Code
- `run.ps1` — Windows PowerShell native launcher (parallel to `run.sh`)
- `supabase/migrations/003_competition_features.sql` — Group learning + adult learners + topic_explanations + learning_paths
- Competition features added: AI Topic Explorer (plain language + checklists + next steps), AI Learning Paths, adult learner support (interests, learning_style), responsible AI guardrails
- All frontend pages updated: Onboarding (4 steps + adult levels + interests), Profile (interests/learning_style), Home (Topic Explorer), VillageDetail (Learning Path tab + Topic Explain)

## Debug Pass (2026-06-15)

Verified the whole codebase compiles/builds and fixed 6 real bugs. See
`FEATURES.md → Bugs Fixed (Debug Pass — 2026-06-15)` for the full table.

- **Verification:** backend imports clean (`from app.main import app`, all API routes register), frontend `tsc --noEmit` passes, `npm run build` produces a production bundle.
- **Fixed (high):** `users.py create_profile` was dropping `interests`/`learning_style` → now persisted (AI matching + adult-learner feature were degraded).
- **Fixed (high):** `posts.py list_posts` and `villages.py get_village_members` used PostgREST `profiles(...)` embeds with no backing FK → would 400 / show "Unknown". Posts now `select("*")`; members now fetch + merge profiles via a second `.in_()` query.
- **Fixed (high):** `002_performance_indexes.sql` re-added posts/comments to the realtime publication (already in 001) → migration would error & roll back. Removed the duplicate adds.
- **Fixed (med/low):** `api.ts generateChallenge` now URL-encodes params; `vercel.json` API rewrite + Phase 1 docs reconciled from Render → Koyeb (the actual architecture).
- **Still pending (human):** live end-to-end test requires a real Supabase project + Vercel/Koyeb deploy (Phase 1 tasks 1.1–1.9).

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
| `backend/Dockerfile` | Container config for Koyeb deployment |
| `frontend/.env` | Frontend Supabase keys (gitignored) |
| `frontend/vercel.json` | Vercel deploy + API rewrite config |
| `run.ps1` | Windows PowerShell launcher (`.\run.ps1`) |
| `backend/app/models/learning.py` | TopicExplanation + LearningPath models |
| `backend/app/services/ai_service.py` | AI calls (OpenRouter) + explain_topic + generate_learning_path |
| `backend/app/main.py` | FastAPI app entry, CORS config |
| `backend/app/auth.py` | JWT bearer token validation |
| `backend/app/database.py` | Supabase admin client singleton |
| `backend/.env` | Actual keys (gitignored) |
| `backend/Dockerfile` | Container config for Koyeb deployment |
| `frontend/.env` | Frontend Supabase keys (gitignored) |
| `frontend/vercel.json` | Vercel deploy + API rewrite config |
| `supabase/migrations/001_initial_schema.sql` | Database schema + RLS + Realtime |
| `supabase/migrations/002_performance_indexes.sql` | Performance indexes |
| `supabase/migrations/003_competition_features.sql` | Group learning + adult + topic_explanations + learning_paths |

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

Debug log: `villages.log` in the project root — wiped each run, captures all server output.

## Hosting Architecture (Zero-Cost)

```
Users → https://villages.vercel.app
                │
        ┌───────┴───────┐
        │   Vercel       │  ← Frontend (React/Vite)
        │  (free tier)   │     Always-on, global CDN, SSL
        └───────┬───────┘
                │  /api/* → https://villages-xxx.koyeb.app
        ┌───────┴───────┐
        │   Koyeb        │  ← Backend (FastAPI/Python)
        │  (free tier)   │     1 always-on instance, 512MB RAM
        │                │     Scales to zero after 1hr idle
        │                │     → cron-job.org pings every 30min
        └───────┬───────┘
                │  SUPABASE_SERVICE_ROLE_KEY
        ┌───────┴───────┐
        │   Supabase     │  ← Database + Auth + Realtime
        │  (free tier)   │     500MB DB, 50k users, Realtime
        └───────────────┘

Keep-alive: cron-job.org (free, no CC) → pings /health every 30 min
             → Prevents Koyeb scale-to-zero (1hr idle timeout)
             → Also prevents Supabase 7-day project pause
             → ~48 pings/day, well within cron-job.org free tier
```

## Why Koyeb Over Render

| Factor | Render | Koyeb ✅ |
|--------|--------|---------|
| Free forever? | ✅ 750 hrs/mo (enough) | ✅ 1 free instance, truly forever |
| Credit card? | ❌ Not required | ❌ Not required |
| Spin-down | ❌ After 15 min idle | ❌ After 1hr idle (fixable with cron) |
| Python/FastAPI | ✅ Native | ✅ Buildpacks or Docker |
| Free DB | ⚠️ 90-day PostgreSQL | ❌ No free DB (we use Supabase) |
| Git auto-deploy | ✅ | ✅ |
| Global CDN | ❌ Single region | ❌ Single region (Frankfurt/DC) |

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

### Task 1.3: Run Database Migrations (👤 Human)

Run **both** migrations in order in the Supabase SQL Editor:

1. `supabase/migrations/001_initial_schema.sql` — Tables + RLS + Realtime
2. `supabase/migrations/002_performance_indexes.sql` — Indexes for speed

Verify all 6 tables: `profiles`, `villages`, `village_members`, `posts`, `comments`, `challenges`

### Task 1.4: Deploy Frontend to Vercel (⬜ Claude Code + 👤 Human)

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
6. After deploy, Vercel URL is `https://villages-xxx.vercel.app`
7. Tell Claude the URL — Claude updates CORS

### Task 1.5: Deploy Backend to Koyeb (⬜ Claude Code + 👤 Human)

1. Go to https://app.koyeb.com → **Create App**
2. Connect GitHub, select the `Villages` repo
3. Configure:
   - **Name:** `villages-api`
   - **Instance type:** Free (512MB RAM, 0.1 vCPU)
   - **Region:** Frankfurt or Washington DC
   - **Builder:** Dockerfile (uses `backend/Dockerfile` automatically)
   - **Port:** 8080 (matches Dockerfile EXPOSE)
   **OR** use Buildpacks:
   - **Root Directory:** `backend/`
   - **Build Command:** (leave default)
   - **Run Command:** `uvicorn app.main:app --host 0.0.0.0 --port 8000`
4. Add environment variables (all from `backend/.env`):
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_JWT_SECRET`
   - `OPENROUTER_API_KEY`
   - `OPENROUTER_MODEL`
   - `OPENROUTER_MODEL_FALLBACK`
5. Click **Deploy**
6. Wait for build + deploy (first deploy takes 2-5 min)
7. Koyeb URL will be `https://villages-api-<org>.koyeb.app`
8. Tell Claude the URL

### Task 1.6: Update vercel.json with real Koyeb URL (⬜ Claude Code)

Update `frontend/vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://villages-api-<org>.koyeb.app/$1"
    }
  ]
}
```

Then open a PR to merge — Vercel auto-deploys.

### Task 1.7: Update CORS in Backend (⬜ Claude Code)

Update `backend/app/main.py` with the real Vercel URL:

```python
allow_origins=[
    "http://localhost:5173",
    "https://villages-xxx.vercel.app",  # real Vercel URL
    "https://villages.app",             # optional custom domain
],
```

Open a PR → merged → Koyeb auto-deploys.

### Task 1.8: Set Up Keep-Alive Cron Job (👤 Human via Claude walkthrough)

1. Go to https://cron-job.org → **Sign up** (free, no credit card)
2. Create a cron job:
   - **URL:** `https://villages-api-<org>.koyeb.app/health`
   - **Schedule:** Every 30 minutes (prevents both Koyeb 1hr scale-to-zero AND Supabase 7-day inactivity pause)
   - **Save**
3. Tell Claude when done

### Task 1.9: Verify End-to-End (⬜ Claude Code)

After deployment, verify:

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

---

## Custom ("Other") Goals — AI Support

The `goals[]` field on profiles is **free-form text**, not limited to a predefined list. Users can type any custom goal (e.g., "Bar Exam Prep", "Learn Python for Work", "Understand My Child's IEP").

**AI matching already supports this natively** — the `generate_village_match_reasoning()` LLM prompt passes `user_goals` as a comma-separated string. Since the LLM (Llama 3.3 70B or Gemini 2.0 Flash) understands free text, a custom goal like "Pass the Plumbing License Exam" will naturally match to relevant villages.

**No backend changes needed** to add new goal categories. The `goals[]` text array in `profiles` has no CHECK constraint — any string is valid.

**UI behavior:**
- Onboarding step 2 and Profile edit mode both have:
  - Preset toggle chips for common goals
  - A text input + "Add" button for custom goals
  - Custom goals appear as village-colored badges with an × to remove
- Step 2 is **skippable** — the Next button has no `disabled` condition on goals, so users studying nothing specific can pass through
