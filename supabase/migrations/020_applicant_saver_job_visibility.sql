-- =========================================================
-- 020_applicant_saver_job_visibility.sql
-- Sprint 8 testing pass: a job seeker's own Applications and Saved Jobs
-- dashboards join jobs (and jobs -> companies) through the RLS-respecting
-- session client. jobs_public_read_active only allows reading a job while
-- it's status='active' (and, since migration 019, non-expired) -- so the
-- instant an employer pauses, archives, or lets a job expire, every job
-- seeker who saved or applied to it loses the joined title/company on
-- their own dashboard, even though their saved_jobs/job_applications row
-- (both owner-only RLS, unaffected) still exists. This will happen
-- constantly in production as listings naturally close over their
-- lifecycle -- found by re-testing the Applications dashboard against a
-- job archived earlier in Sprint 6 testing (applied count said 2, only 1
-- card rendered).
--
-- Fix: add a second permissive read policy -- a user can always read a
-- job (and its company) they've personally saved or applied to,
-- regardless of that job's current status. Postgres ORs multiple
-- permissive policies together, so this only adds visibility on top of
-- the existing public/employer policies, never removes any.
-- =========================================================

create policy "jobs_readable_by_saver_or_applicant" on public.jobs
  for select using (
    exists (select 1 from public.saved_jobs sj where sj.job_id = id and sj.user_id = auth.uid())
    or exists (select 1 from public.job_applications ja where ja.job_id = id and ja.user_id = auth.uid())
  );

create policy "companies_readable_by_saver_or_applicant" on public.companies
  for select using (
    exists (
      select 1 from public.jobs j
      where j.company_id = id
      and (
        exists (select 1 from public.saved_jobs sj where sj.job_id = j.id and sj.user_id = auth.uid())
        or exists (select 1 from public.job_applications ja where ja.job_id = j.id and ja.user_id = auth.uid())
      )
    )
  );
