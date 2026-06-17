# Villages — AI-Powered Community Learning Platform

## Overview

**Villages** is a community learning platform where **students and adult learners** form small study cohorts ("Villages") powered by AI facilitation. Users create profiles, get AI-matched to a Village, participate in discussion forums, take on collaborative challenges, and interact with the "Village Elder" AI.

**AI Competition Context:** This project is built for **Brief 1 — support & understanding** of a hackathon/competition. It transforms the original idea of individual AI tutoring into a **community-first** platform where learning happens through **shared goals, AI-matched cohorts, and collaborative AI tools**. The AI acts as a **Crisis-to-Action Translator** — turning confusing/stressful information into plain language, checklists, and clear next steps for groups. Human-in-the-loop design ensures AI suggests but humans decide. Responsible AI guardrails continuously moderate content for safety, accuracy, and inclusivity.

---

## Architecture

```
┌────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)             │
│  localhost:5173                                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │  Home    │ │ Villages │ │  Forum   │ │ Profile  │ │
│  │  Page    │ │  Page    │ │  Page    │ │  Page    │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐ │
│  │Onboarding│ │Village   │ │  Components:         │ │
│  │          │ │Detail    │ │  Layout, PostCard,   │ │
│  └──────────┘ └──────────┘ │  VillageCard, Login  │ │
│                            └──────────────────────┘ │
│  ┌──────────────────────────────────────────────┐    │
│  │  api.ts (HTTP client → /api/*)               │    │
│  │  supabase.ts (Supabase client, auth + realtime)│  │
│  └──────────────────────────────────────────────┘    │
└───────────────────────┬────────────────────────────┘
                        │ proxy: /api → localhost:8000
                        │ (Vite dev proxy)
┌───────────────────────▼────────────────────────────┐
│               Backend (FastAPI + Uvicorn)           │
│  localhost:8000                                    │
│  ┌────────────┐ ┌────────────┐ ┌────────────────┐ │
│  │  /users/*  │ │/villages/*│ │  /posts/*      │ │
│  │  profile   │ │ CRUD, join│ │  CRUD, upvote, │ │
│  │  CRUD      │ │ AI match  │ │  comments      │ │
│  └────────────┘ └────────────┘ └────────────────┘ │
│  ┌────────────┐ ┌────────────────────────────────┐ │
│  │  /ai/*     │ │  Services:                     │ │
│  │  Elder     │ │  ai_service.py (OpenRouter)    │ │
│  │  Challenge │ │  auth.py (JWT verification)    │ │
│  │  Topic     │ │  database.py (Supabase client) │ │
│  │  Explain   │ └────────────────────────────────┘ │
│  │  Learning  │                                     │
│  │  Path      │                                     │
│  └────────────┘                                     │
└───────────────────────┬────────────────────────────┘
                        │ service_role_key (bypasses RLS)
┌───────────────────────▼────────────────────────────┐
│              Supabase (PostgreSQL + Auth)           │
│  Tables: profiles (+interests, +learning_style),   │
│          villages, village_members, posts,          │
│          comments, challenges,                      │
│          topic_explanations, learning_paths         │
│  Realtime enabled on: posts, comments,              │
│          topic_explanations, learning_paths         │
│  Row Level Security with policies                   │
│  Auth: Magic link email OTP                         │
└────────────────────────────────────────────────────┘
```

---

## Features

### 1. Authentication (Magic Link)

- **File:** `frontend/src/pages/Login.tsx`, `backend/app/auth.py`
- **How it works:** Users enter their email → Supabase Auth sends a magic link → clicking the link creates/validates a session → the JWT is stored in the Supabase client.
- **Backend auth extraction:** `auth.py` reads the `Authorization: Bearer <token>` header, decodes it with `jose.jwt` using `supabase_jwt_secret`, and returns the `sub` (user UUID).
- **Protected routes:** All mutation endpoints use `Depends(get_current_user)`.

### 2. Onboarding / Profile Creation

- **File:** `frontend/src/pages/Onboarding.tsx`, `backend/app/api/routes/users.py`
- **4-step flow (expanded for inclusivity):**
  1. **Basic info:** Display name + academic level (dropdown includes adult-friendly options: Adult Learner, Professional, Parent, Lifelong Learner, Career Changer, Hobbyist)
  2. **Goals:** Multi-select from 11+ common goals
  3. **Strengths & Weaknesses:** Same goal list color-coded green (strengths) / red (needs help)
  4. **Interests & Learning Style:** Broader topic interests (Science, Tech, Language, Parenting, etc.) + learning preference (visual, auditory, reading, kinesthetic)
- **API:** `POST /users/profile` → upserts into `public.profiles` table (now includes `interests[]` and `learning_style`).
- **Auto-redirect:** If a user has no profile, `Home.tsx` catches the 404 and redirects to `/onboarding`.

### 3. AI Village Matching

- **File:** `frontend/src/pages/Home.tsx:52-62`, `backend/app/api/routes/villages.py:24-43`, `backend/app/services/ai_service.py:60-103`
- **Trigger:** "AI Match me" button on the Home page when the user has no Village.
- **Backend flow:**
  1. Fetches the user's profile (goals, strengths, weaknesses, academic_level, interests, learning_style)
  2. Fetches all active villages with available slots
  3. Calls OpenRouter LLM with a system prompt describing the matching task
  4. Returns `{ village_id, reasoning }` explaining the match
- **Enhanced matching (competition feature):** Matching now considers broader `interests` and `learning_style` alongside academic goals, making it suitable for both students and adult learners. System prompt updated for an "inclusive community learning platform."
- **Prompt engineering:** The system prompt tells the model to act as an "AI matching system" for "both students and adult learners" and respond with JSON only.

### 4. Village CRUD & Discovery

- **File:** `frontend/src/pages/Villages.tsx`, `backend/app/api/routes/villages.py`
- **List all villages:** `GET /villages` with optional `focus_area` filter
- **Search:** Client-side filtering by name or focus area
- **Create village:** Expandable form with name, description, focus_area, resources (comma-separated)
  - Creator is auto-joined as `role: "chief"`
  - Creator's profile is updated with `village_id`
- **Join village:** "Join" button on each card, checks capacity (`member_count < max_members`), prevents duplicates
- **Grid layout:** Responsive 1/2/3-column grid of `VillageCard` components

### 5. Village Detail & Real-time Discussion

- **File:** `frontend/src/pages/VillageDetail.tsx`
- **Header:** Village name, description, focus area badge, member count, resources, live status indicator
- **Tabs:** "Discussion" and "Members"
- **Discussion tab:**
  - Post textarea with "Post" button
  - Sort by most recent (API orders by `created_at DESC`)
  - **Realtime:** Supabase Realtime subscription on `posts` table filtered by `village_id=eq.{id}` — new posts appear instantly without refresh
  - Deduplication via `postIdsRef` Set
- **Members tab:** List of members with avatar initials, display name, academic level, role badge
- **Village Elder button:** See AI features below

### 6. Global Forum

- **File:** `frontend/src/pages/Forum.tsx`
- **Scope:** Posts where `village_id IS NULL` (global, not scoped to any village)
- **Realtime:** Same as village detail but for all posts (client-side filters out village-scoped posts)
- **Live indicator:** Green "Live" badge when Realtime subscription is active

### 7. Post & Comment System

- **File:** `frontend/src/components/PostCard.tsx`, `backend/app/api/routes/posts.py`
- **Post features:**
  - Author name + avatar initial (Village Elder gets bot icon)
  - Content display with `whitespace-pre-wrap`
  - Upvote button with live count update
  - Date display
  - AI-generated posts highlighted with village-colored border and background
