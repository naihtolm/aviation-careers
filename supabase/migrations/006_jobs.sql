-- =========================================================
-- 006_jobs.sql
-- Core jobs table + related structures + search + saved/applications/alerts
-- =========================================================

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  career_id uuid references public.careers(id),
  title text not null,
  slug text not null,
  description text,
  employment_type employment_type,
  experience_level experience_level,
  education_level education_level,
  schedule_type text,
  work_arrangement work_arrangement not null default 'on_site',
  status job_status not null default 'draft',
  source_type job_source_type not null default 'employer_direct',
  source_external_id text,
  application_type job_application_type not null default 'external_url',
  application_url text,
  published_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_vector tsvector
);

-- slug unique per company (two employers could both post "Ramp Agent")
create unique index uniq_jobs_company_slug on public.jobs(company_id, slug);
create index idx_jobs_status_published on public.jobs(status, published_at desc);
create index idx_jobs_company on public.jobs(company_id);
create index idx_jobs_career on public.jobs(career_id);
create index idx_jobs_expires_at on public.jobs(expires_at);
create index idx_jobs_search_vector on public.jobs using gin (search_vector);

create table public.job_locations (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  location_id uuid references public.locations(id),
  airport_id uuid references public.airports(id),
  is_primary boolean not null default true
);

create index idx_job_locations_job on public.job_locations(job_id);
create index idx_job_locations_airport on public.job_locations(airport_id);

create table public.job_compensation (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  pay_type pay_type not null default 'base',
  currency text not null default 'USD',
  min_amount numeric(12,2),
  max_amount numeric(12,2),
  period pay_period not null default 'year',
  is_estimated boolean not null default false,
  is_public boolean not null default true,
  source text
);

create index idx_job_compensation_job on public.job_compensation(job_id);

create table public.job_requirements (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  requirement_category requirement_category not null,
  requirement_type requirement_type not null default 'required',
  value text,
  normalized_id uuid,   -- points at skills.id or certifications.id depending on category
  description text
);

create index idx_job_requirements_job on public.job_requirements(job_id);

create table public.job_skills (
  job_id uuid not null references public.jobs(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  importance importance_level not null default 'medium',
  requirement_type requirement_type not null default 'preferred',
  primary key (job_id, skill_id)
);

create table public.job_certifications (
  job_id uuid not null references public.jobs(id) on delete cascade,
  certification_id uuid not null references public.certifications(id) on delete cascade,
  requirement_type requirement_type not null default 'required',
  primary key (job_id, certification_id)
);

-- keep search_vector current --------------------------------------------
create or replace function public.jobs_update_search_vector()
returns trigger as $$
declare
  company_name text;
  career_name text;
begin
  select name into company_name from public.companies where id = new.company_id;
  select name into career_name from public.careers where id = new.career_id;

  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(career_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(company_name, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(new.description, '')), 'C');

  return new;
end;
$$ language plpgsql;

create trigger trg_jobs_search_vector
before insert or update on public.jobs
for each row execute function public.jobs_update_search_vector();

-- Saved jobs, applications, alerts ---------------------------------------
create table public.saved_jobs (
  user_id uuid not null references public.profiles(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, job_id)
);

create table public.job_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  status application_status not null default 'interested',
  applied_at timestamptz,
  source text not null default 'external',
  external_application_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_job_applications_user on public.job_applications(user_id);
create index idx_job_applications_job on public.job_applications(job_id);

create table public.job_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text,
  search_query text,
  filters jsonb,
  frequency alert_frequency not null default 'daily',
  is_active boolean not null default true,
  last_sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_job_alerts_user on public.job_alerts(user_id);
create index idx_job_alerts_filters on public.job_alerts using gin (filters);
