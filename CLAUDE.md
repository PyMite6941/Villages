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
| AI | Groq API (fast LLM inference via `llama-3` models) |

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
  is_verified_teacher, teacher_subjects[], bio, village_id, avatar_url }
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

**AI**
- `POST /ai/village-elder/:village_id/prompt` — generate discussion post
- `POST /ai/village-elder/:village_id/challenge` — generate collaborative challenge
- `POST /ai/courses/:course_id/study-tips` — generate study tips for a course

---

## Frontend Routes

```
/               → Home (dashboard + AI village matching)
/villages       → Browse / create study villages
/villages/:id   → Village detail (posts, members, Village Elder AI)
/courses        → Knowledge Grove — school & hobby courses
/courses/:id    → Course detail (lessons, progress, AI study tips)
/forum          → Global forum
/profile        → User profile + Village Scholar (verified teacher) application
/onboarding     → New user setup (3-step wizard)
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
profiles            — extends auth.users; has goals[], teacher fields
villages            — study cohorts
village_members     — many-to-many; roles: member/elder/chief
posts               — forum posts (village-scoped or global)
comments            — threaded comments on posts
challenges          — AI-generated collaborative study challenges
teacher_verifications — Village Scholar applications
courses             — school & hobby courses
lessons             — ordered lessons within a course
course_enrollments  — user ↔ course with completed_lesson_ids[]
```

---

## AI Integration (Groq)

All AI calls go through `backend/app/services/ai_service.py` → `call_groq()`.

Functions:
- `generate_village_match_reasoning()` — match user to best village
- `generate_discussion_prompt()` — Village Elder forum posts
- `generate_study_challenge()` — collaborative group challenges
- `generate_course_study_tips()` — personalized study advice per course
- `moderate_content()` — safety check for student platform

Model configured via `settings.groq_model` in `app/config.py`.

---

## Environment Variables

**Backend** (`.env`):
```
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile
SECRET_KEY=
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
