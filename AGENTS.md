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
- `backend/Dockerfile` — legacy (Koyeb plan); superseded by Vercel serverless, kept for portability
- `backend/api/index.py` + `backend/vercel.json` — Vercel `@vercel/python` backend deploy (LIVE at villages-api.vercel.app)
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
- **Fixed (med/low):** `api.ts generateChallenge` now URL-encodes params; `vercel.json` API rewrite reconciled with the deployment architecture.
- **Deployed (2026-06-15):** frontend → `villages.vercel.app` project (https://villages-eight.vercel.app); backend → Vercel `@vercel/python` (https://villages-api.vercel.app). Live proxy verified (`/api/health` → 200). **Still pending:** full UX walkthrough against a dedicated Supabase project.

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
| `backend/Dockerfile` | Legacy container config (Koyeb plan) — **not used** by the Vercel deployment |
| `backend/api/index.py` | Vercel `@vercel/python` entrypoint — re-exports FastAPI `app` |
| `backend/vercel.json` | Vercel Python build + route config for the backend |
| `frontend/.env` | Frontend Supabase keys (gitignored) |
| `frontend/vercel.json` | Vercel deploy + API rewrite config |
| `run.ps1` | Windows PowerShell launcher (`.\run.ps1`) |
| `backend/app/models/learning.py` | TopicExplanation + LearningPath models |
| `backend/app/services/ai_service.py` | AI calls (OpenRouter) + explain_topic + generate_learning_path |
| `backend/app/main.py` | FastAPI app entry, CORS config |
| `backend/app/auth.py` | JWT bearer token validation |
| `backend/app/database.py` | Supabase admin client singleton |
| `backend/.env` | Actual keys (gitignored) |
| `backend/Dockerfile` | Legacy container config (Koyeb plan) — **not used** by the Vercel deployment |
| `backend/api/index.py` | Vercel `@vercel/python` entrypoint — re-exports FastAPI `app` |
| `backend/vercel.json` | Vercel Python build + route config for the backend |
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

## Hosting Architecture (LIVE — Vercel, 2026-06-15)

Both frontend and backend run on **Vercel**. The backend was migrated from the
originally-planned Koyeb/Docker setup to **Vercel Python serverless functions**
(`@vercel/python`) — single provider, no container/port, no keep-alive cron.

```
Users → https://villages-eight.vercel.app   (Vercel project "villages")
                │
        ┌───────┴───────┐
        │   Vercel       │  ← Frontend (React/Vite, static build)
        │  "villages"    │     Always-on, global CDN, SSL
        └───────┬───────┘
                │  /api/* → rewrite → https://villages-api.vercel.app
        ┌───────┴───────┐
        │   Vercel       │  ← Backend (FastAPI on @vercel/python)
        │ "villages-api" │     Serverless functions, on-demand, no port
        └───────┬───────┘
                │  SUPABASE_SERVICE_ROLE_KEY
        ┌───────┴───────┐
        │   Supabase     │  ← Database + Auth + Realtime
        │  (free tier)   │     500MB DB, 50k users, Realtime
        └───────────────┘

No backend keep-alive needed (Vercel functions don't scale to zero).
Supabase still pauses after 7 days idle — keep it warm with a periodic
DB-touching request (e.g. GET /villages), NOT /health (doesn't query DB).
```

### Backend deploy specifics (`backend/`)
- `backend/api/index.py` — adds `backend/` to `sys.path`, re-exports FastAPI `app` for `@vercel/python`.
- `backend/vercel.json` — `framework: null` + `builds` (`api/index.py` via `@vercel/python`) + `routes` (`/(.*)` → the function).
- `backend/.vercelignore` — excludes `.env`, `pyproject.toml` (so the builder uses `requirements.txt` with pip, not `uv`), Dockerfile, caches.
- Env vars pushed via `vercel env add <NAME> production`.
- **Deployment Protection (ssoProtection) must be OFF** on `villages-api` or the public API + frontend proxy return 401.
- Redeploy: `cd backend && vercel deploy --prod --yes` (frontend likewise from `frontend/`).

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

### Task 1.4: Deploy Frontend to Vercel ✅ (done 2026-06-15)

Deployed to Vercel project **`villages`** → https://villages-eight.vercel.app.

- Root `frontend/`, framework Vite, build `npm run build`, output `dist/`.
- Env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- Redeploy: `cd frontend && vercel deploy --prod --yes`.

### Task 1.5: Deploy Backend to Vercel ✅ (done 2026-06-15 — was Koyeb)

Migrated to **Vercel Python serverless** (`@vercel/python`), project
**`villages-api`** → https://villages-api.vercel.app.

1. `backend/api/index.py` re-exports the FastAPI `app` (adds `backend/` to `sys.path`).
2. `backend/vercel.json`: `framework: null`, `builds` → `api/index.py` via `@vercel/python`, `routes` → `/(.*)` to the function.
3. `backend/.vercelignore` excludes `.env` and `pyproject.toml` (forces pip + `requirements.txt`, avoids the `uv lock` "no [project] table" error).
4. Link + env + deploy:
   ```bash
   cd backend
   vercel link --yes --project villages-api
   # for each var in backend/.env:
   printf '%s' "$VALUE" | vercel env add <NAME> production
   vercel deploy --prod --yes
   ```
5. **Disable Deployment Protection** (else 401):
   ```bash
   curl -X PATCH "https://api.vercel.com/v9/projects/villages-api?teamId=<TEAM>" \
     -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" \
     -d '{"ssoProtection":null}'
   ```
   Env vars set: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `OPENROUTER_MODEL_FALLBACK`.

### Task 1.6: Point frontend proxy at backend ✅ (done 2026-06-15)

`frontend/vercel.json` rewrite now → `https://villages-api.vercel.app/$1`.

### Task 1.7: CORS in Backend ✅ (handled)

`backend/app/main.py` already allows `*.vercel.app` via `allow_origin_regex`,
so production + preview deploys are covered without per-URL edits. Add a custom
domain to `FRONTEND_ORIGINS` env var if/when one is purchased.

### Task 1.8: Keep-Alive ✅ (not needed for backend)

Vercel functions are on-demand and never scale to zero, so no backend cron is
required. If Supabase ever pauses from 7-day inactivity, schedule a periodic
**DB-touching** request (e.g. `GET /villages`) — `/health` won't keep it warm.

### Task 1.9: Verify End-to-End (⬜ Claude Code)

After deployment, verify:

1. Visit `https://villages-eight.vercel.app` — Login page loads
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

## Session 2026-06-15/16 — Feature Branch Merge + Auth Fix

### Changes Made

- **Merged `village-studying-features` branch into `main`** (resolve conflicts in 8 files):
  - `frontend/src/pages/StudyHub.tsx` — New Study Hub component with 4 tabs (Study Buddy, Essay Coach, Study Plan, College Prep)
  - `frontend/src/pages/Courses.tsx` + `CourseDetail.tsx` — Course browsing, lesson completion tracking
  - `frontend/src/pages/Onboarding.tsx` + `Profile.tsx` — Study tracks (high_schooler, college_student, etc.), teacher verification
  - `frontend/src/components/Layout.tsx` — Nav links for Study Hub, Courses; `LogOut` icon fix
  - `backend/app/api/routes/ai.py` — New endpoints: `/study-buddy`, `/essay-coach`, `/study-plan`, `/college-advisor`
  - `backend/app/api/routes/courses.py` — Course CRUD + enrollment + lesson completion
  - `backend/app/api/routes/teacher.py` — Teacher application + verification
  - `backend/app/services/ai_service.py` — `generate_socratic_response`, `generate_essay_feedback`, `generate_study_plan`, `generate_college_advisor_response`
  - `backend/app/models/user.py` — Added `study_tags`, `teacher_subjects`, `bio`, `is_verified_teacher`

- **Fixed 429s from old `call_groq()` calls** during conflict resolution — replaced with `call_llm()` in merged code paths

- **Study Hub access gating** (`frontend/src/pages/StudyHub.tsx`):
  - Essay Coach: gated to `SCHOOL_LEVELS` (6th Grade through University levels)
  - College Prep tab: gated to 11th/12th grade or college-prep study tags
  - Locked tabs show 🔒 with tooltip explaining how to unlock

### Auth — Complete Rebuild of Magic Link Flow

The deployed Supabase project had SITE_URL set to `http://localhost:3000` (can't be changed without Supabase dashboard access). Standard magic link flow always redirects there. Overcame this with a 3-step backend proxy:

1. **`POST /auth/send-magic-link`** calls Supabase admin `generate_link` API (service role key) to create user + one-time token
2. **Backend calls `GET /auth/v1/verify`** with `follow_redirects=False` — Supabase returns 303 with `Location: http://SITE_URL#access_token=xxx` (real session tokens in the hash)
3. **Backend strips the Supabase host**, builds `https://villages-eight.vercel.app/auth/callback#access_token=xxx` with the real session tokens
4. **Frontend Callback.tsx** detects the hash via `supabase.auth.getSession()` → user is logged in

Key files: `backend/app/api/routes/auth.py` (refactored), `frontend/src/pages/Callback.tsx` (reverted to hash-fragment flow)

### Deployments

- Both frontend (`villages-eight.vercel.app`) and backend (`villages-api.vercel.app`) redeployed to Vercel with all new routes + fixed auth
- Added `FRONTEND_ORIGINS` env var to backend Vercel project (`https://villages-eight.vercel.app`)
- Fixed Vercel frontend project `rootDirectory` setting (was `frontend`, causing double-path on deploy)

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
