-- =========================================================
-- 003_resume_and_profile.sql
-- Resume architecture: file layer, parse layer, editable profile layer
-- =========================================================

-- Layer 1: the resume file itself ---------------------------------
create table public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  file_name text not null,
  storage_path text not null,       -- e.g. resumes/{user_id}/{resume_id}/original.pdf
  file_type text not null,          -- 'pdf' | 'docx'
  file_size_bytes bigint not null,
  checksum text,
  is_primary boolean not null default true,
  upload_status resume_upload_status not null default 'uploaded',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_resumes_user on public.resumes(user_id);
-- only one primary resume per user
create unique index uniq_resumes_primary_per_user
  on public.resumes(user_id) where (is_primary);

-- processing job tracking -------------------------------------------
create table public.resume_processing_jobs (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid not null references public.resumes(id) on delete cascade,
  status resume_processing_status not null default 'queued',
  attempt_count int not null default 0,
  processor_version text,
  started_at timestamptz,
  completed_at timestamptz,
  error_message text,
  created_at timestamptz not null default now()
);

create index idx_resume_processing_jobs_resume on public.resume_processing_jobs(resume_id);

-- Layer 2: raw parse output (never overwrites the file or the profile) ---
create table public.resume_parses (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid not null references public.resumes(id) on delete cascade,
  parser_name text not null,
  parser_version text not null,
  raw_text text,
  structured_data jsonb,           -- extracted skills/education/etc, pre-review
  confidence_score numeric(4,3),
  created_at timestamptz not null default now()
);

create index idx_resume_parses_resume on public.resume_parses(resume_id);
create index idx_resume_parses_structured_data on public.resume_parses using gin (structured_data);

-- Layer 3: normalized, user-confirmed profile data ------------------

create table public.user_experience (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  company_name text not null,
  job_title text not null,
  employment_type employment_type,
  location text,
  start_date date,
  end_date date,
  is_current boolean not null default false,
  description text,
  source data_source not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_user_experience_user on public.user_experience(user_id);

create table public.user_education (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  school_name text not null,
  degree text,
  field_of_study text,
  start_date date,
  end_date date,
  graduation_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_user_education_user on public.user_education(user_id);

-- master skills table -------------------------------------------------
create table public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category text,
  description text
);

create index idx_skills_name_trgm on public.skills using gin (name gin_trgm_ops);

create table public.user_skills (
  user_id uuid not null references public.profiles(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  proficiency_level text,
  years_experience numeric(4,1),
  source data_source not null default 'manual',
  primary key (user_id, skill_id)
);

-- certifications --------------------------------------------------------
create table public.certifications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  issuing_authority text,
  category text,
  description text
);

create table public.user_certifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  certification_id uuid not null references public.certifications(id) on delete cascade,
  certificate_number_encrypted text,   -- encrypt at application layer before insert
  issued_date date,
  expiration_date date,
  verification_status verification_status not null default 'pending',
  source data_source not null default 'manual',
  created_at timestamptz not null default now()
);

create index idx_user_certifications_user on public.user_certifications(user_id);

comment on column public.user_certifications.certificate_number_encrypted is
  'Sensitive: store encrypted, never expose via public API. Treat like a government ID field.';
