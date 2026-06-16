-- Migration 006: Security hardening — lock down profiles row-level security.
--
-- Problem: the profiles SELECT policy was `USING (true)`, and the Supabase anon
-- key is public, so anyone could run `from('profiles').select('email')` via
-- PostgREST and harvest every user's email address.
--
-- Fix: a signed-in user may read ONLY their own profile row directly. All
-- cross-user reads the app needs (author names on posts/courses, member lists,
-- etc.) go through the FastAPI backend using the service-role key, which bypasses
-- RLS — so tightening this does not break those features.
--
-- Idempotent and safe to run repeatedly.

alter table public.profiles enable row level security;

-- Remove the over-permissive public read policy if present.
drop policy if exists "Profiles are viewable by everyone" on public.profiles;

-- Own-row read only (covers any direct client read of the signed-in user).
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'profiles' and policyname = 'Users can view their own profile (own row)'
  ) then
    create policy "Users can view their own profile (own row)"
      on public.profiles for select
      using (auth.uid()::text = id);
  end if;
end $$;
