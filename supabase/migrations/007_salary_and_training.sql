-- =========================================================
-- 007_salary_and_training.sql
-- Salary sources/records/aggregates + training providers/programs
-- =========================================================

create table public.salary_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  source_type text not null,   -- 'bls' | 'employer_posting' | 'user_reported' | 'third_party'
  source_url text,
  reliability_score numeric(4,3) not null default 0.5,
  active boolean not null default true
);

create table public.salary_records (
  id uuid primary key default gen_random_uuid(),
  career_id uuid not null references public.careers(id) on delete cascade,
  location_id uuid references public.locations(id),
  company_id uuid references public.companies(id),
  source_id uuid references public.salary_sources(id),
  salary_min numeric(12,2),
  salary_max numeric(12,2),
  salary_median numeric(12,2),
  currency text not null default 'USD',
  period pay_period not null default 'year',
  sample_size int,
  observed_date date,
  confidence_score numeric(4,3),
  created_at timestamptz not null default now()
);

create index idx_salary_records_career_location on public.salary_records(career_id, location_id);

-- pre-computed aggregates that public salary pages read from -------------
create table public.salary_aggregates (
  id uuid primary key default gen_random_uuid(),
  career_id uuid not null references public.careers(id) on delete cascade,
  location_id uuid references public.locations(id),
  experience_level experience_level,
  salary_p10 numeric(12,2),
  salary_p25 numeric(12,2),
  salary_p50 numeric(12,2),
  salary_p75 numeric(12,2),
  salary_p90 numeric(12,2),
  sample_size int,
  confidence_score numeric(4,3),
  calculated_at timestamptz not null default now()
);

create unique index uniq_salary_aggregates_career_location_exp
  on public.salary_aggregates(career_id, coalesce(location_id, '00000000-0000-0000-0000-000000000000'), coalesce(experience_level, 'no_experience'));

-- Training ------------------------------------------------------------
create table public.training_providers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  website text,
  description text,
  location_id uuid references public.locations(id),
  verification_status verification_status not null default 'pending',
  active boolean not null default true
);

create table public.training_programs (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.training_providers(id) on delete cascade,
  career_id uuid references public.careers(id),
  name text not null,
  description text,
  duration_value numeric(6,1),
  duration_unit text,          -- 'weeks' | 'months' | 'years'
  estimated_cost_min numeric(12,2),
  estimated_cost_max numeric(12,2),
  format training_format not null default 'in_person',
  accreditation text,
  active boolean not null default true
);

create index idx_training_programs_career on public.training_programs(career_id);
