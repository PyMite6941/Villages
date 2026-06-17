-- Migration 008: Village moderation — chief settings, member muting, bans.
-- Idempotent and safe to run on the shared project. Run after 004-007.
--
-- Backend uses the service-role key (bypasses RLS); the frontend reads bans only
-- through the backend, so village_bans has RLS enabled with no public policy.

-- ── VILLAGES: AI moderation toggle (chief setting) ──
alter table public.villages
  add column if not exists ai_moderation boolean not null default true;

-- ── VILLAGE MEMBERS: temporary mute ──
alter table public.village_members
  add column if not exists muted_until timestamptz;

-- ── VILLAGE BANS ──
-- user_id / banned_by are text to match village_members.user_id (text) in the
-- shared schema.
create table if not exists public.village_bans (
  id uuid primary key default gen_random_uuid(),
  village_id uuid references public.villages(id) on delete cascade not null,
  user_id text not null,
  banned_by text not null,
  reason text default '',
  created_at timestamptz default now()
);

create unique index if not exists uq_village_bans_village_user
  on public.village_bans (village_id, user_id);
create index if not exists idx_village_bans_village
  on public.village_bans (village_id);

alter table public.village_bans enable row level security;
-- No public policy: only the service-role backend reads/writes bans.
