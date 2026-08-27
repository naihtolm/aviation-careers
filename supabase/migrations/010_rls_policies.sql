-- =========================================================
-- 010_rls_policies.sql
-- Row Level Security for the tables that matter most in V1.
--
-- Pattern used throughout:
--   - Public reference data (careers, airports, salary_aggregates, etc.)
--     -> RLS enabled, single "anyone can read" policy, no write policy
--       for regular users (writes go through service role / admin only).
--   - Personal data (resumes, profiles, saved_jobs, applications, alerts)
--     -> owner-only read/write via auth.uid().
--   - Employer data (jobs, company profile)
--     -> employer org members can manage rows tied to their company_id.
--   - Everything defaults to "admins bypass via service role", not via
--     a client-side RLS carve-out — never grant "platform_admin can do
--     anything" as a normal RLS policy checked on every request path if
--     it can instead be a server-side/service-role operation.
--
-- Apply this same pattern to every remaining table as each feature
-- (employer platform, admin platform, training marketplace) is built —
-- do not ship a table to production without an explicit RLS policy.
-- =========================================================

-- profiles ----------------------------------------------------------------
alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid());

create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());

-- job_seeker_profiles -------------------------------------------------------
alter table public.job_seeker_profiles enable row level security;

create policy "job_seeker_profiles_owner_all" on public.job_seeker_profiles
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- resumes + related private layers ------------------------------------------
alter table public.resumes enable row level security;
alter table public.resume_processing_jobs enable row level security;
alter table public.resume_parses enable row level security;
alter table public.user_experience enable row level security;
alter table public.user_education enable row level security;
alter table public.user_skills enable row level security;
alter table public.user_certifications enable row level security;

create policy "resumes_owner_all" on public.resumes
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "resume_processing_jobs_owner_select" on public.resume_processing_jobs
  for select using (
    exists (select 1 from public.resumes r where r.id = resume_id and r.user_id = auth.uid())
  );

create policy "resume_parses_owner_select" on public.resume_parses
  for select using (
    exists (select 1 from public.resumes r where r.id = resume_id and r.user_id = auth.uid())
  );

create policy "user_experience_owner_all" on public.user_experience
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "user_education_owner_all" on public.user_education
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "user_skills_owner_all" on public.user_skills
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "user_certifications_owner_all" on public.user_certifications
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- NOTE: certificate_number_encrypted should also be excluded at the
-- application/API layer (e.g. a view without that column) for any
-- future "employer discoverable profile" feature — RLS alone controls
-- row access, not column-level redaction.

-- saved_jobs / job_applications / job_alerts --------------------------------
alter table public.saved_jobs enable row level security;
alter table public.job_applications enable row level security;
alter table public.job_alerts enable row level security;

create policy "saved_jobs_owner_all" on public.saved_jobs
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "job_applications_owner_all" on public.job_applications
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "job_alerts_owner_all" on public.job_alerts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Public reference/browse data ------------------------------------------
alter table public.careers enable row level security;
alter table public.career_categories enable row level security;
alter table public.career_content enable row level security;
alter table public.career_aliases enable row level security;
alter table public.airports enable row level security;
alter table public.locations enable row level security;
alter table public.salary_aggregates enable row level security;
alter table public.training_providers enable row level security;
alter table public.training_programs enable row level security;

create policy "careers_public_read" on public.careers for select using (active = true);
create policy "career_categories_public_read" on public.career_categories for select using (true);
create policy "career_content_public_read" on public.career_content for select using (published_at is not null);
create policy "career_aliases_public_read" on public.career_aliases for select using (true);
create policy "airports_public_read" on public.airports for select using (active = true);
create policy "locations_public_read" on public.locations for select using (true);
create policy "salary_aggregates_public_read" on public.salary_aggregates for select using (true);
create policy "training_providers_public_read" on public.training_providers for select using (active = true);
create policy "training_programs_public_read" on public.training_programs for select using (active = true);

