-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text not null,
  academic_level text not null,
  goals text[] not null default '{}',
  strengths text[] not null default '{}',
  weaknesses text[] not null default '{}',
  village_id uuid,
  avatar_url text,
  created_at timestamptz default now()
);

-- Villages (study cohorts)
create table public.villages (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text not null,
  focus_area text not null,
  resources text[] not null default '{}',
  max_members integer not null default 10,
  member_count integer not null default 0,
  is_active boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- Village membership
create table public.village_members (
  user_id uuid references auth.users(id) on delete cascade,
  village_id uuid references public.villages(id) on delete cascade,
  role text not null default 'member',
  joined_at timestamptz default now(),
  primary key (user_id, village_id)
);

-- Posts (forum posts — village-scoped or global)
create table public.posts (
  id uuid primary key default uuid_generate_v4(),
  content text not null,
  author_id text not null,  -- text to allow "village-elder-ai" synthetic author
  author_name text not null,
  village_id uuid references public.villages(id) on delete cascade,
  is_ai_generated boolean not null default false,
  upvotes integer not null default 0,
  created_at timestamptz default now()
);

-- Comments
create table public.comments (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid references public.posts(id) on delete cascade,
  content text not null,
  author_id text not null,
  author_name text not null,
  is_ai_generated boolean not null default false,
  created_at timestamptz default now()
);

-- Collaborative challenges
create table public.challenges (
  id uuid primary key default uuid_generate_v4(),
  village_id uuid references public.villages(id) on delete cascade,
  title text not null,
  description text not null,
  subject text not null,
  difficulty text not null default 'medium',
  is_collaborative boolean not null default true,
  generated_by_ai boolean not null default true,
  completed_by text[] not null default '{}',
  created_at timestamptz default now()
);

-- RLS Policies
alter table public.profiles enable row level security;
alter table public.villages enable row level security;
alter table public.village_members enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.challenges enable row level security;

-- Profiles: users can read all, update their own
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);

-- Villages: viewable by all, creatable by authenticated
create policy "Villages are viewable by everyone" on public.villages for select using (true);
create policy "Authenticated users can create villages" on public.villages for insert with check (auth.role() = 'authenticated');

-- Posts: viewable by all, insertable by authenticated
create policy "Posts are viewable by everyone" on public.posts for select using (true);
create policy "Authenticated users can create posts" on public.posts for insert with check (auth.role() = 'authenticated' or author_id = 'village-elder-ai');

-- Comments: viewable by all
create policy "Comments are viewable by everyone" on public.comments for select using (true);
create policy "Authenticated users can comment" on public.comments for insert with check (auth.role() = 'authenticated');

-- Challenges: village members can view
create policy "Challenges are viewable by everyone" on public.challenges for select using (true);

-- Village members
create policy "Village members are viewable by everyone" on public.village_members for select using (true);
create policy "Users can join villages" on public.village_members for insert with check (auth.uid() = user_id);

-- Enable Realtime for live chat
alter publication supabase_realtime add table public.posts;
alter publication supabase_realtime add table public.comments;
