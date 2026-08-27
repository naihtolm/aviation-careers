-- =========================================================
-- 004_taxonomy_and_geography.sql
-- Aviation career taxonomy + geography (locations, airports)
-- =========================================================

create table public.career_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  display_order int not null default 0,
  icon text
);

create table public.careers (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.career_categories(id) on delete restrict,
  name text not null,
  slug text not null unique,
  short_description text,
  full_description text,
  typical_training text,
  entry_level boolean not null default false,
  regulated boolean not null default false,   -- e.g. requires A&P, FAA license, etc.
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_careers_category on public.careers(category_id);

-- aliases power search normalization ("AMT" -> Aircraft Mechanic) ------
create table public.career_aliases (
  id uuid primary key default gen_random_uuid(),
  career_id uuid not null references public.careers(id) on delete cascade,
  alias text not null
);

create index idx_career_aliases_alias_trgm on public.career_aliases using gin (alias gin_trgm_ops);

create table public.career_certification_requirements (
  id uuid primary key default gen_random_uuid(),
  career_id uuid not null references public.careers(id) on delete cascade,
  certification_id uuid not null references public.certifications(id) on delete cascade,
  requirement_type requirement_type not null default 'required',
  notes text
);

create table public.career_progression (
  id uuid primary key default gen_random_uuid(),
  career_id uuid not null references public.careers(id) on delete cascade,
  parent_role_id uuid references public.careers(id),
  child_role_id uuid references public.careers(id),
  progression_order int not null default 0,
  notes text
);

create table public.career_content (
  id uuid primary key default gen_random_uuid(),
  career_id uuid not null unique references public.careers(id) on delete cascade,
  overview text,
  responsibilities jsonb,
  requirements jsonb,
  training_path text,
  career_path text,
  work_environment text,
  pros jsonb,
  considerations jsonb,
  seo_title text,
  seo_description text,
  published_at timestamptz,
  updated_at timestamptz not null default now()
);

-- Geography ------------------------------------------------------------
create table public.locations (
  id uuid primary key default gen_random_uuid(),
  country_code text not null default 'US',
  state_code text,
  city text,
  postal_code text,
  latitude double precision,
  longitude double precision,
  timezone text,
  display_name text,
  geog geography(Point, 4326)
);

create index idx_locations_geog on public.locations using gist (geog);
create index idx_locations_city_state on public.locations(city, state_code);

-- keep geog in sync with lat/lng
create or replace function public.set_location_geog()
returns trigger as $$
begin
  if new.latitude is not null and new.longitude is not null then
    new.geog := ST_SetSRID(ST_MakePoint(new.longitude, new.latitude), 4326)::geography;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_locations_set_geog
before insert or update on public.locations
for each row execute function public.set_location_geog();

create table public.airports (
  id uuid primary key default gen_random_uuid(),
  iata_code text unique,
  icao_code text unique,
  name text not null,
  slug text not null unique,
  city text,
  state text,
  country_code text default 'US',
  latitude double precision,
  longitude double precision,
  timezone text,
  airport_type text,
  website text,
  active boolean not null default true
);

create index idx_airports_iata on public.airports(iata_code);
