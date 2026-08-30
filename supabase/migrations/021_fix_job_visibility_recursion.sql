-- =========================================================
-- 021_fix_job_visibility_recursion.sql
-- 020_applicant_saver_job_visibility.sql's jobs_readable_by_saver_or_applicant
-- policy does `exists (select ... from job_applications ja where ja.job_id
-- = id ...)` directly inside a policy on `jobs`. Any query that joins
-- job_applications -> jobs (exactly the Applications dashboard query this
-- was written to fix) ends up evaluating jobs' RLS while already
-- evaluating a query that touches job_applications, which itself gets
-- RLS-checked again inside that subquery -- Postgres's row-security
-- recursion detector trips on this self-referencing shape and raises
-- "infinite recursion detected in policy for relation jobs". Same root
-- cause and same fix as 018_fix_employer_members_rls_recursion.sql:
-- move the check into a security-definer function, which runs as the
-- function owner and so isn't subject to the calling policy's RLS --
-- breaking the recursion. Found immediately while verifying 020 live,
-- before it ever reached a real user.
-- =========================================================

create or replace function public.has_saved_or_applied(target_job_id uuid)
returns boolean as $$
  select
    exists (select 1 from public.saved_jobs sj where sj.job_id = target_job_id and sj.user_id = auth.uid())
    or exists (select 1 from public.job_applications ja where ja.job_id = target_job_id and ja.user_id = auth.uid());
$$ language sql stable security definer set search_path = public;

drop policy "jobs_readable_by_saver_or_applicant" on public.jobs;
create policy "jobs_readable_by_saver_or_applicant" on public.jobs
  for select using (public.has_saved_or_applied(id));

drop policy "companies_readable_by_saver_or_applicant" on public.companies;
create policy "companies_readable_by_saver_or_applicant" on public.companies
  for select using (
    exists (select 1 from public.jobs j where j.company_id = id and public.has_saved_or_applied(j.id))
  );
