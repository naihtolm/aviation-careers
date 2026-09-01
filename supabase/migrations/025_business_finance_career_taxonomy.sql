-- Add corporate and support careers required to operate aviation businesses.
insert into public.career_categories (name, slug, description, display_order)
values (
  'Business, Finance & Corporate',
  'business-finance-corporate',
  'Finance, accounting, program management, people operations, procurement, technology, and commercial roles supporting aviation organizations.',
  8
)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  display_order = excluded.display_order;

insert into public.careers
  (category_id, name, slug, short_description, full_description, typical_training, entry_level, regulated)
select cc.id, v.name, v.slug, v.short_description, v.full_description, v.typical_training, v.entry_level, false
from public.career_categories cc
cross join (values
  ('Cost Analyst', 'cost-analyst', 'Analyzes program, manufacturing, maintenance, and operating costs.', 'Cost analysts build forecasts, evaluate actual performance, and help aviation organizations control program and operating costs.', 'Bachelor''s degree in finance, accounting, economics, or a related field; relevant experience may substitute.', true),
  ('Financial Analyst', 'financial-analyst', 'Builds budgets, forecasts, and financial models for aviation organizations.', 'Financial analysts turn operational and financial data into budgets, forecasts, investment cases, and decision support.', 'Bachelor''s degree in finance, accounting, economics, or a related field.', true),
  ('Accountant', 'accountant', 'Maintains financial records, reporting, controls, and compliance.', 'Accountants support accurate reporting, close processes, audits, tax work, and financial controls across aviation businesses.', 'Accounting degree or equivalent experience; CPA may be preferred for senior roles.', true),
  ('Procurement Specialist', 'procurement-specialist', 'Sources aircraft parts, services, equipment, and supplier capacity.', 'Procurement specialists manage sourcing, supplier negotiations, purchase orders, and supply risk for aviation operations and programs.', 'Degree or experience in supply chain, business, procurement, or aviation operations.', true),
  ('Human Resources Specialist', 'human-resources-specialist', 'Supports recruiting, employee relations, benefits, and workforce programs.', 'Human resources specialists help aviation employers attract, support, and retain the licensed, technical, and corporate workforce.', 'Degree or experience in human resources, business, or a related field.', true),
  ('Program Manager', 'program-manager', 'Coordinates complex aviation programs across schedule, cost, scope, and risk.', 'Program managers lead cross-functional delivery for aircraft, airport, defense, technology, and operational initiatives.', 'Bachelor''s degree or substantial relevant experience; PMP may be preferred.', false),
  ('Business Development Specialist', 'business-development-specialist', 'Develops customer relationships, proposals, partnerships, and new revenue.', 'Business development specialists identify opportunities and coordinate capture, proposals, sales, and partnerships in aviation markets.', 'Degree or experience in business, marketing, aviation, or a technical field.', true),
  ('IT & Cybersecurity Specialist', 'it-cybersecurity-specialist', 'Protects and supports business, airport, airline, and operational technology systems.', 'IT and cybersecurity specialists maintain reliable systems and protect aviation organizations from operational and information-security threats.', 'IT, computer science, cybersecurity training, certifications, or equivalent experience.', true)
) as v(name, slug, short_description, full_description, typical_training, entry_level)
where cc.slug = 'business-finance-corporate'
on conflict (slug) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  short_description = excluded.short_description,
  full_description = excluded.full_description,
  typical_training = excluded.typical_training,
  entry_level = excluded.entry_level,
  active = true;

insert into public.career_aliases (career_id, alias)
select c.id, a.alias
from public.careers c
join (values
  ('cost-analyst', 'cost estimator'),
  ('cost-analyst', 'pricing analyst'),
  ('financial-analyst', 'finance analyst'),
  ('financial-analyst', 'FP&A analyst'),
  ('procurement-specialist', 'buyer'),
  ('procurement-specialist', 'sourcing specialist'),
  ('human-resources-specialist', 'recruiter'),
  ('human-resources-specialist', 'talent acquisition'),
  ('program-manager', 'project manager'),
  ('business-development-specialist', 'sales'),
  ('it-cybersecurity-specialist', 'information security')
) as a(career_slug, alias) on a.career_slug = c.slug
where not exists (
  select 1 from public.career_aliases existing
  where existing.career_id = c.id and lower(existing.alias) = lower(a.alias)
);
