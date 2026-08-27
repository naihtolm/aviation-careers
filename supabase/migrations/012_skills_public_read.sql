-- =========================================================
-- 012_skills_public_read.sql
-- Same gap as 011, just missed on that pass: `skills` had no RLS policy
-- (RLS-enabled-by-default, zero policies), so embedded reads of
-- user_skills -> skills would silently return null for the skill name.
-- =========================================================

alter table public.skills enable row level security;
create policy "skills_public_read" on public.skills
  for select using (true);
