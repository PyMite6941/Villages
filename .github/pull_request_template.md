# Summary

<!-- What does this PR change and why? -->

## Type of change

- [ ] Bug fix
- [ ] New feature
- [ ] Refactor / cleanup
- [ ] Docs

## Checklist (keep CI green)

Run these locally before pushing — they mirror the CI gate:

**Frontend** (`cd frontend`)
- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run build` succeeds
- [ ] Ran `npm run format` on touched files

**Backend** (`cd backend`)
- [ ] `ruff check .` passes
- [ ] App imports: `python -c "from app.main import app"`

## Notes

<!-- Migrations to run, env vars added, screenshots, anything reviewers should know. -->
- [ ] If this adds a Supabase column/table, I added a new numbered migration in `supabase/migrations/` (never edited an existing one).
- [ ] If this adds an env var, I documented it in the relevant `.env.example`.
