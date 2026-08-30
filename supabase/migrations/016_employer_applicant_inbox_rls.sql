-- =========================================================
-- 016_employer_applicant_inbox_rls.sql
-- job_applications, profiles, resumes, and the resumes storage bucket are
-- all owner-only under 010_rls_policies.sql / 014_resumes_storage_bucket.sql.
-- The employer applicant inbox needs read access to native-apply ("platform"
-- source) applicants for jobs the employer owns, plus the ability to update
-- application status. Scoped narrowly to source = 'platform' so an
-- employer never sees a seeker's private "interested" tracking on an
-- external-URL job -- only real submitted applications.
-- =========================================================

create policy "job_applications_employer_read" on public.job_applications
  for select using (
    source = 'platform'
    and exists (select 1 from public.jobs j where j.id = job_id and public.is_employer_member(j.company_id))
  );

create policy "job_applications_employer_update_status" on public.job_applications
  for update using (
    source = 'platform'
    and exists (select 1 from public.jobs j where j.id = job_id and public.is_employer_member(j.company_id))
  );

create policy "profiles_employer_read_applicants" on public.profiles
  for select using (
    exists (
      select 1 from public.job_applications ja
      join public.jobs j on j.id = ja.job_id
      where ja.user_id = profiles.id
        and ja.source = 'platform'
        and public.is_employer_member(j.company_id)
    )
  );

create policy "resumes_employer_read_applicants" on public.resumes
  for select using (
    exists (
      select 1 from public.job_applications ja
      join public.jobs j on j.id = ja.job_id
      where ja.user_id = resumes.user_id
        and ja.source = 'platform'
        and public.is_employer_member(j.company_id)
    )
  );

create policy "resumes_bucket_employer_read_applicants" on storage.objects
  for select using (
    bucket_id = 'resumes'
    and exists (
      select 1 from public.job_applications ja
      join public.jobs j on j.id = ja.job_id
      where (storage.foldername(name))[1] = ja.user_id::text
        and ja.source = 'platform'
        and public.is_employer_member(j.company_id)
    )
  );
