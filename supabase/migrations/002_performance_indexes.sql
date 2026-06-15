-- ─────────────────────────────────────────────────────────────
--  Villages — Performance Indexes
--  Run after 001_initial_schema.sql.
--  Optimizes the most frequent query patterns:
--    - Listing villages by active status + focus area
--    - Fetching posts by village (scoped or global) ordered by date
--    - Fetching comments by post ordered by date
--    - Looking up members by village
--    - Looking up user's village membership
-- ─────────────────────────────────────────────────────────────

-- Villages: filter by active + focus area (used on Villages listing page)
create index if not exists idx_villages_active_focus
  on public.villages (is_active, focus_area);

-- Posts: scoped to a village, sorted by most recent (used on VillageDetail)
create index if not exists idx_posts_village_created
  on public.posts (village_id, created_at desc);

-- Posts: global forum, sorted by most recent (used on Forum page)
create index if not exists idx_posts_global_created
  on public.posts (created_at desc)
  where village_id is null;

-- Comments: by post, sorted chronologically (used on PostCard)
create index if not exists idx_comments_post_created
  on public.comments (post_id, created_at);

-- Village members: lookup by village (used on Members tab)
create index if not exists idx_village_members_village
  on public.village_members (village_id);

-- Village members: lookup by user (used on join checks)
create index if not exists idx_village_members_user
  on public.village_members (user_id);

-- Profiles: lookup by village (used for member profiles)
create index if not exists idx_profiles_village
  on public.profiles (village_id);

-- Realtime: ensure publication includes all indexed tables
alter publication supabase_realtime add table public.posts;
alter publication supabase_realtime add table public.comments;
