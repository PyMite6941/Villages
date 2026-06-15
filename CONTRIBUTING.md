# Contributing to Villages

Thanks for contributing! This guide keeps every pull request consistent with the
project's style and functionality so it can merge cleanly.

## Project layout

- `frontend/` — React + Vite + TypeScript + Tailwind
- `backend/` — FastAPI (Python)
- `supabase/migrations/` — ordered SQL migrations (`001_`, `002_`, …)

See `FEATURES.md` for the full architecture and `AGENTS.md` for project context.

## Local setup

```bash
./run.sh            # macOS/Linux — installs deps + starts both servers
.\run.ps1           # Windows
```

Both need `backend/.env` and `frontend/.env` (copy from the `.env.example` files).

## Before you open a PR

CI runs the checks below on every PR. Run them locally first — a PR can only be
merged when they pass.

### Frontend (`cd frontend`)

```bash
npm run lint          # ESLint — style + correctness
npm run typecheck     # tsc --noEmit — types
npm run build         # production build must succeed
npm run format        # Prettier — auto-format your changes
```

### Backend (`cd backend`)

```bash
ruff check .          # lint + import sorting   (pip install ruff)
ruff check --fix .    # auto-fix what it can
python -c "from app.main import app"   # must import cleanly
```

## Style rules

- **Frontend:** match the existing style — 2-space indent, single quotes, no
  semicolons. ESLint (`eslint.config.js`) and Prettier (`.prettierrc.json`)
  encode this; just run `npm run lint` and `npm run format`.
- **Backend:** Ruff config lives in `backend/pyproject.toml` (line length 100,
  import sorting on). Keep route handlers thin; business/AI logic goes in
  `app/services/`.
- **Imports:** always import backend models/services from their package, not
  deep submodules where a public entry point exists.

## Database changes

- **Never edit an existing migration.** Add a new numbered file in
  `supabase/migrations/` (e.g. `004_my_change.sql`).
- Don't re-add tables to the `supabase_realtime` publication if a prior
  migration already added them (it errors and rolls back).
- New tables need RLS policies; the backend uses the service-role key and
  bypasses RLS, but the frontend (anon key) does not.

## Environment variables

If you introduce a new env var, add it (with a placeholder) to the matching
`.env.example` and mention it in your PR description.
