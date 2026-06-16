-- Migration 006: Private courses, office hours, private villages with invite codes

-- ── PROFILES: add interests/learning_style if not yet present ──
alter table public.profiles
  add column if not exists interests text[] not null default '{}';
alter table public.profiles
  add column if not exists learning_style text default 'visual';

-- ── COURSES: private + invite_code columns ──
alter table public.courses
  add column if not exists is_private boolean not null default false;
alter table public.courses
  add column if not exists invite_code text;

-- ── COURSE OFFICE HOURS ──
create table if not exists public.course_office_hours (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid references public.courses(id) on delete cascade not null,
  day_of_week integer not null check (day_of_week between 0 and 6),  -- 0=Sun, 6=Sat
  start_time time not null,
  end_time time not null,
  location text default '',  -- e.g. "Zoom link" or "Room 201"
  created_at timestamptz default now()
);

-- ── VILLAGES: private + invite_code columns ──
alter table public.villages
  add column if not exists is_private boolean not null default false;
alter table public.villages
  add column if not exists invite_code text;

-- ── INDEXES ──
create index if not exists idx_course_office_hours_course on public.course_office_hours (course_id);
create index if not exists idx_courses_invite_code on public.courses (invite_code);
create index if not exists idx_villages_invite_code on public.villages (invite_code);

-- ── RLS ──
alter table public.course_office_hours enable row level security;

do $$
begin
  -- course_office_hours: viewable by enrolled users + teacher, editable by teacher
  if not exists (select 1 from pg_policies where tablename = 'course_office_hours' and policyname = 'Enrolled can view office hours') then
    create policy "Enrolled can view office hours" on public.course_office_hours for select using (
      exists (select 1 from public.course_enrollments ce where ce.course_id = course_office_hours.course_id and ce.user_id = auth.uid())
      or
      exists (select 1 from public.courses c where c.id = course_office_hours.course_id and c.teacher_id = auth.uid())
    );
  end if;
  if not exists (select 1 from pg_policies where tablename = 'course_office_hours' and policyname = 'Teacher can manage office hours') then
    create policy "Teacher can manage office hours" on public.course_office_hours for insert with check (
      exists (select 1 from public.courses c where c.id = course_office_hours.course_id and c.teacher_id = auth.uid())
    );
  end if;
  if not exists (select 1 from pg_policies where tablename = 'course_office_hours' and policyname = 'Teacher can update office hours') then
    create policy "Teacher can update office hours" on public.course_office_hours for update using (
      exists (select 1 from public.courses c where c.id = course_office_hours.course_id and c.teacher_id = auth.uid())
    );
  end if;
  if not exists (select 1 from pg_policies where tablename = 'course_office_hours' and policyname = 'Teacher can delete office hours') then
    create policy "Teacher can delete office hours" on public.course_office_hours for delete using (
      exists (select 1 from public.courses c where c.id = course_office_hours.course_id and c.teacher_id = auth.uid())
    );
  end if;

  -- Update courses policy: private courses only visible to enrolled + teacher
  if not exists (select 1 from pg_policies where tablename = 'courses' and policyname = 'Public courses visible to all') then
    create policy "Public courses visible to all" on public.courses for select using (
      is_private = false
      or
      teacher_id = auth.uid()
      or
      exists (select 1 from public.course_enrollments ce where ce.course_id = courses.id and ce.user_id = auth.uid())
    );
  end if;

  -- Drop the old "Courses are viewable by everyone" policy if it exists
  if exists (select 1 from pg_policies where tablename = 'courses' and policyname = 'Courses are viewable by everyone') then
    drop policy "Courses are viewable by everyone" on public.courses;
  end if;

  -- Update villages policy: private villages only visible to members
  if not exists (select 1 from pg_policies where tablename = 'villages' and policyname = 'Public villages visible to all, private to members') then
    create policy "Public villages visible to all, private to members" on public.villages for select using (
      is_private = false
      or
      exists (select 1 from public.village_members vm where vm.village_id = villages.id and vm.user_id = auth.uid())
    );
  end if;

  -- Drop the old "Villages are viewable by everyone" policy if it exists
  if exists (select 1 from pg_policies where tablename = 'villages' and policyname = 'Villages are viewable by everyone') then
    drop policy "Villages are viewable by everyone" on public.villages;
  end if;
end $$;
