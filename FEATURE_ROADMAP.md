# Villages — Feature Roadmap

Consolidated from the product/architecture reviews (DeepSeek analyses, 2026-06-16),
framed for **Brief 1 — Support & Understanding** and a "for anyone" audience
(K-12 + adult learners). Status: ✅ done · 🔜 spec'd · 💡 idea.

---

## ✅ Shipped (branch `claude/ux-accessibility`, 2026-06-16)

### Accessibility / Universal Design for Learning (UDL)
- **Readable (dyslexia-friendly) font toggle** — Atkinson Hyperlegible + extra
  letter/word/line spacing. `Settings.tsx` → `html.readable-font` (in `index.css`).
- **High-contrast toggle** — stronger borders + underlined links.
- **Text-to-Speech for AI content** — `SpeakButton` (`components/SpeakButton.tsx`)
  using the native `window.speechSynthesis` API. Wired into the Topic Explorer
  plain-language output (`Home.tsx`); drop-in elsewhere via `<SpeakButton text={...} />`.
- Reduce-motion toggle already existed.

### Codebase health
- **`/study` deprecated** → redirects to `/study-hub` (single Study Hub); removed
  from nav.
- **`loadCourses` wrapped in `useCallback`** with correct effect deps (no stale views).

---

## 🔜 Spec'd — high-impact, not yet built

Each needs a migration + backend route(s) + frontend. Order by judge ROI.

### 1. Ghost-Town Prevention: Async Focus Windows + AI Weekly Mission
**Why:** real-time chat alienates working adults / scheduled students; quiet rooms
read as "dead." Give async focal points.
- **DB:** `village_events(id, village_id, title, kind['focus_window'|'session'|'mission'], starts_at, ends_at, created_by, created_at)`.
- **Backend:** `POST/GET/DELETE /villages/{id}/events` (chief/teacher only to write).
  A scheduled/lazy job: if a village has no posts in 48h, the **Village Elder** reads
  the latest `learning_paths` milestone and auto-posts a "Weekly Mission" + poll.
- **Frontend:** agenda/countdown panel on `VillageDetail`.

### 2. Anti-AI-Dependency: "Evidence of Learning" reflection gates
**Why:** proves AI is a scaffold, not a crutch (active recall) — strong with edu judges.
- **DB:** `reflections(id, user_id, context_type['essay'|'study_plan'|'lesson'], context_id, prompt, response, created_at)`.
- **Backend:** require a reflection before the next AI step (e.g. before `study-planner`
  week N+1, or deeper `essay-coach` critique): `POST /ai/reflection` gate.
- **Frontend:** reflection prompt modal in Study Hub before unlocking the next step.

### 3. "Village Fire" — collective momentum meter
**Why:** shifts gamification from individual competition to collective support
(Community-First). Counters the free-rider problem.
- **No new table needed (v1):** compute from existing data — count posts/comments/
  completed challenge & learning-path steps in the village over the last 7 days →
  a 0-100 "fire" score; dims after 3 inactive days.
- **Backend:** `GET /villages/{id}/momentum` (aggregate query).
- **Frontend:** animated fire/meter on `VillageDetail` + Villages cards.

### 4. "The Council" — group consensus polls
**Why:** "human-in-the-loop" for a *cohort* needs a decision mechanism (which AI
milestone to tackle).
- **DB:** `polls(id, village_id, question, options jsonb, created_by, closes_at)` +
  `poll_votes(poll_id, user_id, option_index)` (PK user+poll).
- **Backend:** `POST /villages/{id}/polls`, `POST /polls/{id}/vote`, `GET` results.
- **Frontend:** "Poll the village" on any AI Action Plan / Learning Path step in
  `VillageDetail`.

### 5. Inter-Village Mentorship Nodes (cross-generational)
**Why:** leverages the platform's persona diversity (students ↔ professionals/
career-changers) — real "tribal" knowledge transfer.
- **DB:** `profiles.is_mentor boolean`, `mentor_subjects text[]`; `mentor_requests(id,
  from_village_id, mentor_user_id, message, status)`.
- **Backend:** opt-in mentor flag (profile), `POST /villages/{id}/mentor-request`,
  mentor inbox.
- **Frontend:** "Peer Mentor" opt-in in Profile; "Request a Guest Speaker" on `VillageDetail`.

---

## 💡 Smaller ideas
- Avatar uploads (Supabase Storage).
- Post pagination / infinite scroll on busy forums.
- Notifications (unread badge) — biggest retention lever.
- Mobile bottom-tab nav.

---

## 🚨 Blocker before demo (see BUGS.md)
`GET /courses` returns **500 in production** until the migrations are run. Run
`004 → 005 → 006_private_courses_office_hours → 007` per
`supabase/migrations/README.md`. A 500 when a judge clicks "Courses" or "Office
Hours" can tank the project — do this first.
