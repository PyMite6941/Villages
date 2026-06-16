# Villages — Codebase Context

AI-powered student learning community platform. Study cohorts ("Villages"), structured courses, forums, and AI-facilitated challenges. Built for students and hobbyists alike.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + TypeScript, Vite, React Router v6 |
| Styling | Tailwind CSS with a custom `village-*` color palette |
| Backend | Python FastAPI |
| Database | Supabase (PostgreSQL + Realtime + Auth) |
| AI | OpenRouter (`:free` models — Llama 3.3 70B primary, Gemma 4 31B fallback) |

---

## Project Layout

```
Villages/
├── frontend/src/
│   ├── pages/          # Route-level components
│   ├── components/     # Shared UI (Layout, PostCard)
│   ├── lib/
│   │   ├── api.ts      # All backend API calls
│   │   └── supabase.ts # Supabase client
│   └── types/index.ts  # Shared TypeScript interfaces
├── backend/app/
│   ├── api/routes/     # FastAPI route handlers
│   ├── models/         # Pydantic schemas
│   ├── services/       # Business logic (ai_service.py)
│   ├── auth.py         # JWT validation
│   ├── database.py     # Supabase client
│   └── main.py         # FastAPI app + router registration
└── supabase/migrations/ # SQL migration files (run in order)
```

---

## Theme & Design System

### Color palette (`tailwind.config.js`)
```
village-50  → #fdf8f0  (page backgrounds)
village-100 → #faecd6  (card borders, badges)
village-600 → #ca6118  (primary buttons, active nav)
village-700 → #a74916  (header background, dark text)
```
**Base page background:** `bg-amber-50`  
**Card borders:** `border-amber-100`  
**Focus rings:** `ring-village-400`

### Reusable CSS classes (`frontend/src/index.css`)
```css
.btn-primary    /* village-600 bg, white text */
.btn-secondary  /* white bg, village border */
.card           /* white bg, amber-100 border, shadow-sm, rounded-xl, p-5 */
.input          /* border-gray-200, village-400 focus ring */
.badge          /* inline-flex, text-xs, rounded-full, px-2 py-0.5 */
```

### Icon library
`lucide-react` — consistent 18px size for nav, 14-16px for inline icons.

---

## Key Data Models

### UserProfile
```typescript
{ id, email, display_name, academic_level, goals[], strengths[], weaknesses[],
  interests[], learning_style, study_tags[], is_verified_teacher,
  teacher_subjects[], bio, village_id, avatar_url }
```

### Village (study cohort)
```typescript
{ id, name, description, focus_area, resources[], max_members, member_count,
  is_active, created_by }
```

### Course
```typescript
{ id, title, description, category ('school'|'hobby'), subject, teacher_id,
  teacher_name, teacher_is_verified, difficulty, estimated_hours,
  thumbnail_emoji, enrollment_count, is_published }
```

### Lesson
```typescript
{ id, course_id, title, content, order_index, duration_minutes }
```

### TeacherVerification (Village Scholar)
```typescript
{ id, user_id, degree_title, institution, subject_area, status }
```

---

## API Routes

### Backend base URL: `/api`

**Users**
- `POST /users/profile` — create profile (onboarding)
- `GET  /users/profile/:id` — fetch profile
- `PATCH /users/profile` — update profile (display_name, goals, bio)

**Villages**
- `GET  /villages` — list (filter: `?focus_area=`)
- `POST /villages` — create
- `GET  /villages/:id` — get with members
- `POST /villages/:id/join` — join
- `POST /villages/match` — AI village match

**Courses**
- `GET  /courses` — list (filter: `?category=school|hobby&subject=`)
- `POST /courses` — create
- `GET  /courses/:id` — get with lessons
- `POST /courses/:id/enroll` — enroll
- `GET  /courses/:id/enrollment` — check enrollment + progress
- `POST /courses/:id/lessons` — add lesson (teacher only)
- `POST /courses/:id/lessons/:lesson_id/complete` — mark lesson complete

**Teacher (Village Scholar)**
- `POST /teacher/apply` — submit verification (body: `{degree_title, institution, subject_area}`)
- `GET  /teacher/verification` — get own verification status

**Posts / Forum**
- `GET  /posts` — list (filter: `?village_id=`)
- `POST /posts` — create
- `POST /posts/:id/upvote`
- `GET  /posts/:id/comments`
- `POST /posts/:id/comments`

**Auth**
- `POST /auth/send-magic-link` — backend-proxied magic link (bypasses SITE_URL restriction)

