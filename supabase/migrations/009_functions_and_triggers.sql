-- =========================================================
-- 009_functions_and_triggers.sql
-- Shared trigger functions: updated_at maintenance, auto profile creation
-- =========================================================

-- Generic updated_at maintenance -----------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

-- Attach to every table that has an updated_at column.
-- (List every table here explicitly rather than looping — easier to audit in a migration file.)
create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger trg_job_seeker_profiles_updated_at before update on public.job_seeker_profiles
  for each row execute function public.set_updated_at();
create trigger trg_resumes_updated_at before update on public.resumes
  for each row execute function public.set_updated_at();
create trigger trg_user_experience_updated_at before update on public.user_experience
  for each row execute function public.set_updated_at();
create trigger trg_user_education_updated_at before update on public.user_education
  for each row execute function public.set_updated_at();
create trigger trg_careers_updated_at before update on public.careers
  for each row execute function public.set_updated_at();
create trigger trg_career_content_updated_at before update on public.career_content
  for each row execute function public.set_updated_at();
create trigger trg_companies_updated_at before update on public.companies
  for each row execute function public.set_updated_at();
create trigger trg_employer_organizations_updated_at before update on public.employer_organizations
  for each row execute function public.set_updated_at();
create trigger trg_jobs_updated_at before update on public.jobs
  for each row execute function public.set_updated_at();
create trigger trg_job_applications_updated_at before update on public.job_applications
  for each row execute function public.set_updated_at();

-- Auto-create a profiles row whenever a new Supabase auth user signs up ---
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);

  -- every new user starts as a job_seeker by default
  insert into public.user_roles (user_id, role_id)
  select new.id, r.id from public.roles r where r.name = 'job_seeker';

  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger trg_on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Helper: does the current user hold a given role? (used heavily in RLS) --
create or replace function public.has_role(target_role app_role)
returns boolean as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = auth.uid()
      and r.name = target_role
  );
$$ language sql stable security definer set search_path = public;

-- Helper: is the current user a member of the employer org that owns a job/company?
create or replace function public.is_employer_member(target_company_id uuid)
returns boolean as $$
  select exists (
    select 1
    from public.employer_organizations eo
    join public.employer_members em on em.organization_id = eo.id
    where eo.company_id = target_company_id
      and em.user_id = auth.uid()
      and em.status = 'active'
  );
$$ language sql stable security definer set search_path = public;