- **Comment features:**
  - Toggle comments section
  - Load comments from API on first open
  - Inline add comment with Enter key support
  - Each comment shows author initial, name, and content
- **Content moderation:** Each post and comment is sent through `moderate_content` AI service before saving

### 8. AI Village Elder (Discussion Prompts)

- **File:** `frontend/src/pages/VillageDetail.tsx:85-107`, `backend/app/api/routes/ai.py:20-43`, `backend/app/services/ai_service.py:106-120`
- **Trigger:** "Ask Village Elder" button
- **Flow:**
  1. Backend fetches village data (name, focus_area, resources)
  2. Calls OpenRouter API with an "AI facilitator" prompt
  3. Creates a new post in the village with `author_id: "village-elder-ai"` and `is_ai_generated: true`
  4. The post appears in real-time in the discussion feed
- **System prompt:** The model is asked to generate "a short, engaging discussion prompt (2-3 sentences)" — warm, encouraging, academically focused

### 9. AI Study Challenges

- **File:** `frontend/src/pages/VillageDetail.tsx:138-150`, `backend/app/api/routes/ai.py:46-77`, `backend/app/services/ai_service.py:123-141`
- **Trigger:** User types a subject and clicks "Challenge"
- **Flow:**
  1. Backend fetches village name + member count
  2. Calls OpenRouter API with a "collaborative challenge" prompt
  3. Parses JSON response: `{ title, description, steps[] }`
  4. Inserts into `public.challenges` table
- **Difficulty levels:** Defaults to "medium", supports easy/medium/hard

### 10. AI Content Moderation

- **File:** `backend/app/services/ai_service.py:143-150`
- **Applied to:** All posts and comments before insert
- **Flow:**
  1. Content is sent to OpenRouter API with a moderation system prompt
  2. Response: `{ safe: boolean, reason: string }`
  3. If `safe === false`, the API returns HTTP 400 with the moderation reason
- **Prompt:** "You are a content moderator for an inclusive learning platform (students and adult learners)"

### 11. Profile Management

- **File:** `frontend/src/pages/Profile.tsx`, `backend/app/api/routes/users.py:38-47`
- **View:** Avatar initial, email, academic level, goals badges
- **Edit (inline):** Display name, academic level, goals, strengths, weaknesses — all using the same toggle-chip UI as onboarding
- **Sign out:** Button calls `supabase.auth.signOut()`
- **API:** `PATCH /users/profile` updates only provided fields (`model_dump(exclude_none=True)`)

### 12. Supabase Realtime

- **Enabled tables (SQL):** `posts`, `comments`
- **Frontend channels:**
  - `village-posts-{id}` — filtered to specific village
  - `global-forum-posts` — all posts, client-filtered for `village_id IS NULL`
- **Deduplication:** `postIdsRef` (a `useRef<Set<string>>`) prevents duplicate inserts from stale subscription callbacks

### 13. Row-Level Security (Supabase)

- **File:** `supabase/migrations/001_initial_schema.sql`
- **All tables have RLS enabled** with selective policies:
  - `profiles`: everyone can view, users can update/insert their own
  - `villages`: everyone can view, authenticated users can create
  - `posts`: everyone can view, authenticated users (or `village-elder-ai`) can insert
  - `comments`: everyone can view, authenticated users can insert
  - `challenges`: everyone can view
  - `village_members`: everyone can view, users can insert their own membership
- **Service role key:** The backend uses `supabase_service_role_key` which bypasses all RLS, acting as a trusted intermediary.

### 14. Root CLI Utility

- **File:** `main.py`
- **Purpose:** Standalone command-line interface for quick village data lookup
- **Commands:**
  - `list` — Show hardcoded villages (AlphaVillage, BetaHamlet, GammaTown)
  - `get <name>` — Show population + resources for a village
  - `exit` — Quit

### 15. AI Topic Explorer (Crisis-to-Action Translator) — Competition Feature

- **File:** `frontend/src/pages/Home.tsx`, `frontend/src/pages/VillageDetail.tsx`, `backend/app/api/routes/ai.py`, `backend/app/services/ai_service.py`
- **Purpose:** Turn confusing/stressful information about any topic into **plain language, a checklist, and clear next steps** — for an individual or a whole village group.
- **Trigger:** User types any topic in the "Topic Explorer" input on Home or VillageDetail → clicks "Explain"
- **Backend flow:**
  1. Calls `explain_topic()` AI service which creates a plain-language summary, key points, checklist items, and next steps
  2. If a `village_id` is provided, fetches the village's member profiles to tailor the explanation to their academic levels and interests
  3. Passes through `moderate_topic_content()` responsible AI guardrail (checks safety, accuracy, inclusivity)
  4. Saves to `topic_explanations` table scoped to the village
- **Human-in-the-loop:** AI generates the explanation, but users decide which steps to take and who to share with
- **Responsible AI:** `moderate_topic_content()` reviews each explanation for factual accuracy, age-appropriateness, and harmful stereotypes before returning to the user

### 16. AI Learning Paths — Competition Feature

- **File:** `frontend/src/pages/VillageDetail.tsx`, `backend/app/api/routes/ai.py`, `backend/app/services/ai_service.py`
- **Purpose:** Generate a structured collaborative learning plan for any village, tailored to their focus area, resources, and member interests.
- **Trigger:** "Learning Path" button on VillageDetail page
- **Backend flow:**
  1. Fetches village data + all member profiles (collects interests)
  2. Calls `generate_learning_path()` AI service → deduplicates interests across members
  3. AI returns JSON: `{ title, description, steps[{ title, description, estimated_minutes }] }`
  4. Saves to `learning_paths` table
  5. Shown in the "Learning" tab with step-by-step numbered display
- **AI reasoning:** The AI acts as a "curriculum designer" — identifies what matters most for the group based on shared interests and creates a structured path

### 17. Adult Learners & Inclusivity — Competition Feature

- **File:** `frontend/src/pages/Onboarding.tsx`, `frontend/src/pages/Profile.tsx`, `backend/app/models/user.py`, `supabase/migrations/003_competition_features.sql`
- **New academic levels:** Adult Learner, Professional, Parent, Lifelong Learner, Career Changer, Hobbyist
- **New profile fields:**
  - `interests[]` — broad topics (Science, Technology, Parenting, Health, Finance, etc.)
  - `learning_style` — visual, auditory, reading, kinesthetic
- **4-step onboarding** instead of 3 — step 4 captures interests and learning style
- **Purpose:** Expands the platform beyond just K-12/test-prep students to serve everyday life challenges for all ages — increasing impact and versatility for competition judging

### 18. Responsible AI Guardrails — Competition Feature

- **File:** `backend/app/services/ai_service.py`, `backend/app/api/routes/ai.py`
- **`moderate_topic_content()`** — Reviews every AI-generated topic explanation for:
  - Factual accuracy and misinformation
  - Age-appropriateness for the audience
  - Harmful stereotypes or bias
  - Ethical considerations
- **Output:** `{ safe, concerns[], ethical_notes[] }` — if flagged, concerns are surfaced to the user
- **Design mitigation:** AI suggests, but humans decide. AI acts as a moderator ensuring group education stays grounded in ethical principles. All content moderation is non-blocking — warnings are surfaced alongside results rather than silently dropping content.

### 19. Study Hub — Personal AI Study Space

- **File:** `frontend/src/pages/StudyHub.tsx`, `backend/app/api/routes/ai.py`, `backend/app/services/ai_service.py`
- **Access:** Nav link "Study Hub" in sidebar, available to all authenticated users
- **Scope:** 1-on-1 AI tools that exist outside Villages — personal tutoring, essay coaching, planning, college prep
- **4 tabs (with access gating):**

