-- Migration 008: Village moderation tools
--
-- Adds:
--   1. `muted_until` (timestamptz, nullable) on village_members — chief can mute
--   2. `village_bans` table — permanently banned users
--   3. `ai_moderation` boolean on villages — toggle auto-AI Elder moderation
--   4. Index for ban lookups

-- ── 1. Village member mute ──────────────────────────────────────────────────
alter table public.village_members
  add column if not exists muted_until timestamptz;

-- ── 2. Village bans ─────────────────────────────────────────────────────────
create table if not exists public.village_bans (
  id uuid primary key default gen_random_uuid(),
  village_id uuid not null references public.villages(id) on delete cascade,
  user_id text not null,
  banned_by text not null,
  reason text default '',
  created_at timestamptz not null default now(),
  unique (village_id, user_id)
);

-- ── 3. AI moderation toggle on villages ─────────────────────────────────────
alter table public.villages
  add column if not exists ai_moderation boolean not null default true;

-- ── 4. Index ────────────────────────────────────────────────────────────────
create index if not exists idx_village_bans_lookup
  on public.village_bans (village_id, user_id);

-- ── 5. RLS for bans ─────────────────────────────────────────────────────────
alter table public.village_bans enable row level security;
-- No public policy: only the service-role backend reads/writes bans.
