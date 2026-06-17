-- Migration 009: free-form tags on courses for granular filtering.
-- e.g. an AP Calculus course can be tagged ["Math","AP","Calculus","Limits",...].
-- Idempotent.

alter table public.courses
  add column if not exists tags text[] not null default '{}';

-- GIN index so tag filters (tags @> '{...}') are fast.
create index if not exists idx_courses_tags on public.courses using gin (tags);