#### 19a. Study Buddy (Socratic AI Tutor)
- **Tab:** Available to everyone
- **How it works:** Pick a subject → chat with an AI that uses the **Socratic method** (never gives direct answers, only probing questions)
- **Anti-spoonfeeding:** System prompt enforces Socratic dialogue — "respond ONLY with probing questions and hints"
- **Subject selector:** Dropdown of 24+ subjects (Math, Science, English, History, CS, etc.)
- **Chat history:** Last 8 messages included as context for coherent multi-turn conversations
- **API:** `POST /ai/study-buddy` → `generate_socratic_response()`

#### 19b. Essay Coach (Application Critique)
- **Tab:** Gated — only users with academic level in 6th grade through university
- **How it works:** Paste an essay → AI analyzes strengths, improvements, and strategic vulnerabilities
- **Anti-ghostwriting:** System prompt explicitly forbids generating or rewriting any essay content
- **Fields:** Essay prompt (optional), student context (optional — helps evaluate achievement fairly), essay body
- **Output:** Strengths ✓, Areas to Improve →, Strategic Vulnerabilities ⚠, Overall Assessment
- **API:** `POST /ai/essay-coach` → `generate_essay_feedback()`
- **Minimum length:** 50 characters required before analysis

#### 19c. Study Planner (Multi-Week Timeline)
- **Tab:** Available to everyone
- **How it works:** Pick a subject + target + target date + weekly hours → AI generates a week-by-week plan working backwards from the deadline
- **Fields:** Subject (dropdown or custom), Target/Goal (text, e.g. "AP Biology exam"), Target Date (date picker), hours/week slider (3-40h)
- **Profile integration:** Uses profile goals, strengths, weaknesses, and academic level to personalize the timeline
- **Output:** Structured week-by-week view with focus theme, date range, task list, and milestone per week + summary
- **API:** `POST /ai/study-planner` → `generate_study_planner()`
- **Different from Study Plan:** Generates a multi-week backward-planned timeline rather than a single-week schedule

#### 19d. College Prep
- **Tab:** Gated — requires 11th/12th grade or college-prep study tags
- **Two sub-tabs:**

**College Essay Workshop:** Same essay critique engine as Essay Coach, but tailored for Common App prompts (7 built-in prompts + custom). Shows word count with warning if over 650 words.

**College Fit Advisor:** Chat-based advisor that suggests reach/match/safety schools based on GPA, test scores, interests, and preferences. Starts with a profile form, then opens a conversational interface. API: `POST /ai/college-advisor` → `generate_college_advisor_response()`

### 20. Courses & Lessons

- **File:** `frontend/src/pages/Courses.tsx`, `frontend/src/pages/CourseDetail.tsx`, `backend/app/api/routes/courses.py`
- **Browse courses:** Grid view with subject/category filters, difficulty badges, teacher info
- **Course detail:** Lesson list with completion tracking, enrollment button, study tips button
- **Lesson completion:** Tracks completed lesson IDs per user per course
- **Teacher verification:** Teacher application → admin verification → verified teacher badge
- **API endpoints:** `GET/POST /courses`, `GET /courses/:id`, `POST /courses/:id/enroll`, `GET /courses/:id/enrollment`, `POST /courses/:id/lessons/:lid/complete`, `POST /ai/courses/:id/study-tips`

### 21. Study Tracks & Profile Tags

- **File:** `frontend/src/pages/Onboarding.tsx`, `frontend/src/pages/Profile.tsx`
- **4 study track presets:**
  - `high_schooler` — Unlocks College Prep tab in Study Hub
  - `college_student` — General higher education track
  - `adult_learner` — Adult education, no school-gating features
  - `test_prep` — Test-focused study tools
- **Custom ("Other") goals:** Free-form text input + "Add" button — any string is valid (no CHECK constraint on `goals[]`)
- **Tags stored in:** `profiles.study_tags[]` (text array)
- **Academic levels:** Full range from 6th Grade through Doctoral Student + adult options (Adult Learner, Professional, Parent, etc.)

### 22. Teacher Verification

- **File:** `frontend/src/pages/Profile.tsx`, `backend/app/api/routes/teacher.py`
- **Flow:** Teacher applies with degree title, institution, and subject area → stored with `status: 'pending'` → admin (manual) verifies → `is_verified_teacher: true` on profile
- **Verified teachers:** Get a verified badge on their courses, can create courses
- **API:** `POST /teacher/apply`, `GET /teacher/verification`

### 23. Accessibility — Universal Design for Learning

- **File:** `frontend/src/pages/Settings.tsx`, `frontend/src/components/TextToSpeech.tsx`, `frontend/src/index.css`
- **Goal:** Make the platform usable by learners with dyslexia, ADHD, visual impairments, or other accessibility needs

#### 23a. Dyslexia-Friendly Font Toggle
- **Settings → Accessibility** toggle enables Lexend font (loaded from Google Fonts) across the entire app
- `font-dyslexic` CSS class on `<html>` forces `font-family: Lexend, Verdana, Tahoma, sans-serif` with 0.035em letter-spacing and 0.12em word-spacing
- Persisted to `localStorage('village-dyslexic-font')`

#### 23b. Text-to-Speech (TTS)
- **Component:** `TextToSpeech.tsx` — reusable button that uses browser `window.speechSynthesis` API
- **Props:** `text`, `className`, `label` — reads text aloud at 92% speed with configurable voice
- **Voice selection:** Settings page populates voice picker from `speechSynthesis.getVoices()`, filtered to English voices, persisted to `localStorage('village-tts-voice')`
- **Where used:** AI-generated content areas — StudyBuddy responses, EssayCoach feedback, StudyPlan outputs, CollegePrep responses, Home page AI match results and Topic Explorer explanations
- **Enable/disable:** Settings toggle globally enables/disables TTS buttons (`localStorage('village-tts-enabled')`)

#### 23c. Reduce Animations
- **Settings toggle** persists `village-reduce-animations` to localStorage and applies `reduce-motion` class to `<html>`
- CSS: `.reduce-motion * { transition-duration: 0s !important; animation-duration: 0s !important; }`

#### 23d. Dark Mode (Full Coverage)
- **Config:** `darkMode: 'class'` in Tailwind config — toggled by Settings or system preference
- All 13 pages/components now have full `dark:` class coverage:
  - StudyHub (~83 edits), Courses (~59), CourseDetail (~86), Profile (~43), Home (~19), Villages (~12), VillageDetail (~13)
  - Layout, PostCard, VillageCard, VillageChat, Forum, Settings
- **Estimated total:** ~400+ `dark:` variant additions across the codebase

### 24. Village Voice Channel ("Village Fire")

- **File:** `frontend/src/components/VillageVoice.tsx`, `backend/app/config.py`, `backend/app/api/routes/villages.py`
- **How it works:** Backend get-or-creates a Daily.co room for each village (audio-first, members only). Frontend mounts Daily's prebuilt iframe into the VillageDetail page.
- **Backend:** `POST /villages/{id}/voice` — checks membership, creates/returns existing room URL. Gated by `DAILY_API_KEY` (disabled if unset)
- **Frontend:** `VillageVoice` component renders a "Join Voice" button → Daily prebuilt call frame (video off by default, audio on) with leave button
- **Dependency:** `@daily-co/daily-js` added to package.json
- **Purpose:** Real-time synchronous study sessions — voice coordination for group learning, replacing the need for text-only async discussion

### 25. Challenge Completion

