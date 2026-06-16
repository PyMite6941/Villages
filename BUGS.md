# Villages — Known Issues & Audit Log

This file documents issues found during audits. Because multiple AI agents work on
this codebase, prefer documenting findings here over silently changing another
agent's code.

---

## Audit 2026-06-16 — feature-completeness + security

### ✅ Verified working (code-complete & wired across all layers)
- All 14 pages are routed in `App.tsx` and present in the nav.
- **API contract is fully aligned** — every frontend `api.*` call maps to a real
  backend route (no orphaned calls). Verified incl. `join-by-code` (courses +
  villages), `office-hours` (GET/POST/DELETE), private-course filtering, lesson quiz.
- Backend Pydantic models define all used fields (`is_private`, `invite_code`,
  `source`, `office_hours`; `OfficeHour`/`OfficeHourCreate`) — runtime-constructed OK.
- Authorization is enforced on new endpoints: office-hours add/delete are
  teacher-only (403); private courses gate on teacher/enrollment; invite codes validated.
- `tsc`, `npm run build`, and `ruff` all pass.

### 🟠 OPEN — Migrations not yet run in the live (shared) Supabase DB
**Impact:** `GET /courses` returns **500 in production** — the courses / lessons /
enrollments / office-hours / messages tables don't exist in the shared AI-Teacher
Supabase project yet. Courses, Knowledge Grove, Office Hours, Private courses, and
Village Chat are **code-complete but non-functional live** until the migrations run.
**Fix:** run the canonical idempotent set — see `supabase/migrations/README.md`.
*(Requires a human in the Supabase SQL editor; cannot be done from code.)*

### ✅ FIXED — Duplicate migration number `006`
Two files were both numbered `006` (`006_private_courses_office_hours.sql` from the
feature agent, `006_security_rls_lockdown.sql` from the security pass). The security
one was renamed to **`007_security_rls_lockdown.sql`**.

### 🟡 KNOWN — Legacy migrations are not idempotent
`002_courses_schema.sql` (plain `create table` / ungated `create policy`) and parts
of `003_chat_and_tags.sql` will error if re-run or run after the idempotent `005`.
They are **superseded** by `004`/`005`/`006_private` for the shared project. Do not
run them on the shared DB. See `supabase/migrations/README.md`. (Left in place rather
than deleted, since they may be the intended path for a fresh dedicated project.)

### 🟢 MINOR — possible page redundancy (needs product decision, not a bug)
Both `/study` (`Study.tsx`) and `/study-hub` (`StudyHub.tsx`) exist. Confirm whether
both are intended or one should be retired.

---

## Security audit 2026-06-16 (fixed in code; some need deploy/DB steps)
- 🔴 **FIXED** — `/auth/send-magic-link` returned a usable session for any email
  (account takeover). Now admin-only (gated by `MAGIC_LINK_ADMIN_SECRET`); real
  login switched to client-side Supabase OTP. `/auth/check-email` (enumeration) removed.
- 🟠 **FIXED (needs migration 007)** — `profiles` RLS was `SELECT USING (true)`, so
  the public anon key could scrape all emails. `007_security_rls_lockdown.sql`
  restricts profiles SELECT to the owner's row.
- 🟡 **FIXED** — lesson video iframes now whitelist YouTube/Vimeo only (+ sandbox).
- 🟡 **FIXED** — per-user rate limit (30/min) on all `/ai/*` routes.
- 🟢 **FIXED** — CORS tightened from any `*.vercel.app` to this project only.

### Deploy / human steps still required
1. Run migrations per `supabase/migrations/README.md` (incl. `007`).
2. Supabase → Auth → URL Configuration → add `…/auth/callback` redirect URLs
   (prod + localhost) for OTP login.
3. (Optional) set `MAGIC_LINK_ADMIN_SECRET` only if you need the admin endpoint;
   leaving it unset keeps that endpoint fully disabled (safe default).
4. Redeploy frontend + backend after committing.
