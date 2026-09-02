-- Analyzed the current ingestion backlog (202 pending raw jobs) for titles
-- that don't match any existing career -- these four are genuine recurring
-- role families (not one-off req titles) that the taxonomy had no home for:
-- customer-facing support, quality/inspection, configuration management,
-- and hands-on manufacturing/production work distinct from FAA-licensed
-- aircraft maintenance (Aircraft Mechanic (A&P)).
insert into public.careers
  (category_id, name, slug, short_description, full_description, typical_training, entry_level, regulated)
select cc.id, v.name, v.slug, v.short_description, v.full_description, v.typical_training, v.entry_level, false
from public.career_categories cc
join (values
  ('business-finance-corporate', 'Customer Service Representative', 'customer-service-representative', 'Handles customer inquiries, orders, and support for aviation products and services.', 'Customer service representatives are the front line for passengers, operators, or commercial customers -- answering questions, resolving issues, and coordinating with internal teams to keep customers informed and satisfied.', 'High school diploma or equivalent; some roles prefer a degree or aviation industry familiarity.', true),
  ('maintenance-technical', 'Quality Assurance Inspector', 'quality-assurance-inspector', 'Inspects parts, assemblies, and processes to confirm they meet aviation quality and safety standards.', 'Quality assurance inspectors verify that manufactured parts, assemblies, and processes meet engineering drawings, specifications, and regulatory requirements -- using techniques from visual inspection to non-destructive testing (NDT) and coordinate measuring machines (CMM).', 'High school diploma plus on-the-job or vendor training; NDT and CMM roles often require specific certifications (e.g. NAS 410 for NDT Level II).', true),
  ('engineering-design', 'Configuration Management Specialist', 'configuration-management-specialist', 'Tracks design changes, part revisions, and product structure across an aircraft or vehicle program.', 'Configuration management specialists maintain the authoritative record of a product''s design and build state -- managing engineering change requests, part/document revisions, and traceability between design and as-built hardware.', 'Bachelor''s degree in engineering, business, or a related field, or equivalent experience; familiarity with PLM/configuration management tools is common.', true),
  ('maintenance-technical', 'Manufacturing Technician', 'manufacturing-technician', 'Builds, machines, and assembles aircraft or vehicle parts and structures on the production floor.', 'Manufacturing technicians operate machining and assembly equipment, handle materials, and perform hands-on production work -- distinct from FAA-licensed aircraft maintenance (Aircraft Mechanic (A&P)), which centers on maintaining and certifying aircraft already in service.', 'High school diploma plus vendor/on-the-job training; CNC, composites, or assembly-specific certifications are common for specialized roles.', true)
) as v(category_slug, name, slug, short_description, full_description, typical_training, entry_level)
on cc.slug = v.category_slug
on conflict (slug) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  short_description = excluded.short_description,
  full_description = excluded.full_description,
  typical_training = excluded.typical_training,
  entry_level = excluded.entry_level,
  active = true;

-- Cleanup: the inline "create a new career role" flow shipped earlier
-- today defaulted its name field to the raw job's literal title, which an
-- admin used as-is for a job titled "Associate General Counsel,
-- Employment" -- publishing that exact req title as a permanent public
-- career-category name, with no description. Generalize it into a real,
-- reusable category (any legal/counsel job at an aviation employer can use
-- it going forward) instead of leaving the literal title live. That
-- default has separately been fixed in code so this doesn't keep happening.
update public.careers
set
  name = 'Corporate Counsel',
  slug = 'corporate-counsel',
  short_description = 'Provides legal counsel on employment, contracts, and compliance for an aviation employer.',
  full_description = 'Corporate counsel advise aviation companies on employment law, contracts, regulatory compliance, and other legal matters affecting the business.',
  typical_training = 'J.D. and active bar admission; aviation or employment-law experience is often preferred.',
  updated_at = now()
where slug = 'associate-general-counsel-employment';
