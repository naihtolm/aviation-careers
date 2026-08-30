-- =========================================================
-- 015_native_apply_and_verification_rls.sql
-- Two gaps found while starting Sprint 6 (employer platform):
--
-- 1. Native apply screening questions have no storage column anywhere,
--    despite the spec explicitly saying "Questions and answers store as
--    JSONB on the application, same pattern as job_alerts.filters" --
--    that pattern was just never implemented in the schema.
--
-- 2. company_verifications has no RLS policy at all (Supabase enables
--    RLS by default on new tables), so even an employer couldn't read
--    their own verification status. Writes stay service-role-only
--    (submission and admin review both go through app-level auth
--    checks before the service client, same pattern as raw_job_records
--    in migration 010) -- only adding read access for the employer's
--    own company here.
-- =========================================================

alter table public.jobs
  add column screening_questions jsonb;

alter table public.job_applications
  add column screening_answers jsonb;

alter table public.company_verifications enable row level security;
create policy "company_verifications_employer_read" on public.company_verifications
  for select using (public.is_employer_member(company_id));
