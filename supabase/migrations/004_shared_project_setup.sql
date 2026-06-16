-- Safe setup for existing shared Supabase project (AI-Teacher compatible)
-- Uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS everywhere
-- Can be run repeatedly without errors

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── PROFILES: extend existing table ──
-- (table already exists from AI-Teacher with id, email, created_at)
alter table public.profiles
  add column if not exists display_name text not null default '';

alter table public.profiles
  add column if not exists academic_level text not null default 'Student';

alter table public.profiles
  add column if not exists goals text[] not null default '{}';

alter table public.profiles
  add column if not exists strengths text[] not null default '{}';

alter table public.profiles
  add column if not exists weaknesses text[] not null default '{}';

alter table public.profiles
  add column if not exists interests text[] not null default '{}';

alter table public.profiles
  add column if not exists learning_style text default 'visual';

alter table public.profiles
  add column if not exists village_id uuid;

alter table public.profiles
  add column if not exists avatar_url text;

-- ── VILLAGES ──
create table if not exists public.villages (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text not null,
  focus_area text not null,
  resources text[] not null default '{}',
  max_members integer not null default 10,
  member_count integer not null default 0,
  is_active boolean not null default true,
  created_by text,
  created_at timestamptz default now()
);

-- ── VILLAGE MEMBERS ──
create table if not exists public.village_members (
  user_id text not null,
  village_id uuid not null,
  role text not null default 'member',
  joined_at timestamptz default now(),
  primary key (user_id, village_id)
);

-- ── POSTS ──
create table if not exists public.posts (
  id uuid primary key default uuid_generate_v4(),
  content text not null,
  author_id text not null,
  author_name text not null,
  village_id uuid,
  is_ai_generated boolean not null default false,
  upvotes integer not null default 0,
  created_at timestamptz default now()
);

-- ── COMMENTS ──
create table if not exists public.comments (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid,
  content text not null,
  author_id text not null,
  author_name text not null,
  is_ai_generated boolean not null default false,
  created_at timestamptz default now()
);

-- ── CHALLENGES ──
create table if not exists public.challenges (
  id uuid primary key default uuid_generate_v4(),
  village_id uuid,
  title text not null,
  description text not null,
  subject text not null,
  difficulty text not null default 'medium',
  is_collaborative boolean not null default true,
  generated_by_ai boolean not null default true,
  completed_by text[] not null default '{}',
  created_at timestamptz default now()
);

-- ── TOPIC EXPLANATIONS ──
create table if not exists public.topic_explanations (
  id uuid primary key default uuid_generate_v4(),
  village_id uuid,
  topic text not null,
  plain_language text not null,
  checklist jsonb not null default '[]',
  next_steps jsonb not null default '[]',
  generated_by_ai boolean not null default true,
  created_at timestamptz default now()
);

-- ── LEARNING PATHS ──
create table if not exists public.learning_paths (
  id uuid primary key default uuid_generate_v4(),
  village_id uuid,
  title text not null,
  description text not null,
  steps jsonb not null default '[]',
  generated_by_ai boolean not null default true,
  created_at timestamptz default now()
);

-- ── RLS ──
alter table public.profiles enable row level security;
alter table public.villages enable row level security;
alter table public.village_members enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.challenges enable row level security;
alter table public.topic_explanations enable row level security;
alter table public.learning_paths enable row level security;

-- RLS policies (safely drop + recreate to avoid duplicates)
do $$
begin
  -- Profiles
  if not exists (select 1 from pg_policies where policyname = 'Profiles are viewable by everyone' and tablename = 'profiles') then
    create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Users can update their own profile' and tablename = 'profiles') then
    create policy "Users can update their own profile" on public.profiles for update using (auth.uid()::text = id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Users can insert their own profile' and tablename = 'profiles') then
    create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid()::text = id);
  end if;

  -- Villages
  if not exists (select 1 from pg_policies where policyname = 'Villages are viewable by everyone' and tablename = 'villages') then
    create policy "Villages are viewable by everyone" on public.villages for select using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Authenticated users can create villages' and tablename = 'villages') then
    create policy "Authenticated users can create villages" on public.villages for insert with check (auth.role() = 'authenticated');
  end if;

  -- Posts
  if not exists (select 1 from pg_policies where policyname = 'Posts are viewable by everyone' and tablename = 'posts') then
    create policy "Posts are viewable by everyone" on public.posts for select using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Authenticated users can create posts' and tablename = 'posts') then
    create policy "Authenticated users can create posts" on public.posts for insert with check (auth.role() = 'authenticated' or author_id = 'village-elder-ai');
  end if;

  -- Comments
  if not exists (select 1 from pg_policies where policyname = 'Comments are viewable by everyone' and tablename = 'comments') then
    create policy "Comments are viewable by everyone" on public.comments for select using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Authenticated users can comment' and tablename = 'comments') then
    create policy "Authenticated users can comment" on public.comments for insert with check (auth.role() = 'authenticated');
  end if;

  -- Challenges
  if not exists (select 1 from pg_policies where policyname = 'Challenges are viewable by everyone' and tablename = 'challenges') then
    create policy "Challenges are viewable by everyone" on public.challenges for select using (true);
  end if;

  -- Village members
  if not exists (select 1 from pg_policies where policyname = 'Village members are viewable by everyone' and tablename = 'village_members') then
    create policy "Village members are viewable by everyone" on public.village_members for select using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Users can join villages' and tablename = 'village_members') then
    create policy "Users can join villages" on public.village_members for insert with check (auth.uid()::text = user_id);
  end if;

  -- Topic explanations
  if not exists (select 1 from pg_policies where policyname = 'Topic explanations are viewable by everyone' and tablename = 'topic_explanations') then
    create policy "Topic explanations are viewable by everyone" on public.topic_explanations for select using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Anyone can insert topic explanations' and tablename = 'topic_explanations') then
    create policy "Anyone can insert topic explanations" on public.topic_explanations for insert with check (true);
  end if;

  -- Learning paths
  if not exists (select 1 from pg_policies where policyname = 'Learning paths are viewable by everyone' and tablename = 'learning_paths') then
    create policy "Learning paths are viewable by everyone" on public.learning_paths for select using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Anyone can insert learning paths' and tablename = 'learning_paths') then
    create policy "Anyone can insert learning paths" on public.learning_paths for insert with check (true);
  end if;
end $$;

-- ── REALTIME ──
-- Use a safe approach that won't error if already a member
do $$
begin
  perform from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'posts';
  if not found then
    alter publication supabase_realtime add table public.posts;
  end if;

  perform from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'comments';
  if not found then
    alter publication supabase_realtime add table public.comments;
  end if;

  perform from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'topic_explanations';
  if not found then
    alter publication supabase_realtime add table public.topic_explanations;
  end if;

  perform from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'learning_paths';
  if not found then
    alter publication supabase_realtime add table public.learning_paths;
  end if;
end $$;

-- ── INDEXES ──
create index if not exists idx_villages_active_focus
  on public.villages (is_active, focus_area);

create index if not exists idx_posts_village_created
  on public.posts (village_id, created_at desc);

create index if not exists idx_posts_global_created
  on public.posts (created_at desc)
  where village_id is null;

create index if not exists idx_comments_post_created
  on public.comments (post_id, created_at);

create index if not exists idx_village_members_village
  on public.village_members (village_id);

create index if not exists idx_village_members_user
  on public.village_members (user_id);

create index if not exists idx_profiles_village
  on public.profiles (village_id);
