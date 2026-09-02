-- =========================================================
-- 029_seed_job_outlook_for_close_match_careers.sql
-- Real BLS Occupational Outlook Handbook 2024-2034 employment growth
-- projections for the 6 careers with a genuinely close-matching BLS
-- occupation -- same discipline as the salary data in 027: no
-- invented figures for careers without a real government-data match.
-- BLS groups some of these under one outlook narrative (Airline +
-- Commercial Pilots share one page/figure; Aircraft Mechanics +
-- Avionics Technicians share another), noted in each narrative.
-- =========================================================

update public.career_content cc
set outlook_growth_pct = v.pct, outlook_period = v.period, outlook_label = v.label, outlook_narrative = v.narrative
from public.careers c
join (values
  ('aerospace-engineer', 6, '2024-2034', 'Faster than average',
   'Aerospace engineers are projected to grow 6% from 2024 to 2034, faster than the average for all occupations, with about 4,400 openings projected each year.'),
  ('aircraft-mechanic-ap', 5, '2024-2034', 'Faster than average',
   'Employment of aircraft and avionics equipment mechanics and technicians is projected to grow 5% from 2024 to 2034, faster than average, with about 13,100 openings projected each year, largely from workers retiring or transferring out of the occupation.'),
  ('airline-pilot', 4, '2024-2034', 'About as fast as average',
   'Employment of airline and commercial pilots is projected to grow 4% from 2024 to 2034, about as fast as the average for all occupations, with about 18,200 openings projected each year.'),
  ('cargo-pilot', 4, '2024-2034', 'About as fast as average',
   'Cargo pilots at major carriers fall under the same BLS occupation as Airline Pilots, projected to grow 4% from 2024 to 2034 with about 18,200 openings projected each year across both.'),
  ('corporate-pilot', 4, '2024-2034', 'About as fast as average',
   'BLS reports Commercial Pilots together with Airline Pilots in one outlook: 4% growth from 2024 to 2034, about as fast as the average for all occupations, with about 18,200 openings projected each year across both.'),
  ('defense-systems-technician', 5, '2024-2034', 'Faster than average',
   'BLS reports Avionics Technicians together with Aircraft Mechanics in one outlook: 5% growth from 2024 to 2034, faster than average, with about 13,100 openings projected each year across both.')
) as v(slug, pct, period, label, narrative)
  on v.slug = c.slug
where cc.career_id = c.id and c.slug = v.slug;
