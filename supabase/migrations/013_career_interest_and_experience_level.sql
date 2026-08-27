-- =========================================================
-- 013_career_interest_and_experience_level.sql
-- Adds storage for two onboarding fields the UI spec calls for
-- (docs/screen-by-screen-ui-spec.md's Onboarding section) that the
-- original schema had no column/table for: experience level, and a
-- multi-select "which career categories are you interested in".
--
-- experience_level reuses the enum already defined in
-- 001_extensions_and_enums.sql (used elsewhere on jobs.experience_level).
-- =========================================================

alter table public.job_seeker_profiles
  add column experience_level experience_level;

-- Many-to-many: a job seeker can be interested in more than one career
-- category. References profiles(id) directly (not job_seeker_profiles)
-- so onboarding can write interests independently of upsert ordering.
create table public.job_seeker_career_interests (
  user_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid not null references public.career_categories(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, category_id)
);

alter table public.job_seeker_career_interests enable row level security;
create policy "job_seeker_career_interests_owner_all" on public.job_seeker_career_interests
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
