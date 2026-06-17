# Villages — Known Issues & Audit Log

This file documents issues found during audits. Because multiple AI agents work on
this codebase, prefer documenting findings here over silently changing another
agent's code. Planned features live in `FEATURE_ROADMAP.md`.

## 🚨 #1 PRIORITY BEFORE DEMO/JUDGING — run the migrations
`GET /courses` returns **500 in production** because the courses / lessons /
enrollments / office-hours / messages tables don't exist in the shared Supabase
project yet. **A judge clicking "Courses" or "Office Hours" in a live demo will hit
a 500 and can tank the project.** Fix: run `004 → 005 →
006_private_courses_office_hours → 007` in the Supabase SQL editor (see
`supabase/migrations/README.md`). Verify `GET /courses` → `200 []` afterward.
Cannot be done from code (needs the Supabase dashboard / DB credentials).

---

## Audit 2026-06-16 — feature-completeness

### ✅ Verified working (code-complete & wired across all layers)
- All pages routed in `App.tsx` and present in the nav.
- **API contract fully aligned** — every frontend `api.*` call maps to a real
  backend route (join-by-code, office-hours, private-course filtering, lesson quiz, …).
- Backend Pydantic models define all used fields (`is_private`, `invite_code`,
  `source`, `office_hours`); runtime-constructed OK.
- Authorization enforced on new endpoints (office-hours teacher-only, private
  course gating, invite-code validation).
- `tsc`, `npm run build`, `ruff` all pass.

### ✅ FIXED 2026-06-16 (branch `claude/ux-accessibility`)
- **Accessibility / UDL** — readable (dyslexia) font toggle, high-contrast toggle,
  and Text-to-Speech (`SpeakButton`, `window.speechSynthesis`) wired into the Topic
  Explorer output. See `FEATURE_ROADMAP.md`.
- **`/study` vs `/study-hub` redundancy** — `/study` now redirects to `/study-hub`
  and was removed from the nav.
- **Stale data risk in `Courses.tsx`** — `loadCourses` wrapped in `useCallback` with
  correct effect deps.

### ✅ FIXED — Duplicate migration number `006`
Two files were both `006`. The security one was renamed to
`007_security_rls_lockdown.sql`. Migrations are now uniquely numbered through 007.

### 🟡 KNOWN — Legacy migrations are not idempotent
`002_courses_schema.sql` / parts of `003_chat_and_tags.sql` error if re-run or run
after `005`. Superseded by `004`/`005`/`006_private` for the shared project — do not
run them there. Left in place for a possible future dedicated project. See
`supabase/migrations/README.md`.

---

## Security audit 2026-06-16 (branch `claude/security-hardening`, PR #4)
- 🔴 **FIXED** — `/auth/send-magic-link` returned a usable session for any email
  (account takeover). Now admin-only (`MAGIC_LINK_ADMIN_SECRET`); real login uses
  client-side Supabase OTP. `/auth/check-email` (enumeration) removed.
- 🟠 **FIXED (needs migration 007)** — `profiles` RLS was `SELECT USING (true)` →
  public email harvesting. `007_security_rls_lockdown.sql` restricts to owner row.
- 🟡 **FIXED** — lesson video iframes whitelist YouTube/Vimeo only (+ sandbox).
- 🟡 **FIXED** — per-user 30/min rate limit on all `/ai/*` routes.
- 🟢 **FIXED** — CORS tightened from any `*.vercel.app` to this project only.

### Deploy / human steps still required
1. Run migrations per `supabase/migrations/README.md` (incl. `007`).
2. Supabase → Auth → URL Configuration → add `…/auth/callback` redirect URLs
   (prod + localhost) for OTP login.
3. (Optional) set `MAGIC_LINK_ADMIN_SECRET` only if you need the admin endpoint;
   unset = endpoint disabled (safe default).
4. Merge PR #4 (security) — the account-takeover hole is still live in `main` until then.
5. Redeploy frontend + backend after merging.