-- Jobs + companies (public read of active jobs; employer-managed writes) --
alter table public.jobs enable row level security;
alter table public.companies enable row level security;
alter table public.job_locations enable row level security;
alter table public.job_compensation enable row level security;
alter table public.job_requirements enable row level security;
alter table public.job_skills enable row level security;
alter table public.job_certifications enable row level security;

create policy "jobs_public_read_active" on public.jobs
  for select using (status = 'active');

create policy "jobs_employer_manage" on public.jobs
  for all using (public.is_employer_member(company_id))
  with check (public.is_employer_member(company_id));

create policy "companies_public_read" on public.companies
  for select using (status = 'active');

create policy "companies_employer_manage" on public.companies
  for update using (public.is_employer_member(id));

create policy "job_locations_public_read" on public.job_locations
  for select using (
    exists (select 1 from public.jobs j where j.id = job_id and j.status = 'active')
  );
create policy "job_locations_employer_manage" on public.job_locations
  for all using (
    exists (select 1 from public.jobs j where j.id = job_id and public.is_employer_member(j.company_id))
  );

-- job_compensation / job_requirements / job_skills / job_certifications
-- follow the exact same two-policy pattern as job_locations above —
-- public read when the parent job is active, employer-member write.
create policy "job_compensation_public_read" on public.job_compensation
  for select using (
    exists (select 1 from public.jobs j where j.id = job_id and j.status = 'active')
  );
create policy "job_compensation_employer_manage" on public.job_compensation
  for all using (
    exists (select 1 from public.jobs j where j.id = job_id and public.is_employer_member(j.company_id))
  );

create policy "job_requirements_public_read" on public.job_requirements
  for select using (
    exists (select 1 from public.jobs j where j.id = job_id and j.status = 'active')
  );
create policy "job_requirements_employer_manage" on public.job_requirements
  for all using (
    exists (select 1 from public.jobs j where j.id = job_id and public.is_employer_member(j.company_id))
  );

create policy "job_skills_public_read" on public.job_skills
  for select using (
    exists (select 1 from public.jobs j where j.id = job_id and j.status = 'active')
  );
create policy "job_skills_employer_manage" on public.job_skills
  for all using (
    exists (select 1 from public.jobs j where j.id = job_id and public.is_employer_member(j.company_id))
  );

create policy "job_certifications_public_read" on public.job_certifications
  for select using (
    exists (select 1 from public.jobs j where j.id = job_id and j.status = 'active')
  );
create policy "job_certifications_employer_manage" on public.job_certifications
  for all using (
    exists (select 1 from public.jobs j where j.id = job_id and public.is_employer_member(j.company_id))
  );

-- Employer org tables -----------------------------------------------------
alter table public.employer_organizations enable row level security;
alter table public.employer_members enable row level security;

create policy "employer_organizations_member_read" on public.employer_organizations
  for select using (public.is_employer_member(company_id));

create policy "employer_members_self_read" on public.employer_members
  for select using (
    user_id = auth.uid()
    or exists (
      select 1 from public.employer_members em2
      where em2.organization_id = public.employer_members.organization_id
        and em2.user_id = auth.uid()
        and em2.role in ('owner', 'admin')
    )
  );

-- Notifications -------------------------------------------------------------
alter table public.notifications enable row level security;

create policy "notifications_owner_read" on public.notifications
  for select using (user_id = auth.uid());
create policy "notifications_owner_update" on public.notifications
  for update using (user_id = auth.uid());

-- Ingestion + audit tables — Sprint 1 populates these with real data via
-- the service role (ingestion connector, admin approve/reject actions).
-- RLS enabled, deliberately zero policies: that denies all access to the
-- anon/authenticated roles (i.e. the public anon key), while the service
-- role still bypasses RLS entirely, which is the only way these tables
-- should ever be touched. Without this, Supabase's default schema grants
-- would leave the pending-job queue and audit trail readable/writable by
-- anyone holding the public anon key.
alter table public.job_ingestion_sources enable row level security;
alter table public.raw_job_records enable row level security;
alter table public.audit_logs enable row level security;
