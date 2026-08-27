-- =========================================================
-- 002_identity_and_roles.sql
-- Identity, roles/permissions, job seeker profile
-- =========================================================

-- profiles: 1:1 extension of auth.users -----------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  first_name text,
  last_name text,
  display_name text,
  avatar_url text,
  account_status account_status not null default 'active',
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_profiles_email on public.profiles(email);

-- roles ---------------------------------------------------------
create table public.roles (
  id uuid primary key default gen_random_uuid(),
  name app_role not null unique,
  description text
);

insert into public.roles (name, description) values
  ('job_seeker', 'Standard job seeker account'),
  ('employer_owner', 'Owner of an employer organization'),
  ('employer_admin', 'Admin within an employer organization'),
  ('employer_recruiter', 'Recruiter within an employer organization'),
  ('platform_admin', 'Full platform administrator'),
  ('platform_moderator', 'Content/job moderation staff'),
  ('platform_editor', 'Career/content editor');

create table public.user_roles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, role_id)
);

-- job_seeker_profiles --------------------------------------------
create table public.job_seeker_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  headline text,
  professional_summary text,
  city text,
  state text,
  country_code text default 'US',
  latitude double precision,
  longitude double precision,
  willing_to_relocate boolean not null default false,
  open_to_remote boolean not null default false,
  desired_salary_min numeric(12,2),
  desired_salary_max numeric(12,2),
  salary_currency text not null default 'USD',
  profile_visibility profile_visibility not null default 'private',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_job_seeker_profiles_location on public.job_seeker_profiles(city, state);