**AI**
- `POST /ai/village-elder/:village_id/prompt` — generate discussion post
- `POST /ai/village-elder/:village_id/challenge` — generate collaborative challenge
- `POST /ai/courses/:course_id/study-tips` — generate study tips for a course
- `POST /ai/study-buddy` — Socratic AI tutor (body: `{subject, message, history[]}`)
- `POST /ai/essay-coach` — structured essay critique, anti-ghostwriting (body: `{essay, essay_prompt?, student_context?}`)
- `POST /ai/study-plan` — personalized weekly schedule (body: `{goals[], strengths[], weaknesses[], academic_level, weekly_hours}`)
- `POST /ai/study-planner` — multi-week timeline toward target date (body: `{subject, target, target_date, weekly_hours}`)
- `POST /ai/gpa-planner` — course-level grade calculator with target GPA (body: `{courses[], current_gpa, target_gpa, total_credits, favorite_course?}`)
- `POST /ai/college-advisor` — college fit suggestions (body: `{message, gpa, test_scores, interests[], preferences, history[]}`)

---

## Frontend Routes

```
/               → Home (dashboard + AI village matching)
/villages       → Browse / create study villages
/villages/:id   → Village detail (posts, members, Village Elder AI)
/courses        → Knowledge Grove — school & hobby courses
/courses/:id    → Course detail (lessons, progress, AI study tips)
/forum          → Global forum
/study-hub      → Study Hub — Study Buddy, Essay Coach, Study Planner, GPA Planner, College Prep
/settings       → Theme (dark/light/system), reduce animations
/profile        → User profile + Village Scholar (verified teacher) application
/onboarding     → New user setup (4-step wizard + study tracks)
```

---

## Village Scholar (Verified Teacher) System

Users can apply to become a **Village Scholar** — a verified educator badge that appears on their profile and all their courses.

- Apply via `/profile` → "Village Scholar" section
- Form: degree title, institution, subject area
- Auto-approved on honor system → sets `profiles.is_verified_teacher = true`
- Badge: `📜 Village Scholar` shown next to teacher name on courses
- Stored in `teacher_verifications` table; profile gets `is_verified_teacher` + `teacher_subjects[]`

---

## Courses System

### Two categories
- **School**: Mathematics, Science, English, History, Computer Science, Languages, Social Studies, Test Prep, Physics, Chemistry, Biology, Economics
- **Hobby**: Music, Visual Arts, Photography, Cooking, Creative Writing, Fitness & Sports, Film & Video, Crafts & DIY, Gaming, Dance, Gardening, Personal Finance

### Subject emojis
Each subject has a canonical emoji (defined in `Courses.tsx` → `SUBJECT_EMOJIS`). Used as course thumbnail.

### Difficulty levels
- `beginner` → emerald badge
- `intermediate` → village-orange badge  
- `advanced` → rose badge

### Progress tracking
`course_enrollments.completed_lesson_ids` is a text array of completed lesson IDs. Progress % = `completed / total_lessons * 100`.

---

## Database Tables

```
profiles            — extends auth.users; has goals[], teacher fields, study_tags[]
villages            — study cohorts
village_members     — many-to-many; roles: member/elder/chief
posts               — forum posts (village-scoped or global)
comments            — threaded comments on posts
challenges          — AI-generated collaborative study challenges
teacher_verifications — Village Scholar applications
courses             — school & hobby courses
lessons             — ordered lessons within a course
course_enrollments  — user ↔ course with completed_lesson_ids[]
messages            — village real-time chat (Supabase Realtime enabled)
```

---

## Village Chat

Real-time group chat is built **directly on Supabase** — no FastAPI involved. This keeps the free deployment viable (no backend compute for high-frequency messages).

### Architecture
- Frontend reads/writes `messages` table directly via `supabase-js`
- `supabase.channel()` with `postgres_changes` for live INSERT + UPDATE events
- `author_name` is denormalized (passed from client profile) for display without joins
- Supabase RLS enforces: only village members can read/write; `user_id` must equal `auth.uid()` on insert

### Message types
- `text` — normal chat bubble
- `code` — dark monospace code block (`bg-gray-900 text-green-400`)
- `link` — underlined clickable URL

### Features
- Reply-to: `reply_to_id` + `reply_preview` (120-char snapshot)
- Pin: any village member can pin; pinned messages appear at top of chat
- Load last 100 messages on mount, then realtime for new ones
- Auto-scroll to bottom on new messages

### Component
`frontend/src/components/VillageChat.tsx` — receives `{ villageId, session, authorName }` props

