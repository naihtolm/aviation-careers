-- =========================================================
-- 022_expand_career_taxonomy.sql
-- Broadens career_categories beyond commercial/GA airplanes --
-- adds emergency/public-safety, military/defense, cargo &
-- logistics, and general-aviation/private, each seeded with a
-- couple of starter careers so the new categories aren't empty.
-- Pure data insert -- no schema change, matches the existing
-- career_categories/careers table shape from 004.
-- =========================================================

insert into public.career_categories (name, slug, description, display_order) values
  ('Emergency & Public Safety Aviation', 'emergency-public-safety-aviation',
   'Air ambulance, medevac, and law enforcement aviation keeping communities safe.', 4),
  ('Military & Defense Aviation', 'military-defense-aviation',
   'Military aircrew, defense contractor operations, and government aviation programs.', 5),
  ('Cargo & Logistics', 'cargo-logistics',
   'Freight and cargo-specific roles moving goods by air.', 6),
  ('General Aviation & Private', 'general-aviation-private',
   'Private pilots, corporate/charter flight departments, and FBO-based careers.', 7);

insert into public.careers (category_id, name, slug, short_description, full_description, typical_training, entry_level, regulated)
select id, v.name, v.slug, v.short_description, v.full_description, v.typical_training, v.entry_level, v.regulated
from public.career_categories cc
join (values
  ('emergency-public-safety-aviation', 'Flight Paramedic', 'flight-paramedic',
    'Provides critical care to patients during helicopter or fixed-wing medevac transport.',
    'Flight paramedics deliver advanced emergency medical care aboard air ambulances, stabilizing and treating critically ill or injured patients during transport between accident scenes, hospitals, and trauma centers.',
    'Paramedic certification plus flight-specific critical care training (e.g., FP-C certification)', false, true),
  ('emergency-public-safety-aviation', 'Law Enforcement Pilot', 'law-enforcement-pilot',
    'Flies helicopters or fixed-wing aircraft supporting police search, surveillance, and pursuit operations.',
    'Law enforcement pilots operate aircraft for police and sheriff''s departments, supporting search and rescue, aerial surveillance, pursuit, and tactical support missions.',
    'Commercial pilot certificate, often preceded by law enforcement officer experience or military flight training', false, true),

  ('military-defense-aviation', 'Military Pilot', 'military-pilot',
    'Operates military aircraft for combat, transport, or training missions.',
    'Military pilots fly fixed-wing aircraft or helicopters for the armed forces, performing combat, reconnaissance, transport, and training missions under military command.',
    'Commissioned officer training plus military flight school (varies by branch)', false, true),
  ('military-defense-aviation', 'Defense Systems Technician', 'defense-systems-technician',
    'Maintains and repairs avionics and weapons systems on military and defense contractor aircraft.',
    'Defense systems technicians inspect, maintain, and repair avionics, weapons, and mission systems on military aircraft, often working for the armed forces or defense contractors.',
    'Military technical training or A&P certification plus a security clearance', true, true),

  ('cargo-logistics', 'Cargo Pilot', 'cargo-pilot',
    'Flies freight aircraft transporting goods rather than passengers.',
    'Cargo pilots fly freight aircraft for carriers and logistics companies, often on overnight routes, transporting goods rather than passengers.',
    'Commercial pilot certificate + FAA Airline Transport Pilot (ATP) certificate', false, true),
  ('cargo-logistics', 'Ramp Agent', 'ramp-agent',
    'Loads and unloads aircraft, marshals planes, and handles ground cargo operations.',
    'Ramp agents handle baggage and cargo loading/unloading, aircraft marshalling, and other ground operations that keep flights moving on schedule.',
    'On-the-job training; no degree required', true, false),

  ('general-aviation-private', 'Corporate Pilot', 'corporate-pilot',
    'Flies private or charter aircraft for corporate clients and high-net-worth individuals.',
    'Corporate pilots operate private or charter aircraft for businesses and individuals, offering flexible, on-demand air travel outside the airline system.',
    'Commercial pilot certificate, often with type ratings for specific business jets', false, true),
  ('general-aviation-private', 'Flight Instructor', 'flight-instructor',
    'Teaches student pilots to fly and prepares them for FAA certification.',
    'Certified flight instructors (CFIs) teach ground and flight lessons to student pilots, a common entry point into a professional flying career while building flight hours.',
    'FAA Certified Flight Instructor (CFI) certificate', true, true)
) as v(category_slug, name, slug, short_description, full_description, typical_training, entry_level, regulated)
  on v.category_slug = cc.slug
where cc.slug in (
  'emergency-public-safety-aviation', 'military-defense-aviation', 'cargo-logistics', 'general-aviation-private'
);
