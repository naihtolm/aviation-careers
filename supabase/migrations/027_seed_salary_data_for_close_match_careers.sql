-- =========================================================
-- 027_seed_salary_data_for_close_match_careers.sql
-- Real BLS OEWS national salary data for the 3 of the 8 new careers
-- (022) that have a reasonably close-matching BLS occupation code.
-- The other 5 (Military Pilot, Ramp Agent, Flight Instructor, Flight
-- Paramedic, Law Enforcement Pilot) deliberately have NO salary data
-- here -- their closest available BLS codes are broad/adjacent
-- enough (e.g. generic "Paramedics" undercounts flight-specific pay;
-- generic "Commercial Pilots" overstates typical CFI pay) that
-- presenting them under this page's "Sourced from the U.S. Bureau of
-- Labor Statistics" line would overstate precision that doesn't
-- exist. They keep the existing graceful "no salary data yet" state.
--
-- Sourcing (BLS OEWS May 2024 national estimates unless noted):
--  - cargo-pilot: SOC 53-2011 "Airline and Commercial Pilots" -- major
--    integrated cargo carriers (FedEx, UPS) fly Part 121 scheduled
--    service under the same SOC code as Airline Pilot, so this reuses
--    that career's already-stored figures rather than re-deriving an
--    estimate for what is genuinely the same occupational category.
--  - corporate-pilot: SOC 53-2012 "Commercial Pilots", median only --
--    the percentile spread wasn't confirmable from a single reliable
--    May-2024-specific source, so p10/p25/p75/p90 are left null
--    rather than guessed.
--  - defense-systems-technician: SOC 49-2091 "Avionics Technicians"
--    (May 2023 OEWS, most recent confirmed full percentile spread).
-- =========================================================

insert into public.salary_aggregates (career_id, location_id, experience_level, salary_p10, salary_p25, salary_p50, salary_p75, salary_p90, confidence_score)
select c.id, null, null, v.p10, v.p25, v.p50, v.p75, v.p90, v.confidence
from public.careers c
join (values
  ('cargo-pilot', 98560, null, 226600, null, 300000, 0.9),
  ('corporate-pilot', null, null, 122670, null, null, 0.6),
  ('defense-systems-technician', 46570, 61880, 77420, 91910, 107370, 0.85)
) as v(slug, p10, p25, p50, p75, p90, confidence)
  on v.slug = c.slug
where c.slug in ('cargo-pilot', 'corporate-pilot', 'defense-systems-technician');