---

## Study Tracks System

Users self-select tags in their Profile page under "Study Tracks". Tags are stored in `profiles.study_tags text[]` and saved via `PATCH /users/profile` (the `UserProfileUpdate` model includes `study_tags`).

### Available tags
| Tag | Label | Unlocks |
|---|---|---|
| `high_schooler` | 🎓 High Schooler | College Prep track in Study Hub |
| `college_student` | 🏛️ College Student | Research writing tools (future) |
| `hobbyist` | 🎨 Hobbyist / Lifelong Learner | — |
| `educator` | 📖 Educator / Tutor | Village Scholar application nudge |

### Track detection in Study Hub
```typescript
const isHighSchooler = profile?.study_tags?.includes('high_schooler') ?? false
```
Locked tabs show `🔒 High Schooler track` description and are `cursor-not-allowed`.

---

## College Prep Track (High Schooler tag)

Appears as a 4th tab in Study Hub when `high_schooler` tag is active. Contains two sub-tabs:

### Application Essay Workshop
- Common App prompt selector (all 7 official prompts, selectable)
- Custom supplemental essay prompt input
- Student context field (auto-filled from profile)
- Essay textarea with char + word count
- Uses existing `api.ai.essayCoach` → `/ai/essay-coach` (anti-ghostwriting policy enforced)
- Feedback output: Overall / Strengths / Improvements / Vulnerabilities

### College Fit Advisor
- Profile setup form: GPA, test scores, interests/major, preferences
- Conversational AI chat with memory (last 8 turns)
- Backend: `generate_college_advisor_response()` in `ai_service.py`
- Endpoint: `POST /ai/college-advisor` (body: `{message, gpa, test_scores, interests[], preferences, history[]}`)
- Always suggests reach / match / safety school mix
- Anti-ghostwriting: will not write application content

---

## AI Integration (OpenRouter)

All AI calls go through `backend/app/services/ai_service.py` → `call_llm()` (with fallback retry).

### Model strategy
- **Primary:** `meta-llama/llama-3.3-70b-instruct:free` (configured via `OPENROUTER_MODEL`)
- **Fallback:** `google/gemma-4-31b-it:free` (configured via `OPENROUTER_MODEL_FALLBACK`)
- On **any** HTTP error (429/402/403/502), retries with fallback model
- 55s httpx timeout (Vercel Hobby plan has 60s function limit)
- 50 req/day free tier, 20 req/min rate limit

### AI Functions
- `generate_village_match_reasoning()` — match user to best village
- `generate_discussion_prompt()` — Village Elder forum posts
- `generate_study_challenge()` — collaborative group challenges
- `generate_course_study_tips()` — personalized study advice per course
- `generate_socratic_response()` — Socratic Study Buddy (never gives direct answers)
- `generate_essay_feedback()` — Essay Coach critique (anti-ghostwriting enforced in system prompt)
- `generate_study_plan()` — personalized weekly schedule
- `generate_study_planner()` — multi-week timeline toward target date
- `generate_gpa_plan()` — course-level GPA calculator with target grading
- `generate_college_advisor_response()` — college fit suggestions (reach/match/safety)
- `moderate_content()` — safety check for student platform

---

## Environment Variables

**Backend** (`.env`):
```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=
OPENROUTER_API_KEY=
OPENROUTER_MODEL=meta-llama/llama-3.3-70b-instruct:free
OPENROUTER_MODEL_FALLBACK=google/gemma-4-31b-it:free
FRONTEND_ORIGINS=http://localhost:5173,https://villages-eight.vercel.app
```

**Frontend** (`.env`):
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

---

## Common Patterns

### Adding a new backend route
1. Create/update model in `backend/app/models/`
2. Add route handler in `backend/app/api/routes/`
3. Register router in `backend/app/main.py`
4. Add SQL migration in `supabase/migrations/`

### Adding a new frontend page
1. Create page in `frontend/src/pages/`
2. Add types to `frontend/src/types/index.ts`
3. Add API method to `frontend/src/lib/api.ts`
4. Register route in `frontend/src/App.tsx`
5. Add nav link in `frontend/src/components/Layout.tsx` (if top-level)

### Toast notifications
`react-hot-toast` — `toast.success()` / `toast.error()`. Already configured in the app.

### Auth pattern
All protected API calls use `Authorization: Bearer <supabase_access_token>`. The `authHeaders()` helper in `api.ts` handles this automatically. Backend validates with `app/auth.py → get_current_user` (FastAPI `Depends`).
