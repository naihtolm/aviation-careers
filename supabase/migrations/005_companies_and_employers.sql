-- =========================================================
-- 005_companies_and_employers.sql
-- Companies/employers, org membership, verification
-- =========================================================

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  legal_name text,
  description text,
  website text,
  logo_path text,
  company_type company_type not null,
  headquarters_location_id uuid references public.locations(id),
  employee_size_range text,
  verification_status verification_status not null default 'pending',
  status company_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_companies_type on public.companies(company_type);

create table public.company_airports (
  company_id uuid not null references public.companies(id) on delete cascade,
  airport_id uuid not null references public.airports(id) on delete cascade,
  relationship_type airport_relationship_type not null default 'other',
  active boolean not null default true,
  primary key (company_id, airport_id, relationship_type)
);

create table public.employer_organizations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null unique references public.companies(id) on delete cascade,
  billing_email text,
  subscription_status text not null default 'none',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.employer_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.employer_organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role employer_member_role not null default 'recruiter',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create index idx_employer_members_user on public.employer_members(user_id);

create table public.company_verifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  verification_method text,
  submitted_by uuid references public.profiles(id),
  status verification_status not null default 'pending',
  reviewed_by uuid references public.profiles(id),
  review_notes text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz
);
