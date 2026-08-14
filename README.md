# Villages

An AI-powered community learning platform. Learners form small study cohorts — "Villages" — and work through structured courses, discussion forums, and collaborative challenges together, with an AI "Village Elder" facilitating rather than tutoring.

The design premise is that the AI **suggests and humans decide**: it translates confusing or stressful material into plain language, checklists, and clear next steps for a group, but it doesn't make the group's decisions for it.

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + TypeScript, Vite, React Router v6 |
| Styling | Tailwind CSS, custom `village-*` palette |
| Backend | Python FastAPI |
| Database | Supabase — PostgreSQL, Realtime, Auth |
| AI | OpenRouter, free-tier models (Llama 3.3 70B primary, Gemma fallback) |
| Hosting | Frontend and backend both on Vercel |

## Layout

```
Villages/
├── frontend/src/
│   ├── pages/          # Route-level components
│   ├── components/     # Shared UI — Layout, PostCard, VillageCard
│   ├── lib/
│   │   ├── api.ts      # All backend API calls
│   │   └── supabase.ts # Supabase client (auth + realtime)
│   └── types/index.ts  # Shared TypeScript interfaces
├── backend/app/
│   ├── api/routes/     # ai, auth, courses, posts, users, villages
│   ├── models/         # Pydantic schemas
│   ├── services/       # Business logic, incl. ai_service.py
│   ├── auth.py         # JWT validation
│   ├── database.py     # Supabase client
│   └── main.py         # FastAPI app + router registration
└── supabase/migrations/ # SQL migrations — run in numeric order
```

## Running locally

```bash
# backend
cd backend
pip install -r requirements.txt
cp .env.example .env          # fill in Supabase + OpenRouter keys
uvicorn app.main:app --reload

# frontend
cd frontend
npm install
cp .env.example .env
npm run dev                   # http://localhost:5173
```

Database schema is applied by running the files in `supabase/migrations/` **in numeric order** against your Supabase project. Migration `007_security_rls_lockdown.sql` establishes row-level security — don't skip it or the tables are readable by any authenticated user.

## Documentation

This repo carries its own working docs, and they're the source of truth over this README:

| File | Contents |
|---|---|
| `CLAUDE.md` | Codebase context — stack, layout, conventions |
| `FEATURES.md` | Full feature set and architecture diagrams |
| `FEATURE_ROADMAP.md` | What's planned and in what order |
| `BUGS.md` | Known issues |
| `CONTRIBUTING.md` | How to work in this repo |
| `AGENTS.md` | Agent-specific working instructions |

## Contributing

**This repository has multiple agents and contributors working in it concurrently.** Do not commit directly to `main`. Work on a branch and open a pull request — there's a PR template at `.github/pull_request_template.md`. Read `CONTRIBUTING.md` and `AGENTS.md` before making changes.
