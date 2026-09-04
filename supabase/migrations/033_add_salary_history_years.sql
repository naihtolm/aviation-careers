-- =========================================================
-- 033_add_salary_history_years.sql
-- Adds a year dimension to salary_aggregates so a career can carry more
-- than one year of data at once (needed for the new salary trend chart
-- on the career salary detail page). Every row up to now was a single
-- undated "current" snapshot per (career, location, experience_level).
--
-- The 7 existing national-level rows are replaced outright rather than
-- backdated, because their actual source year isn't reliably known --
-- 3 of them (aerospace-engineer, aircraft-mechanic-ap, airline-pilot)
-- predate the sourcing-comment convention 027 started, and this
-- migration's own re-fetch of aircraft-mechanic-ap's May 2023 figures
-- ($75,020 median) doesn't match the existing row's $78,680, confirming
-- the old row wasn't actually 2023 data. Rather than guess a vintage,
-- every one of the 6 SOC codes below was re-fetched directly from
-- bls.gov for May 2021, May 2022, and May 2023 -- the three most
-- recent years BLS still publishes as static per-occupation pages
-- (May 2024/2025 moved to an interactive tool + bulk XLSX downloads
-- that aren't reliably scrapable the same way, so the trend stops at
-- 2023 rather than presenting a partially-sourced or guessed 2024/2025
-- point).
--
-- One correction this surfaced: airline-pilot/cargo-pilot's existing
-- p90 ($300,000) doesn't correspond to any published BLS figure --
-- BLS has suppressed the 75th/90th percentile for SOC 53-2011 in every
-- year checked (2021-2023) as "data reliability concerns," publishing
-- only a wage floor for it (e.g. ">= $239,200"). The rows below leave
-- p75/p90 null for this occupation across all three years rather than
-- carry forward a figure that was never actually a clean OEWS percentile.
--
-- corporate-pilot's confidence rises from 0.6 to 0.7: the existing row
-- had median-only because a full percentile spread "wasn't confirmable
-- from a single reliable May-2024-specific source" (027's words) --
-- 2021-2023 turned out to have a mostly-complete spread (only 2023's
-- p90 is suppressed), which is more than was available before.
-- =========================================================

alter table public.salary_aggregates add column data_year int;

drop index if exists uniq_salary_aggregates_career_location_exp;

-- The 7 existing rows are all undated (data_year is null) and are being
-- fully replaced by the dated rows below -- delete them first so the new
-- unique index (which now includes data_year) has nothing to collide with.
delete from public.salary_aggregates where data_year is null;

alter table public.salary_aggregates alter column data_year set not null;

create unique index uniq_salary_aggregates_career_location_exp_year
  on public.salary_aggregates(
    career_id,
    coalesce(location_id, '00000000-0000-0000-0000-000000000000'),
    coalesce(experience_level, 'no_experience'),
    data_year
  );

insert into public.salary_aggregates (career_id, location_id, experience_level, data_year, salary_p10, salary_p25, salary_p50, salary_p75, salary_p90, confidence_score)
select c.id, null, null, v.data_year, v.p10, v.p25, v.p50, v.p75, v.p90, v.confidence
from public.careers c
join (values
  -- accountant -- SOC 13-2011 "Accountants and Auditors"
  ('accountant', 2021, 47970, 60760, 77250, 99800, 128970, 0.85),
  ('accountant', 2022, 48560, 60920, 78000, 101150, 132690, 0.85),
  ('accountant', 2023, 50440, 62720, 79880, 103990, 137280, 0.85),

  -- aerospace-engineer -- SOC 17-2011 "Aerospace Engineers"
  ('aerospace-engineer', 2021, 77440, 96130, 122270, 152950, 168370, 0.95),
  ('aerospace-engineer', 2022, 78170, 97620, 126880, 160840, 176280, 0.95),
  ('aerospace-engineer', 2023, 81620, 101730, 130720, 166610, 188910, 0.95),

  -- aircraft-mechanic-ap -- SOC 49-3011 "Aircraft Mechanics and Service Technicians"
  ('aircraft-mechanic-ap', 2021, 38270, 50330, 65380, 79540, 98590, 0.9),
  ('aircraft-mechanic-ap', 2022, 41020, 55710, 70010, 84340, 108200, 0.9),
  ('aircraft-mechanic-ap', 2023, 45760, 59190, 75020, 88350, 114750, 0.9),

  -- airline-pilot -- SOC 53-2011 "Airline and Commercial Pilots"
  -- p75/p90 null every year: BLS suppresses both for this SOC code as a
  -- data-reliability call, not a gap in this migration's sourcing.
  ('airline-pilot', 2021, 100110, 126470, 202180, null, null, 0.9),
  ('airline-pilot', 2022, 98680, 129520, 211790, null, null, 0.9),
  ('airline-pilot', 2023, 101710, 142770, 219140, null, null, 0.9),

  -- cargo-pilot -- reuses airline-pilot's SOC 53-2011 figures, same
  -- reasoning 027 used: major integrated cargo carriers fly Part 121
  -- scheduled service under the same SOC code as Airline Pilot.
  ('cargo-pilot', 2021, 100110, 126470, 202180, null, null, 0.9),
  ('cargo-pilot', 2022, 98680, 129520, 211790, null, null, 0.9),
  ('cargo-pilot', 2023, 101710, 142770, 219140, null, null, 0.9),

  -- corporate-pilot -- SOC 53-2012 "Commercial Pilots"
  ('corporate-pilot', 2021, 50080, 75370, 99640, 134110, 205940, 0.7),
  ('corporate-pilot', 2022, 54100, 76320, 103910, 149170, 217530, 0.7),
  ('corporate-pilot', 2023, 56260, 79440, 113080, 168700, null, 0.7),

  -- defense-systems-technician -- SOC 49-2091 "Avionics Technicians"
  ('defense-systems-technician', 2021, 38700, 56960, 69280, 80690, 100860, 0.85),
  ('defense-systems-technician', 2022, 40980, 58760, 75450, 89970, 109160, 0.85),
  ('defense-systems-technician', 2023, 46570, 61880, 77420, 91910, 107370, 0.85)
) as v(slug, data_year, p10, p25, p50, p75, p90, confidence)
  on v.slug = c.slug
where c.slug in ('accountant', 'aerospace-engineer', 'aircraft-mechanic-ap', 'airline-pilot', 'cargo-pilot', 'corporate-pilot', 'defense-systems-technician');
