# Villages — Known Issues & Audit Log

This file documents issues found during audits. Because multiple AI agents work on
this codebase, prefer documenting findings here over silently changing another
agent's code. Planned features live in `FEATURE_ROADMAP.md`.

---

## ✅ Status 2026-06-18 — fully live & verified end-to-end

The database is fully migrated and every major feature has been tested against the
**live** deployment (frontend `villages-eight.vercel.app`, backend
`villages-api.vercel.app`).

**Migrations applied (verified):** `004 → 005 → 006_private → 007 → 008 → 009`.
All required tables/columns exist (courses, lessons, course_enrollments,
course_office_hours, teacher_verifications, messages, challenges, village_bans;
plus `courses.tags/source/is_private/invite_code`, `lessons.video_url`,
`villages.ai_moderation`, `village_members.muted_until`).
> The `attempts/flags/essay_grades/questions` tables in the DB belong to AI-Teacher
> (shared project), not Villages.

**Live-verified flows:**
- Auth (OTP login — Supabase accepts the `/auth/callback` redirect + emails)
- Course → video lesson → AI quiz → enroll → complete
- Challenges: generate → list → **complete**
- Voice channel (Daily.co): member gets a room; non-member 403
- **Village Chat**: member insert (201) + read; outsider read 0 rows + insert 403
  (RLS correct); `messages` is in the realtime publication (live updates work)
- Moderation: chief settings/mute/unmute/ban/list/lift; non-chief 403; non-member 404

**Seed content (live):** 5 villages (AP Calculus AB Cohort, SAT Prep Squad, Python
Programmers Circle, Spanish Conversation Village, College Essay Workshop) and 3
courses (AP Calculus AB — 8 lessons; Python for Beginners — 4; Intro to Guitar — 3),
all by the verified "Villages Curriculum" 📜 account, each lesson with real teaching
content + a verified YouTube video + course tags. Test/E2E villages were deleted.

---

## ✅ Fixed this cycle
- **maybe_single() → 500 on missing rows** — `_require_chief`, mute/kick target
  lookups, member-count decrements, post/profile lookups all returned 500 instead of
  403/404 when a row was missing. Switched all 8 usages to `limit(1)` + list indexing.
- **Orphan comments** — `add_comment` now 404s if the post doesn't exist (was creating
  a comment with a bogus post_id).
- **Invalid fallback AI model** — live env was `gemini-2.0-flash-exp:free` (removed
  from OpenRouter); set to `google/gemma-4-31b-it:free` (verified valid). Primary
  `llama-3.3-70b:free` confirmed valid.
- **Migration `006` collision** — security file renamed to `007`.
- **`006_private` type bug** — `village_members.user_id (text) = auth.uid() (uuid)`
  cast to `::text`.

## Security audit (all FIXED & live)
- 🔴 `/auth/send-magic-link` account-takeover → admin-only (`MAGIC_LINK_ADMIN_SECRET`),
  login moved to client-side Supabase OTP; `/auth/check-email` enumeration removed.
- 🟠 `profiles` RLS public email-scrape → owner-row only (migration `007`, applied).
- 🟡 lesson iframes whitelisted to YouTube/Vimeo + sandbox.
- 🟡 per-user 30/min rate limit on all `/ai/*` routes.
- 🟢 CORS tightened to this project's domains only.

---

## 🟡 Known / low-priority
- **Legacy non-idempotent migrations** `002_courses_schema.sql` / `003_chat_and_tags.sql`
  are superseded by `004/005/006_private`. **Do not run them on the shared DB** (they
  error on re-run). Kept for a possible future dedicated project. See
  `supabase/migrations/README.md`.
- **`/study` vs `/study-hub`** — both routes still exist; product decision whether to
  retire `/study`.
- **Shared Supabase project** — Villages still shares AI-Teacher's project; `007`'s
  profiles-RLS change affects both. A dedicated project is recommended long-term
  (see FEATURE_ROADMAP.md / earlier notes).

## Operational reminders
- Temporary Supabase access tokens used for migrations were short-lived/expiring —
  fine to leave (auto-expire) or revoke.
- Daily.co API key is stored server-side in Vercel env (`DAILY_API_KEY`); keep it
  (the voice feature needs it). Regenerate + update the env if rotating.
- Free-tier Supabase email is rate-limited (~few/hour) — fine for a demo; add custom
  SMTP for real traffic.
