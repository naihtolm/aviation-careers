-- =========================================================
-- 019_job_expiry_public_visibility.sql
-- Sprint 6 follow-up: wire up the "expired" job status. A separate daily
-- cron (api/cron/expire-jobs) flips jobs.status to 'expired' once
-- expires_at passes, but that only runs once a day -- without this,
-- an overdue job would stay publicly visible for up to 24h past its
-- expiry. So expiry is *also* encoded directly into the public-read RLS
-- policies: a job (and its child rows) stops being publicly visible the
-- instant expires_at is in the past, independent of the cron's cadence.
-- The employer's own view is unaffected (jobs_employer_manage has no
-- status/expiry condition), so they can still see and renew an overdue
-- listing from their dashboard even before the cron catches up.
-- =========================================================

drop policy "jobs_public_read_active" on public.jobs;
create policy "jobs_public_read_active" on public.jobs
  for select using (status = 'active' and (expires_at is null or expires_at > now()));

drop policy "job_locations_public_read" on public.job_locations;
create policy "job_locations_public_read" on public.job_locations
  for select using (
    exists (
      select 1 from public.jobs j where j.id = job_id
      and j.status = 'active' and (j.expires_at is null or j.expires_at > now())
    )
  );

drop policy "job_compensation_public_read" on public.job_compensation;
create policy "job_compensation_public_read" on public.job_compensation
  for select using (
    exists (
      select 1 from public.jobs j where j.id = job_id
      and j.status = 'active' and (j.expires_at is null or j.expires_at > now())
    )
  );

drop policy "job_requirements_public_read" on public.job_requirements;
create policy "job_requirements_public_read" on public.job_requirements
  for select using (
    exists (
      select 1 from public.jobs j where j.id = job_id
      and j.status = 'active' and (j.expires_at is null or j.expires_at > now())
    )
  );

drop policy "job_skills_public_read" on public.job_skills;
create policy "job_skills_public_read" on public.job_skills
  for select using (
    exists (
      select 1 from public.jobs j where j.id = job_id
      and j.status = 'active' and (j.expires_at is null or j.expires_at > now())
    )
  );

drop policy "job_certifications_public_read" on public.job_certifications;
create policy "job_certifications_public_read" on public.job_certifications
  for select using (
    exists (
      select 1 from public.jobs j where j.id = job_id
      and j.status = 'active' and (j.expires_at is null or j.expires_at > now())
    )
  );
