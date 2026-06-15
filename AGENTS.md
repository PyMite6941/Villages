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

## Key Files

| File | Purpose |
|------|---------|
| `FEATURES.md` | Complete project documentation, architecture, todo list |
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
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

## Next Task for This Agent

See `FEATURES.md` → **Master Project Checklist** → **Phase 1**. The highest-priority next step is:

1. **👤 Human task:** Create a new Supabase project for Villages (separate from AI-Teacher)
2. **⬜ Agent task:** Update `backend/.env` and `frontend/.env` with the new project's keys
3. **👤 Human task:** Get `SUPABASE_JWT_SECRET` from Supabase dashboard and add to `backend/.env`
4. **👤 Human task:** Run `001_initial_schema.sql` in the new Supabase project's SQL Editor
5. **👤 Human task:** Deploy frontend to Vercel + backend to Render

After Phase 1 is complete, proceed with Phase 2+ features (notifications, pagination, AI replies, etc.).

## OpenRouter Free Tier Limits

- 50 requests/day (no credit card)
- 20 requests/minute
- 28+ free models with `:free` suffix
- Current models: `meta-llama/llama-3.3-70b-instruct:free` (primary), `google/gemini-2.0-flash-exp:free` (fallback)
