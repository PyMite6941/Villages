-- Migration 002: Courses, Lessons, Enrollments, Village Scholar verification

-- Add teacher & bio fields to profiles
alter table public.profiles
  add column if not exists is_verified_teacher boolean not null default false,
  add column if not exists teacher_subjects text[] not null default '{}',
  add column if not exists bio text;

-- Village Scholar verification applications
create table public.teacher_verifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  degree_title text not null,
  institution text not null,
  subject_area text not null,
  status text not null default 'verified', -- auto-approved on honor system
  created_at timestamptz default now()
);

-- Courses (school and hobby)
create table public.courses (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text not null,
  category text not null default 'school', -- 'school' | 'hobby'
  subject text not null,
  teacher_id uuid references auth.users(id) on delete set null,
  teacher_name text not null,
  teacher_is_verified boolean not null default false,
  difficulty text not null default 'beginner', -- beginner | intermediate | advanced
  estimated_hours integer not null default 1,
  thumbnail_emoji text not null default '📚',
  enrollment_count integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz default now()
);

-- Lessons within courses
create table public.lessons (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid references public.courses(id) on delete cascade not null,
  title text not null,
  content text not null,
  order_index integer not null default 0,
  duration_minutes integer not null default 15,
  created_at timestamptz default now()
);

-- Course enrollments with per-lesson progress tracking
create table public.course_enrollments (
  user_id uuid references auth.users(id) on delete cascade not null,
  course_id uuid references public.courses(id) on delete cascade not null,
  completed_lesson_ids text[] not null default '{}',
  enrolled_at timestamptz default now(),
  primary key (user_id, course_id)
);

-- RLS Policies
alter table public.teacher_verifications enable row level security;
alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.course_enrollments enable row level security;

create policy "Users can view their own verifications" on public.teacher_verifications
  for select using (auth.uid() = user_id);
create policy "Users can apply for verification" on public.teacher_verifications
  for insert with check (auth.uid() = user_id);

create policy "Courses are viewable by everyone" on public.courses for select using (true);
create policy "Authenticated users can create courses" on public.courses
  for insert with check (auth.role() = 'authenticated');
create policy "Teachers can update their courses" on public.courses
  for update using (auth.uid() = teacher_id);

create policy "Lessons are viewable by everyone" on public.lessons for select using (true);
create policy "Authenticated users can create lessons" on public.lessons
  for insert with check (auth.role() = 'authenticated');

create policy "Users can view their own enrollments" on public.course_enrollments
  for select using (auth.uid() = user_id);
create policy "Users can enroll in courses" on public.course_enrollments
  for insert with check (auth.uid() = user_id);
create policy "Users can update their own enrollment progress" on public.course_enrollments
  for update using (auth.uid() = user_id);
