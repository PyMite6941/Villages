# Supabase Migrations — How to run

> ⚠️ The migration files do **not** share a clean linear history (there are legacy
> files kept for a fresh dedicated project). Run the set that matches your situation
> below — don't just run every file in numeric order.

## Current situation: SHARED Supabase project (reusing AI-Teacher)

This is what Villages uses today. Run **only these four**, in order, in the
Supabase **SQL Editor**. All four are idempotent (safe to re-run):

1. `004_shared_project_setup.sql` — base tables: profiles (extended), villages,
   village_members, posts, comments, challenges, topic_explanations, learning_paths
2. `005_shared_courses_chat_setup.sql` — courses, lessons, course_enrollments,
   teacher_verifications, messages (+ `courses.source`, `lessons.video_url`)
3. `006_private_courses_office_hours.sql` — `is_private` + `invite_code` on courses
   and villages, `course_office_hours` table
4. `007_security_rls_lockdown.sql` — restricts `profiles` SELECT to the owner's row
   (closes the public email-harvesting hole)

After running these, `GET /courses` should return `200 []` instead of `500`.

### Do NOT run on the shared project (legacy / superseded, not idempotent)
- `001_initial_schema.sql`
- `002_courses_schema.sql`
- `002_performance_indexes.sql`
- `003_chat_and_tags.sql`
- `003_competition_features.sql`

These are superseded by `004`/`005`/`006_private`. Running them will error
(`relation already exists` / duplicate policy) or partially duplicate objects.

## Fresh, dedicated Supabase project (recommended long-term)
If/when Villages gets its own Supabase project (no AI-Teacher conflict), the
idempotent set above (`004` → `005` → `006_private` → `007`) still works and is the
recommended path — it creates everything from scratch with `IF NOT EXISTS`.

## Verify
```sql
select table_name from information_schema.tables
where table_schema = 'public'
order by table_name;
-- expect: challenges, comments, course_enrollments, course_office_hours, courses,
--         learning_paths, lessons, messages, posts, profiles, teacher_verifications,
--         topic_explanations, village_members, villages
```