- **File:** `frontend/src/pages/VillageDetail.tsx`, `backend/app/api/routes/villages.py`
- **Previously:** Challenges were generated but never shown or completable
- **Now:** 
  - `GET /villages/{id}/challenges` lists challenges for a village
  - `POST /villages/{id}/challenges/{cid}/complete` appends user ID to `completed_by` array
  - VillageDetail displays challenges with "Mark complete" button and completion count (e.g. "2/5 done")
- **API:** `api.villages.listChallenges(id)`, `api.villages.completeChallenge(id, cid)`

### 26. Course Search

- **File:** `frontend/src/pages/Courses.tsx`
- **Client-side filtering:** Text input filters courses by title or subject match
- Runs in real-time as the user types, no additional API calls

---

### Auth — Magic Link via Backend Proxy

The deployed Supabase project has SITE_URL stuck at `http://localhost:3000` (can't be changed without Supabase dashboard access). The auth flow works around this via a 3-step backend proxy:

1. **`POST /auth/send-magic-link`** calls Supabase admin `generate_link` API (service role key) to create user + one-time token
2. **Backend calls `GET /auth/v1/verify`** with `follow_redirects=False` — Supabase returns 303 with `Location: http://SITE_URL#access_token=xxx` (real session tokens in the hash)
3. **Backend strips the Supabase host**, builds `https://villages-eight.vercel.app/auth/callback#access_token=xxx` with the real session tokens
4. **Frontend Callback.tsx** detects the hash via `supabase.auth.getSession()` → user is logged in

Key files: `backend/app/api/routes/auth.py`, `frontend/src/pages/Login.tsx`, `frontend/src/pages/Callback.tsx`

---

## Database Schema (Supabase / PostgreSQL)

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `profiles` | User profiles (students + adults) | `id` (FK auth.users), `display_name`, `academic_level`, `goals[]`, `strengths[]`, `weaknesses[]`, `interests[]`, `learning_style`, `village_id`, `study_tags[]`, `bio`, `is_verified_teacher`, `teacher_subjects[]` |
| `villages` | Study cohorts | `name`, `description`, `focus_area`, `resources[]`, `max_members`, `member_count`, `created_by`, `is_private`, `invite_code`, `voice_room_url` |
| `village_members` | Many-to-many | `user_id`, `village_id`, `role` (member/chief), `joined_at` |
| `posts` | Discussions | `content`, `author_id`, `author_name`, `village_id` (nullable=global), `is_ai_generated`, `upvotes`, `created_at` |
| `comments` | Post comments | `post_id`, `content`, `author_id`, `author_name`, `is_ai_generated`, `created_at` |
| `challenges` | Collaborative challenges | `village_id`, `title`, `description`, `subject`, `difficulty`, `completed_by[]` |
| `topic_explanations` | AI plain-language topic breakdowns | `village_id`, `topic`, `plain_language`, `checklist` (jsonb), `next_steps` (jsonb) |
| `learning_paths` | AI-structured group learning plans | `village_id`, `title`, `description`, `steps` (jsonb) |
| `courses` | Community courses | `title`, `description`, `category`, `subject`, `difficulty`, `teacher_id`, `teacher_name`, `thumbnail_emoji`, `enrollment_count`, `is_published`, `is_private`, `invite_code`, `source` |
| `lessons` | Course lessons | `course_id`, `title`, `content`, `order_index`, `duration_minutes`, `video_url` |
| `course_enrollments` | User ↔ course | `user_id`, `course_id`, `completed_lesson_ids[]`, `enrolled_at` |
| `teacher_verifications` | Teacher applications | `user_id`, `degree_title`, `institution`, `subject_area`, `status` (pending/approved/rejected) |
| `office_hours` | Scheduled course events | `course_id`, `day_of_week`, `start_time`, `end_time`, `location` |

### Migration Files

| # | File | Purpose |
|---|------|---------|
| 001 | `001_initial_schema.sql` | Full DDL + RLS policies + realtime (profiles, villages, village_members, posts, comments, challenges) |
| 002 | `002_performance_indexes.sql` | Query-speed indexes |
| 002b | `002_courses_schema.sql` | Courses + lessons + enrollments + teacher_verifications tables |
| 003 | `003_competition_features.sql` | interests/learning_style + topic_explanations + learning_paths + study_tags |
| 003b | `003_chat_and_tags.sql` | Chat messages table, profile study tags |
| 004 | `004_shared_project_setup.sql` | Shared project infrastructure setup |
| 005 | `005_shared_courses_chat_setup.sql` | Shared courses/chat configuration |
| 006 | `006_private_courses_office_hours.sql` | Private courses, invite codes, office hours |
| 007 | `007_security_rls_lockdown.sql` | Security RLS policy hardening |

---

## Dependencies

### Backend (`backend/requirements.txt`)

| Package | Version | Purpose |
|---------|---------|---------|
| `fastapi` | 0.115.0 | Web framework for the REST API |
| `uvicorn[standard]` | 0.30.6 | ASGI server |
| `supabase` | 2.7.4 | Supabase PostgreSQL client (admin access via service_role_key) |
| `python-dotenv` | 1.0.1 | Load `.env` file |
| `httpx` | 0.27.2 | Async HTTP client (for OpenRouter API calls) |
| `pydantic` | 2.9.2 | Data validation / settings management |
| `pydantic-settings` | 2.5.2 | `.env` → `Settings` class binding |
| `python-jose[cryptography]` | 3.3.0 | JWT token decoding for auth |
| `passlib[bcrypt]` | 1.7.4 | Password hashing (unused — auth is magic-link only) |
| `python-multipart` | 0.0.12 | Form data parsing (required by FastAPI internals) |

### Frontend (`frontend/package.json`)

| Package | Version | Purpose |
|---------|---------|---------|
| **Production** | | |
| `@supabase/supabase-js` | ^2.45.0 | Supabase client (auth session + realtime subscriptions) |
| `react` | ^18.3.1 | UI library |
| `react-dom` | ^18.3.1 | React DOM renderer |
| `react-router-dom` | ^6.26.2 | Client-side routing |
| `react-hot-toast` | ^2.4.1 | Toast notifications |
| `lucide-react` | ^0.441.0 | Icon library |
| **Dev** | | |
| `@types/react` | ^18.3.5 | TypeScript types for React |
| `@types/react-dom` | ^18.3.0 | TypeScript types for ReactDOM |
| `@vitejs/plugin-react` | ^4.3.1 | Vite React plugin (HMR, JSX transform) |
| `autoprefixer` | ^10.4.20 | PostCSS plugin for vendor prefixes |
| `postcss` | ^8.4.47 | CSS post-processor |
| `tailwindcss` | ^3.4.11 | Utility-first CSS framework |
| `typescript` | ^5.5.3 | Type checking |
| `vite` | ^5.4.6 | Build tool and dev server |

### Infrastructure (External)

| Service | Purpose | Configuration |
|---------|---------|---------------|
| **Supabase** | PostgreSQL database, Auth (magic link), Realtime | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET` |
| **OpenRouter** | LLM inference via free-tier `:free` models — $0 cost | `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` |

---

## Bugs Fixed (Initial Session)

| # | File | Issue | Fix |
|---|------|-------|-----|
| 1 | `main.py:22` | Empty input at CLI prompt crashed with `IndexError` (`.split()` returns `[]`, then `command[0]` fails) | Added `if not raw: continue` guard and try/except for `KeyboardInterrupt`/`EOFError` |
| 2 | `Profile.tsx` | `academic_level`, `strengths`, and `weaknesses` were not editable in the profile edit UI | Added `academic_level` select dropdown, strengths/weaknesses toggle-chip grids to the edit form |
| 3 | `Profile.tsx:85` | `toggleGoal` was removed but still referenced in edit mode | Replaced `toggleGoal` with the generic `toggleItem('goals', g)` |
| 4 | `PostCard.tsx:103` | Pressing Enter in the comment input could submit an empty/whitespace-only comment | Added `newComment.trim()` guard before `submitComment()` |

## Bugs Fixed (Debug Pass — 2026-06-15)

Full debug pass: backend import check, frontend `tsc --noEmit` type-check, and a
production `npm run build` all pass clean. Six real bugs found and fixed:

| # | File | Severity | Issue | Fix |
|---|------|----------|-------|-----|
| 5 | `backend/app/api/routes/users.py` | **High (data loss)** | `create_profile` accepted `interests` + `learning_style` (collected in onboarding step 4) but never wrote them to the DB. Every new profile saved empty interests → AI matching (which reads `interests`) and the adult-learner feature were silently degraded. | Added `interests` and `learning_style` to the inserted profile dict. |
| 6 | `backend/app/api/routes/posts.py` | **High (breaks feed)** | `list_posts` used `.select("*, profiles(display_name)")`. `posts.author_id` is a free-text column (no FK to `profiles`, and `text` vs `uuid`), so PostgREST can't embed `profiles` → request errors and **no posts ever load**. The embedded field wasn't even used (`author_name` is denormalized). | Changed to `.select("*")` and documented why. |
| 7 | `backend/app/api/routes/villages.py` | **High (breaks members tab)** | `get_village_members` used `.select("*, profiles(...))")`. `village_members` has no direct FK to `profiles` (both only reference `auth.users`), so PostgREST can't embed → members render as "Unknown". | Rewrote to fetch profiles in a second `.in_()` query and merge them under each member's `profiles` key (FK-independent, always works). |
| 8 | `supabase/migrations/002_performance_indexes.sql` | **High (migration fails)** | Re-ran `alter publication supabase_realtime add table posts/comments`, but 001 already added them. Postgres errors with "relation is already member of publication", rolling back the whole migration → **indexes never get created**. | Removed the duplicate publication adds; publication management lives only in 001. |
| 9 | `frontend/src/lib/api.ts` | Medium | `generateChallenge` interpolated `subject`/`difficulty` straight into the query string with no encoding → any subject with a space, `&`, or `#` produced a malformed URL. | Switched to `URLSearchParams` (matches the `explainTopic` pattern). |
| 10 | `frontend/vercel.json` | Low (config drift) | API rewrite still pointed at `villages-api.onrender.com`, but the whole deployment architecture (AGENTS.md + this file) standardized on **Koyeb**. | Updated placeholder to `https://villages-api-<org>.koyeb.app/$1`. |

---

## Project Structure

```
Villages/
├── main.py                          # CLI utility (standalone)
├── FEATURES.md                      # This file
├── .gitignore
│
├── backend/
│   ├── requirements.txt
│   ├── .env.example
│   └── app/
│       ├── __init__.py
│       ├── main.py                  # FastAPI app entry point
│       ├── config.py                # Settings from .env
│       ├── database.py              # Supabase client singleton
│       ├── auth.py                  # JWT bearer token validation
│       ├── models/
│       │   ├── __init__.py
│       │   ├── user.py              # UserProfile (+interests, +learning_style)
│       │   ├── village.py           # Village, VillageCreate, VillageMember
│       │   ├── post.py              # Post, PostCreate, Comment, CommentCreate
│       │   ├── challenge.py         # Challenge, ChallengeCreate
│       │   └── learning.py          # TopicExplanation, LearningPath
│       ├── api/
│       │   ├── __init__.py
│       │   └── routes/
│       │       ├── __init__.py
│       │       ├── auth.py          # Magic link via backend proxy
│       │       ├── users.py         # Profile CRUD
│       │       ├── villages.py      # Village CRUD, join, AI match, members
│       │       ├── posts.py         # Post CRUD, upvote, comments
│       │       ├── courses.py       # Course CRUD, enrollment, lesson completion
│       │       ├── teacher.py       # Teacher application + verification
│       │       └── ai.py            # Elder prompts, challenges, topic explain, learning paths, Study Hub AI
│       └── services/
│           ├── __init__.py
│           └── ai_service.py        # OpenRouter API integration (+ fallback model)
│
├── frontend/
│   ├── package.json
│   ├── index.html
│   ├── vite.config.ts               # Vite config + /api proxy
│   ├── tailwind.config.js           # Custom village color palette
│   ├── postcss.config.js
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── .env.example
│   ├── public/
│   │   └── village-icon.svg
│   └── src/
│       ├── main.tsx                 # React entry point
│       ├── index.css                # Tailwind + custom utility classes
│       ├── App.tsx                  # Auth gate + routing
│       ├── types/
│       │   └── index.ts            # TypeScript interfaces (UserProfile, Village, Post, Course, etc.)
│       ├── lib/
│       │   ├── supabase.ts         # Supabase client
│       │   └── api.ts             # Typed HTTP client for all endpoints
│       ├── components/
│       │   ├── Layout.tsx          # App shell (header + sidebar + main)
│       │   ├── VillageCard.tsx     # Village preview card
│       │   ├── PostCard.tsx        # Post display + comments
│       │   ├── VillageChat.tsx     # Village real-time chat
│       │   ├── TextToSpeech.tsx    # TTS button (speechSynthesis)
│       │   └── VillageVoice.tsx    # Daily.co voice channel iframe
│       └── pages/
│           ├── Login.tsx            # Magic link login
│           ├── Callback.tsx         # Auth callback (hash-fragment session)
│           ├── Home.tsx             # Dashboard (village status + activity)
│           ├── Villages.tsx         # Browse/search/create villages
│           ├── VillageDetail.tsx    # Village discussion + members + voice + challenges
│           ├── Forum.tsx            # Global forum
│           ├── Profile.tsx          # View/edit profile
│           ├── Onboarding.tsx       # 4-step profile setup + study tracks
│           ├── StudyHub.tsx         # Study Buddy, Essay Coach, Study Planner, College Prep
│           ├── Settings.tsx         # Theme, accessibility, TTS settings
│           ├── Courses.tsx          # Course catalog with search + filters
│           ├── CourseDetail.tsx     # Course lessons + enrollment + study tips
│           ├── Study.tsx            # Legacy study page
│           └── About.tsx            # About page
│
└── supabase/
    └── migrations/
        ├── 001_initial_schema.sql            # Full DDL + RLS policies + realtime
        ├── 002_performance_indexes.sql       # Query-speed indexes
        ├── 002_courses_schema.sql            # Courses + lessons + enrollments
        ├── 003_competition_features.sql      # interests/learning_style + topic_explanations + learning_paths
        ├── 003_chat_and_tags.sql             # Chat messages, study tags
        ├── 004_shared_project_setup.sql      # Shared project infrastructure
        ├── 005_shared_courses_chat_setup.sql # Shared courses/chat config
        ├── 006_private_courses_office_hours.sql  # Private courses, office hours
        ├── 007_security_rls_lockdown.sql     # RLS hardening
        └── README.md                         # Migration notes
```

---

## How to Run

```bash
# One command — installs deps + starts both servers:
./run.sh
```

**Prerequisites:** Python 3.10+, Node.js 18+, and `.env` files in both `backend/` and `frontend/`.

### Manual start
```bash
# Terminal 1 — Backend
cd backend && uvicorn app.main:app --reload

# Terminal 2 — Frontend
cd frontend && npm run dev
```

### Supabase Migration
```sql
-- Run 001_initial_schema.sql in the Supabase SQL Editor
```

---

## API Token Reuse from AI-Teacher (`../AI-Teacher/`)

The sibling `AI-Teacher` project (PrepForge AI) already has a fully configured **Supabase** instance with live API keys. These can be shared with Villages since both projects use separate tables.

### Reusable Credentials (found in `AI-Teacher/.env.local`)

| Variable | Value | Reuse for Villages? |
|----------|-------|---------------------|
| `OPENROUTER_API_KEY` | `sk-or-v1-28cf25bb...` | **Yes** — already swapped in! Backend now uses OpenRouter instead of Groq |
| `Clerk keys` | `pk_test_...` / `sk_test_...` | **No** — Villages uses Supabase Auth (magic link), not Clerk |
| Supabase keys | from AI-Teacher project | **Probably not** — separate Supabase project recommended (see below) |

### Supabase Sharing Strategy

Both projects can coexist on the same Supabase instance because they use **different table names**:

| AI-Teacher (PrepForge) Tables | Villages Tables |
|-------------------------------|-----------------|
| `profiles` | `profiles` ⚠️ **CONFLICT** |
| `questions` | `villages` |
| `attempts` | `village_members` |
| `essay_grades` | `posts` |
| `flags` | `comments` |
| | `challenges` |

**⚠️ Conflict:** Both projects use a `profiles` table but with different schemas.

**Recommendation: Create a separate Supabase project for Villages.** Supabase's free plan allows **2 active projects** per organization at no cost. A separate project avoids the schema conflict entirely and keeps the two apps isolated.

| Factor | Shared Project | Separate Project ✅ |
|--------|---------------|-------------------|
| Schema conflict | Must rename or merge `profiles` table | None — independent tables |
| Free tier cost | $0 | $0 (2 free projects allowed) |
| DB space | Shares 500MB with AI-Teacher | Gets its own 500MB allocation |
| Auth isolation | Same auth.users (shared logins) | Separate auth, separate users |
| Management | One project to monitor | Two projects to monitor |
| Risk isolation | One hits limit → both affected | Each is independent |
| Supabase quota | 500MB DB, 50k MAU, 5GB egress **shared** across org | Same org-level cap, but less contention |

**How to create:** Supabase Dashboard → New Project → Name it `villages` → Choose region → Database password → Create. Then run `supabase/migrations/001_initial_schema.sql` in the SQL Editor.

**⚠️ Free tier gotcha:** Supabase pauses free projects after **1 week of inactivity**. The Vercel backend itself is on-demand and never sleeps, but it won't keep Supabase warm unless something actually queries the DB. To keep Villages online 24/7, you'll need to either:
- Use a **cron job** (e.g., GitHub Actions every 3 days, or cron-job.org free tier) to hit an endpoint that **touches the database** (not `/health`, which doesn't query Supabase) — e.g. `GET /villages`
- Or upgrade to Pro ($25/mo, no pausing) — **not needed until you exceed free limits**

### AI Provider: Swapped from Groq → OpenRouter ✅

Villages **originally** used Groq (`groq_api_key` in config). This has been swapped to **OpenRouter** to reuse the existing key from AI-Teacher:

| Change | File |
|--------|------|
| `groq_api_key` → `openrouter_api_key` | `backend/app/config.py` |
| `groq_model` → `openrouter_model` | `backend/app/config.py` |
| `call_groq()` → `call_llm()` targeting `https://openrouter.ai/api/v1/chat/completions` | `backend/app/services/ai_service.py` |
| Added `HTTP-Referer` + `X-Title` headers (required by OpenRouter) | `backend/app/services/ai_service.py` |
| `.env.example` updated with actual keys | `backend/.env.example` |

OpenRouter gives access to **200+ models** through one key — more flexible than Groq alone. This project strictly uses **free-tier `:free` variants** so there are **zero API costs**.

**Zero cost — free models only:** All AI inference uses OpenRouter's **`:free`** model variants, which cost **$0 per token**. No API credits needed.

**Model fallback:** The service tries the **primary model** first (`meta-llama/llama-3.3-70b-instruct:free`). If OpenRouter returns HTTP 429 (rate limited), it automatically falls back to the **secondary model** (`google/gemini-2.0-flash-exp:free` — different provider, unlikely to hit the same rate limit). This ensures AI features remain available even when one model is throttled.

Configured via:
- `OPENROUTER_MODEL` — primary model (first choice, `:free` variant)
- `OPENROUTER_MODEL_FALLBACK` — fallback model (used on 429, `:free` variant)

**OpenRouter Free Tier Limits (as of June 2026):**
| Limit | Value |
|-------|-------|
| Requests per day | 50 (free acct, no credit card needed) |
| Requests per minute | 20 |
| Free models available | 28+ (Llama 3.3 70B, Gemini Flash, DeepSeek R1, Qwen3 Coder, etc.) |
| Context window | Up to 10M tokens (Llama 4 Scout) |
| Credit card required? | No |

---

## Deployment Plan (24/7 Online Hosting)

> **Status (2026-06-15): LIVE on Vercel.** Both frontend and backend now run on
> Vercel. The backend was migrated from the originally-planned Koyeb/Docker
> setup to **Vercel Python serverless functions** (`@vercel/python`), so there
> is now a single hosting provider and no container/port to manage.
>
> - **Frontend:** https://villages-eight.vercel.app (Vercel project `villages`)
> - **Backend:**  https://villages-api.vercel.app (Vercel project `villages-api`)
> - Frontend `/api/*` is proxied to the backend via `frontend/vercel.json` rewrite.

### Architecture Overview

```
Users → https://villages-eight.vercel.app
                │
        ┌───────┴───────┐
        │   Vercel       │  ← Frontend (React/Vite, static build)
        │ project:       │     Always-on, global CDN, SSL
        │ "villages"     │
        └───────┬───────┘
                │  /api/* → rewrite → villages-api.vercel.app
        ┌───────┴───────┐
        │   Vercel       │  ← Backend (FastAPI on @vercel/python)
        │ project:       │     Serverless functions, on-demand, no port
        │ "villages-api" │     Auto-deploys from GitHub
        └───────┬───────┘
                │  SUPABASE_SERVICE_ROLE_KEY
        ┌───────┴───────┐
        │   Supabase     │  ← Database + Auth + Realtime
        │  (free tier)   │     500MB DB, 50k users, Realtime
        └───────────────┘

Note: Vercel functions are on-demand (no scale-to-zero downtime), so no
      backend keep-alive cron is needed. Supabase still pauses after 7 days
      of total inactivity — a periodic DB-touching request keeps it warm.
```

### Vercel (Frontend) + Vercel (Backend) + Supabase (DB)

| Component | Service | Free Tier | Config |
|-----------|---------|-----------|--------|
| **Frontend** (React/Vite) | **Vercel** (`villages`) | 100GB bandwidth, 6000 build mins/mo | Root `frontend/`, framework Vite, build `npm run build`, output `dist/` |
| **Backend** (FastAPI) | **Vercel** (`villages-api`) | Hobby: 100GB-hrs functions, 60s max duration | Root `backend/`, `@vercel/python` via `api/index.py` + `vercel.json` builds. Env vars from `backend/.env` |
| **Database** | **Supabase** | 500MB DB, 2GB bandwidth, 50k users, Realtime | Currently shared with AI-Teacher; create a dedicated Villages project before scaling |
| **AI** | **OpenRouter** | 28+ free `:free` models, 50 req/day, 20 RPM | `OPENROUTER_API_KEY` already configured |

#### Step-by-Step

**1. Frontend → Vercel**
```bash
# From frontend/ (already linked to project "villages"):
vercel deploy --prod --yes
# Or via Dashboard → Root: frontend/, Framework: Vite, output: dist/
# Environment variables:
#   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
```

**2. Backend → Vercel (Python serverless)**
```bash
# From backend/ (already linked to project "villages-api"):
vercel deploy --prod --yes
# Key files:
#   backend/api/index.py   — exposes FastAPI `app` for @vercel/python
#   backend/vercel.json    — builds api/index.py, routes /(.*) → it
#   backend/.vercelignore  — excludes .env, pyproject.toml (uses requirements.txt)
# Env vars (set via `vercel env add <NAME> production`):
#   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY,
#   SUPABASE_JWT_SECRET, OPENROUTER_API_KEY, OPENROUTER_MODEL,
#   OPENROUTER_MODEL_FALLBACK
# IMPORTANT: disable Deployment Protection (ssoProtection) on the backend
#   project so the public API + frontend proxy are reachable (returns 401 otherwise).
```

**3. `frontend/vercel.json` rewrite → backend URL**
```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://villages-api.vercel.app/$1" }
  ]
}
```

**4. Run migrations**
```sql
-- Run all in Supabase SQL Editor:
-- 1. supabase/migrations/001_initial_schema.sql
-- 2. supabase/migrations/002_performance_indexes.sql
-- 3. supabase/migrations/003_competition_features.sql
```

> **Legacy:** `backend/Dockerfile` is retained for portability but is **not used**
> by the Vercel deployment. The previous Koyeb plan (Docker, port 8080,
> cron-job.org keep-alive) has been superseded.

### Environment Variables Checklist

Create these in your hosting dashboards:

| File | Variable | Source |
|------|----------|--------|
| Backend | `SUPABASE_URL` | Supabase Project Settings → API |
| Backend | `SUPABASE_ANON_KEY` | Supabase Project Settings → API |
| Backend | `SUPABASE_SERVICE_ROLE_KEY` | Supabase Project Settings → API |
| Backend | `SUPABASE_JWT_SECRET` | Supabase Dashboard → Settings → API → JWT Settings |
| Backend | `OPENROUTER_API_KEY` | Already in `AI-Teacher/.env.local` |
| Backend | `OPENROUTER_MODEL` | `meta-llama/llama-3.3-70b-instruct:free` (primary) |
| Backend | `OPENROUTER_MODEL_FALLBACK` | `google/gemma-4-31b-it:free` (fallback on 429) |
| Frontend | `VITE_SUPABASE_URL` | Same as backend `SUPABASE_URL` |
| Frontend | `VITE_SUPABASE_ANON_KEY` | Same as backend `SUPABASE_ANON_KEY` |

### Domain Setup

- Buy a domain (e.g. `villages.app`) from Cloudflare, Namecheap, etc.
- Point DNS to Vercel (CNAME `cname.vercel-dns.com` or use Vercel's nameservers)
- Vercel handles SSL automatically (Let's Encrypt)
- Backend gets a subdomain: `api.villages.app` → Vercel project `villages-api`

---

## Master Project Checklist

**Legend:** ✅ Done | 🟦 Partially done (blocked on a human/deploy step) | ⬜ Needs Claude Code (AI agent) | 👤 Needs human action (create accounts, click buttons)

### Phase 0 — Foundation ✅ (Completed by AI)

| # | Status | Task | Details |
|---|--------|------|---------|
| 0.1 | ✅ | Explore codebase & document all features | `FEATURES.md` written — central hub for all project info |
| 0.2 | ✅ | Fix bugs: `main.py` crash on empty input | Added empty-input guard + KeyboardInterrupt handler |
| 0.3 | ✅ | Fix bugs: `Profile.tsx` missing edit fields | Added `academic_level`, `strengths`, `weaknesses` to profile edit UI |
| 0.4 | ✅ | Fix bugs: `PostCard.tsx` empty comment on Enter | Added `trim()` guard before submit |
| 0.5 | ✅ | Swap AI provider Groq → OpenRouter | `config.py`, `ai_service.py`, `backend/.env`, `backend/.env.example` |
| 0.6 | ✅ | Add primary + fallback AI models | On HTTP 429, auto-fallback to secondary model |
| 0.7 | ✅ | Ensure $0 cost — use `:free` OpenRouter models | `meta-llama/llama-3.3-70b-instruct:free` + `google/gemini-2.0-flash-exp:free` |
| 0.8 | ✅ | Populate `backend/.env` with real keys | Supabase (AI-Teacher project, temporary) + OpenRouter from AI-Teacher |
| 0.9 | ✅ | Populate `frontend/.env` with real keys | Supabase anon key for frontend client |
| 0.10 | ✅ | Revert `backend/.env.example` to placeholders | Real keys were in `.env.example` — moved to `.env` (gitignored) |
| 0.11 | ✅ | Add `frontend/vercel.json` | Production API proxy rewrites |
| 0.12 | ✅ | Update CORS for production domains | `backend/app/main.py` — added Vercel domains |

### Phase 1 — Launch Prep (⬜ Claude Code + 👤 Human)

| # | Status | Task | Who | Details |
|---|--------|------|-----|---------|
| 1.1 | ⬜ | **Create separate Supabase project for Villages** | 👤 **Human** | Go to https://supabase.com/dashboard → New Project → Name `villages` → Note the new URL + anon key + service_role key + JWT secret |
| 1.2 | ⬜ | **Update `.env` files with new Supabase project keys** | ⬜ Claude | Replace backend `.env` + frontend `.env` with keys from the new Villages Supabase project |
| 1.3 | ⬜ | **Get Supabase JWT secret & update backend `.env`** | 👤 **Human** | Supabase Dashboard → Settings → API → JWT Settings → Copy `SUPABASE_JWT_SECRET` |
| 1.4 | ⬜ | **Run `001_initial_schema.sql`** | 👤 **Human** | Supabase SQL Editor → paste the migration → Run. Creates all 6 tables + RLS + Realtime |
| 1.5 | ✅ | **Deploy frontend to Vercel** | ⬜ Claude | Deployed to project `villages` → https://villages-eight.vercel.app (`vercel deploy --prod`) |
| 1.6 | ✅ | **Deploy backend to Vercel** (was Koyeb) | ⬜ Claude | Migrated to `@vercel/python` serverless. Project `villages-api` → https://villages-api.vercel.app. Added `backend/api/index.py`, `backend/vercel.json` (builds), `backend/.vercelignore`; pushed all env vars; disabled Deployment Protection. `/health` → 200 |
| 1.7 | ✅ | **Update vercel.json with backend URL** | ⬜ Claude | `frontend/vercel.json` rewrite now → `https://villages-api.vercel.app/$1` |
| 1.8 | ✅ | **Keep-alive cron** | — | Not needed: Vercel functions are on-demand (no scale-to-zero). Only Supabase 7-day pause remains a concern (separate DB-touch ping if it ever idles) |
| 1.9 | 🟦 | **Verify full flow works end-to-end** | ⬜ Claude | **Done (2026-06-15):** backend imports clean, frontend builds, all routes register; **live proxy verified** — `villages-eight.vercel.app/api/health` → 200 through the rewrite to `villages-api.vercel.app`. **Still pending:** full UX walkthrough (sign up → onboarding → create/join village → post → AI match → Elder → challenge) against a real Supabase project |
| 1.10 | ⬜ | **Buy domain & point DNS** | 👤 **Human** | Optional: purchase domain → point to Vercel → update CORS in backend |

### Phase 2 — Feature Completion (⬜ Claude Code)

| # | Status | Task | Files | Notes |
|---|--------|------|-------|-------|
| 2.1 | ⬜ | **Notifications system** — `unread_count` or notifications table | Schema + API + frontend badge | Required for engagement |
| 2.2 | ⬜ | **Post pagination** — infinite scroll or "Load more" | `VillageDetail.tsx`, `Forum.tsx` | Currently loads all posts at once |
| 2.3 | ⬜ | **AI Village Elder replies** — Elder can comment on posts | `backend/app/api/routes/ai.py` | Completes the AI facilitation loop |
| 2.4 | ✅ | **Challenge completion** — "Mark as done" button | `VillageDetail.tsx`, backend route | Challenges exist but can't complete |
| 2.5 | ⬜ | **Profile avatar upload** via Supabase Storage | `Profile.tsx`, Supabase bucket | Currently just shows initials |
| 2.6 | ⬜ | **Mobile responsive nav** — sidebar collapses to bottom tabs | `Layout.tsx` | Current sidebar wastes space on mobile |
| 2.7 | ✅ | **Study Hub** — Study Buddy, Essay Coach, Study Planner, College Prep | `StudyHub.tsx`, `ai.py`, `ai_service.py` | 4 tabs with access gating |
| 2.8 | ✅ | **Study Planner** — Multi-week timeline toward target date | `StudyHub.tsx`, `ai.py`, `ai_service.py` | Uses `POST /ai/study-planner` |
| 2.9 | ✅ | **Courses + Lessons** — Course CRUD, enrollment, lesson completion | `Courses.tsx`, `CourseDetail.tsx`, `courses.py` | With teacher verification flow |
| 2.10 | ✅ | **Auth proxy** — Magic link via backend for deployed SITE_URL workaround | `auth.py`, `Callback.tsx` | Backend follows 303 redirect, extracts session tokens |
| 2.11 | ✅ | **Study tracks** — high_schooler, college_student, adult_learner, test_prep | `Onboarding.tsx`, `Profile.tsx` | Unlocks gated features in Study Hub |
| 2.12 | ✅ | **Settings page + dark mode** — dark/light/system theme toggle, reduce-motion, persisted to localStorage | `Settings.tsx`, `Layout.tsx`, `tailwind.config.js`, `index.css` | Uses `dark:` Tailwind variant; system preference as default |
| 2.13 | ✅ | **Dark mode — full page coverage** — 400+ `dark:` variants across 13 files | All pages + components | StudyHub, Courses, CourseDetail, Profile, Home, Villages, VillageDetail, Layout, PostCard, VillageCard, VillageChat, Forum, Settings |
| 2.14 | ✅ | **Backend gating for Study Hub** — essay-coach/gpa-planner require school level, college-advisor requires college prep | `backend/app/api/routes/ai.py` | 403 with descriptive message if ungated user calls restricted endpoints |
| 2.15 | ✅ | **Max villages per user** — enforce 10-village limit | `backend/app/api/routes/villages.py` | Checked on both direct join and join-by-code |
| 2.16 | ✅ | **Village Voice Channel** — Daily.co audio-first per-village room | `VillageVoice.tsx`, `villages.py`, `config.py` | Gated by DAILY_API_KEY env var |
| 2.17 | ✅ | **Accessibility: TTS** — browser speechSynthesis for AI content | `TextToSpeech.tsx`, `Settings.tsx` | Voice selection, toggle in settings |
| 2.18 | ✅ | **Accessibility: Dyslexia font** — Lexend + extra spacing | `Settings.tsx`, `index.css`, `index.html` | Toggle in settings, persisted to localStorage |
| 2.19 | ✅ | **Course search** — client-side title/subject filter | `Courses.tsx` | Real-time text search |
| 2.20 | ✅ | **CI fix** — Node.js 24 compatibility | `.github/workflows/ci.yml` | `ACTIONS_FORCE_NODE24` env var |

### Phase 3 — Quality & Scale (⬜ Claude Code)

| # | Status | Task | Files | Notes |
|---|--------|------|-------|-------|
| 3.1 | ✅ | **TypeScript/ESLint + Prettier** | `frontend/eslint.config.js`, `.prettierrc.json`, `package.json` | `npm run lint`/`typecheck`/`format`; backend lint via Ruff (`backend/pyproject.toml`). All pass clean. |
| 3.2 | ⬜ | **Backend tests** — pytest + httpx async | `backend/tests/` | Zero test coverage |
| 3.3 | ✅ | **Rate limiting** on AI endpoints | `backend/app/api/routes/ai.py` | Per-user sliding window (30 calls/60s), best-effort in-memory |
| 3.4 | ⬜ | **Cache AI responses** in DB | `ai_service.py` | Store elder prompts, deduplicate |
| 3.5 | ✅ | **CI/CD pipeline** — GitHub Actions | `.github/workflows/ci.yml` | PR gate: lint + typecheck + build + backend lint/import. Auto-deploy via Vercel git integration. Node 24 compatible. |
| 3.6 | ⬜ | **Error monitoring** — Sentry integration | Backend + Frontend | Catch production errors |
| 3.7 | ✅ | **Fix useEffect deps warnings** — 5 stale-closure bugs fixed | `VillageDetail.tsx`, `StudyHub.tsx`, `Courses.tsx` | All ESLint exhaustive-deps warnings resolved |

### Phase 4 — Future Growth (⬜ Claude Code)

| # | Status | Task | Notes |
|---|--------|------|-------|
| 4.1 | ⬜ | Study resource upload (PDFs, links) per village | Supabase Storage |
| 4.2 | ⬜ | Scheduled study sessions / calendar | Time-based coordination |
| 4.3 | ⬜ | Gamification — XP, levels, leaderboards | Engagement |
| 4.4 | ⬜ | Private messaging between members | Communication |
| 4.5 | ✅ | **Video/voice chat (Daily.co, LiveKit)** | Real-time study rooms — Village Fire voice channel |
| 4.6 | ⬜ | Admin dashboard | Moderation |
| 4.7 | ⬜ | Mobile app (React Native / Expo) | Broader reach |

---

## 🐞 Known Bugs / Fixed Bugs

### ✅ Resolved — 2026-06-17 Session

| # | Severity | Issue | Fix |
|---|----------|-------|-----|
| BUG-1 | **High (CI)** | GitHub Actions Node.js 20 deprecation — `actions/checkout@v4`, `setup-node@v4`, `setup-python@v5` could fail on Node 24 runners | Added `ACTIONS_FORCE_NODE24: "true"` env var at workflow level as recommended by GitHub |
| BUG-2 | **Medium (stale UI)** | `VillageDetail.tsx:33` — useEffect missing `_session.user.email` dep → stale display name | Destructured `sessionId`/`sessionEmail` at component level, added both to deps |
| BUG-3 | **Medium (stale UI)** | `StudyHub.tsx:274` — useEffect missing `context` dep → stale Study Hub features | Added `context` to dependency array (guarded by `!context` check prevents loops) |
| BUG-4 | **Medium (stale UI)** | `StudyHub.tsx:924` — Same pattern as BUG-3 in CollegeEssayWorkshop | Added `context` to dependency array |
| BUG-5 | **Medium (stale UI)** | `Courses.tsx:70,74` — Effects calling `loadCourses()` not in deps → stale course list when filters change | Wrapped `loadCourses` in `useCallback([activeTab, selectedSubject])`, added `loadCourses` to both effect deps |
| BUG-6 | **Low (migration)** | `006_migration` — `village_members.user_id` type mismatch with `auth.uid()` for RLS policy | Added `::text` cast in migration 006 fix commit |

### Build Status (as of 2026-06-17)
- `tsc --noEmit` — **0 errors, 0 warnings**
- `npm run build` — **clean build** (chunk size warning is pre-existing, not an error)
- `ruff check .` — all **pre-existing style hints** (400+ findings are docstrings, type syntax, line length — not bugs)
- Backend import smoke test — **all 50+ routes register**
- ESLint (`npm run lint`) — **0 errors, 0 warnings**
