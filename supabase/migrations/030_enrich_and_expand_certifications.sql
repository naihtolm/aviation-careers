-- =========================================================
-- 030_enrich_and_expand_certifications.sql
-- The certifications table had 4 rows with only a bare name (no
-- description/category/issuing_authority) and only 2 of the 8
-- careers added in 022 had any certification requirements linked.
-- Enriches the existing rows, adds 7 more certifications relevant to
-- the new careers, and links 10 career-certification requirements --
-- backs the /certifications reference hub with real, connected data
-- instead of a handful of empty stubs.
-- =========================================================

update public.certifications set issuing_authority = 'Federal Aviation Administration (FAA)', category = 'Maintenance',
  description = 'Required to perform and approve most aircraft maintenance and repairs. Earned through an FAA-approved Part 147 training program or documented work experience, plus written, oral, and practical exams.'
  where name = 'FAA Airframe & Powerplant (A&P) Certificate';

update public.certifications set issuing_authority = 'Federal Communications Commission (FCC)', category = 'Communications',
  description = 'Required for technicians who install, maintain, or repair aircraft radio and radar equipment, and for some international radiotelephone operations.'
  where name = 'FCC General Radiotelephone Operator License';

update public.certifications set issuing_authority = 'Federal Aviation Administration (FAA)', category = 'Pilot',
  description = 'The highest level of pilot certificate, required to serve as captain (and, under most rules, first officer) for a scheduled airline. Requires 1,500 hours of flight time and passing written, oral, and practical exams.'
  where name = 'FAA Airline Transport Pilot (ATP) Certificate';

insert into public.certifications (name, issuing_authority, category, description) values
  ('FAA Private Pilot Certificate', 'Federal Aviation Administration (FAA)', 'Pilot',
   'The foundational pilot certificate -- lets you fly for personal use but not for compensation. The first step on every professional pilot''s path.'),
  ('FAA Commercial Pilot Certificate', 'Federal Aviation Administration (FAA)', 'Pilot',
   'Required to be paid to fly. Builds on the private pilot certificate with additional training and a minimum flight-hour requirement, and is the baseline credential for corporate, charter, and cargo flying.'),
  ('FAA Certified Flight Instructor (CFI) Certificate', 'Federal Aviation Administration (FAA)', 'Pilot',
   'Required to legally teach other pilots. A common way for new commercial pilots to build flight hours toward airline minimums while earning a paycheck.'),
  ('FAA Rotorcraft (Helicopter) Rating', 'Federal Aviation Administration (FAA)', 'Pilot',
   'An add-on rating to a pilot certificate authorizing helicopter flight -- required for most law enforcement, EMS, and military helicopter roles.'),
  ('Paramedic Certification (NREMT)', 'National Registry of Emergency Medical Technicians (NREMT)', 'Medical',
   'The baseline credential for practicing as a paramedic in most states, and the prerequisite for flight-specific critical care certifications like FP-C.'),
  ('Flight Paramedic Certification (FP-C)', 'International Board of Specialty Certifications (IBSC)', 'Medical',
   'A specialty certification on top of paramedic licensure, demonstrating the critical-care and flight-physiology knowledge specific to air medical transport.'),
  ('Security Clearance (Secret/Top Secret)', 'U.S. Department of Defense', 'Clearance',
   'Required for most roles working on classified military or defense contractor systems. The process involves a background investigation and can take several months.');

insert into public.career_certification_requirements (career_id, certification_id, requirement_type)
select c.id, cert.id, v.requirement_type
from public.careers c
join (values
  ('defense-systems-technician', 'FAA Airframe & Powerplant (A&P) Certificate', 'preferred'),
  ('defense-systems-technician', 'Security Clearance (Secret/Top Secret)', 'required'),
  ('cargo-pilot', 'FAA Airline Transport Pilot (ATP) Certificate', 'required'),
  ('corporate-pilot', 'FAA Commercial Pilot Certificate', 'required'),
  ('flight-instructor', 'FAA Commercial Pilot Certificate', 'required'),
  ('flight-instructor', 'FAA Certified Flight Instructor (CFI) Certificate', 'required'),
  ('flight-paramedic', 'Paramedic Certification (NREMT)', 'required'),
  ('flight-paramedic', 'Flight Paramedic Certification (FP-C)', 'preferred'),
  ('law-enforcement-pilot', 'FAA Commercial Pilot Certificate', 'required'),
  ('law-enforcement-pilot', 'FAA Rotorcraft (Helicopter) Rating', 'preferred')
) as v(career_slug, cert_name, requirement_type) on v.career_slug = c.slug
join public.certifications cert on cert.name = v.cert_name;
