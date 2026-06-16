-- Migration 005: Idempotent setup for Courses, Village Scholar, and Chat on the
-- SHARED Supabase project (AI-Teacher compatible).
--
-- Why this exists: 002_courses_schema.sql and 003_chat_and_tags.sql create the
-- courses/lessons/enrollments/teacher_verifications/messages tables, but they are
-- NOT idempotent (plain `create table`, ungated `create policy`,
-- `alter publication ... add table`). On the shared project, 004 only created the
-- original 8 tables, so these features 500 at runtime ("relation does not exist").
--
-- This migration uses IF NOT EXISTS / guarded policy creation everywhere, so it is
-- safe to run repeatedly and safe to run after 004. Run it in the Supabase SQL
-- Editor once to enable Courses, Knowledge Grove, Village Scholar, and Village Chat.

create extension if not exists "uuid-ossp";

-- ── PROFILES: teacher + tag columns ──
alter table public.profiles
  add column if not exists is_verified_teacher boolean not null default false;
alter table public.profiles
  add column if not exists teacher_subjects text[] not null default '{}';
alter table public.profiles
  add column if not exists bio text;
alter table public.profiles
  add column if not exists study_tags text[] not null default '{}';

-- ── TEACHER VERIFICATIONS (Village Scholar) ──
create table if not exists public.teacher_verifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  degree_title text not null,
  institution text not null,
  subject_area text not null,
  status text not null default 'verified',
  created_at timestamptz default now()
);

-- ── COURSES ──
create table if not exists public.courses (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text not null,
  category text not null default 'school',
  subject text not null,
  teacher_id uuid references auth.users(id) on delete set null,
  teacher_name text not null,
  teacher_is_verified boolean not null default false,
  difficulty text not null default 'beginner',
  estimated_hours integer not null default 1,
  thumbnail_emoji text not null default '📚',
  enrollment_count integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz default now()
);

-- ── LESSONS ──
create table if not exists public.lessons (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid references public.courses(id) on delete cascade not null,
  title text not null,
  content text not null,
  order_index integer not null default 0,
  duration_minutes integer not null default 15,
  video_url text,
  created_at timestamptz default now()
);

-- New columns (safe if the tables already existed before this migration)
alter table public.courses add column if not exists source text;
alter table public.lessons add column if not exists video_url text;

-- ── COURSE ENROLLMENTS ──
create table if not exists public.course_enrollments (
  user_id uuid references auth.users(id) on delete cascade not null,
  course_id uuid references public.courses(id) on delete cascade not null,
  completed_lesson_ids text[] not null default '{}',
  enrolled_at timestamptz default now(),
  primary key (user_id, course_id)
);

-- ── MESSAGES (Village Chat) ──
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  village_id uuid references public.villages(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  author_name text not null,
  content text not null,
  message_type text default 'text' check (message_type in ('text', 'code', 'link')),
  reply_to_id uuid references public.messages(id) on delete set null,
  reply_preview text,
  is_pinned boolean default false,
  created_at timestamptz default now()
);

create index if not exists messages_village_idx on public.messages (village_id, created_at);
create index if not exists idx_courses_published_category on public.courses (is_published, category);
create index if not exists idx_lessons_course_order on public.lessons (course_id, order_index);
create index if not exists idx_enrollments_user on public.course_enrollments (user_id);

-- ── RLS ──
alter table public.teacher_verifications enable row level security;
alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.course_enrollments enable row level security;
alter table public.messages enable row level security;

do $$
begin
  -- teacher_verifications
  if not exists (select 1 from pg_policies where tablename = 'teacher_verifications' and policyname = 'Users can view their own verifications') then
    create policy "Users can view their own verifications" on public.teacher_verifications for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'teacher_verifications' and policyname = 'Users can apply for verification') then
    create policy "Users can apply for verification" on public.teacher_verifications for insert with check (auth.uid() = user_id);
  end if;

  -- courses
  if not exists (select 1 from pg_policies where tablename = 'courses' and policyname = 'Courses are viewable by everyone') then
    create policy "Courses are viewable by everyone" on public.courses for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'courses' and policyname = 'Authenticated users can create courses') then
    create policy "Authenticated users can create courses" on public.courses for insert with check (auth.role() = 'authenticated');
  end if;
  if not exists (select 1 from pg_policies where tablename = 'courses' and policyname = 'Teachers can update their courses') then
    create policy "Teachers can update their courses" on public.courses for update using (auth.uid() = teacher_id);
  end if;

  -- lessons
  if not exists (select 1 from pg_policies where tablename = 'lessons' and policyname = 'Lessons are viewable by everyone') then
    create policy "Lessons are viewable by everyone" on public.lessons for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'lessons' and policyname = 'Authenticated users can create lessons') then
    create policy "Authenticated users can create lessons" on public.lessons for insert with check (auth.role() = 'authenticated');
  end if;

  -- course_enrollments
  if not exists (select 1 from pg_policies where tablename = 'course_enrollments' and policyname = 'Users can view their own enrollments') then
    create policy "Users can view their own enrollments" on public.course_enrollments for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'course_enrollments' and policyname = 'Users can enroll in courses') then
    create policy "Users can enroll in courses" on public.course_enrollments for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'course_enrollments' and policyname = 'Users can update their own enrollment progress') then
    create policy "Users can update their own enrollment progress" on public.course_enrollments for update using (auth.uid() = user_id);
  end if;

  -- messages
  if not exists (select 1 from pg_policies where tablename = 'messages' and policyname = 'village_members_read_messages') then
    create policy "village_members_read_messages" on public.messages for select using (
      exists (select 1 from public.village_members vm where vm.village_id = messages.village_id and vm.user_id::text = auth.uid()::text)
    );
  end if;
  if not exists (select 1 from pg_policies where tablename = 'messages' and policyname = 'village_members_insert_messages') then
    create policy "village_members_insert_messages" on public.messages for insert with check (
      auth.uid() = user_id and
      exists (select 1 from public.village_members vm where vm.village_id = messages.village_id and vm.user_id::text = auth.uid()::text)
    );
  end if;
  if not exists (select 1 from pg_policies where tablename = 'messages' and policyname = 'village_members_update_messages') then
    create policy "village_members_update_messages" on public.messages for update using (
      exists (select 1 from public.village_members vm where vm.village_id = messages.village_id and vm.user_id::text = auth.uid()::text)
    );
  end if;
end $$;

-- ── REALTIME (safe add) ──
do $$
begin
  perform from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages';
  if not found then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;
