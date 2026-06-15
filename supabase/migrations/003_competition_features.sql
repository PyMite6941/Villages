-- Competition Features: Group Learning, Topic Explorer, Adult Learners
-- Extends profiles + adds topic_explanations and learning_paths tables

-- Extend profiles with broader interests and learning style
alter table public.profiles
  add column if not exists interests text[] not null default '{}',
  add column if not exists learning_style text default 'visual';  -- visual, auditory, reading, kinesthetic

-- Topic explanations: AI-generated plain-language breakdowns for groups
create table if not exists public.topic_explanations (
  id uuid primary key default uuid_generate_v4(),
  village_id uuid references public.villages(id) on delete cascade,
  topic text not null,
  plain_language text not null,
  checklist jsonb not null default '[]',
  next_steps jsonb not null default '[]',
  generated_by_ai boolean not null default true,
  created_at timestamptz default now()
);

-- Learning paths: structured educational plans for villages
create table if not exists public.learning_paths (
  id uuid primary key default uuid_generate_v4(),
  village_id uuid references public.villages(id) on delete cascade,
  title text not null,
  description text not null,
  steps jsonb not null default '[]',  -- [{title, description, estimated_minutes}]
  generated_by_ai boolean not null default true,
  created_at timestamptz default now()
);

-- RLS
alter table public.topic_explanations enable row level security;
alter table public.learning_paths enable row level security;

create policy "Topic explanations are viewable by everyone"
  on public.topic_explanations for select using (true);
create policy "Anyone can insert topic explanations"
  on public.topic_explanations for insert with check (true);

create policy "Learning paths are viewable by everyone"
  on public.learning_paths for select using (true);
create policy "Anyone can insert learning paths"
  on public.learning_paths for insert with check (true);

-- Enable Realtime for new tables
alter publication supabase_realtime add table public.topic_explanations;
alter publication supabase_realtime add table public.learning_paths;
