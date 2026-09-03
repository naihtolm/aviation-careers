-- =========================================================
-- 032_seed_salary_data_for_accountant.sql
-- Real BLS OEWS national salary data for 'accountant' (025's
-- business/finance career batch), which never got a salary-seeding
-- follow-up the way 022's batch did in 027.
--
-- 'business-development-specialist', the other career from that same
-- 025 batch, deliberately stays without salary data here -- it has no
-- single clean BLS occupation match (spans Sales Managers 11-2022,
-- Marketing Managers 11-2021, Advertising/Promotions Managers 11-2011
-- depending on the actual role), so presenting one under this page's
-- "Sourced from the U.S. Bureau of Labor Statistics" line would
-- overstate precision that doesn't exist -- same reasoning 027 used
-- to leave Ramp Agent, Flight Instructor, etc. unfilled. It keeps the
-- existing graceful "no salary data yet" state.
--
-- Sourcing: BLS OEWS May 2023 national estimates -- SOC 13-2011
-- "Accountants and Auditors", full percentile spread confirmed
-- directly from bls.gov/oes/2023/may/oes132011.htm (a more recent
-- May-2024-specific full spread wasn't confirmable from a primary
-- source at write time, same situation 027 hit for
-- defense-systems-technician).
-- =========================================================

insert into public.salary_aggregates (career_id, location_id, experience_level, salary_p10, salary_p25, salary_p50, salary_p75, salary_p90, confidence_score)
select c.id, null, null, v.p10, v.p25, v.p50, v.p75, v.p90, v.confidence
from public.careers c
join (values
  ('accountant', 50440, 62720, 79880, 103990, 137280, 0.85)
) as v(slug, p10, p25, p50, p75, p90, confidence)
  on v.slug = c.slug
where c.slug = 'accountant';
