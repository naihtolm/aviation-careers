-- Each ingestion source (a single company's Greenhouse board) always
-- belongs to exactly one real employer. Previously the admin review screen
-- had no way to know that and made the reviewer pick/create the company by
-- hand on every single job -- error-prone too, since raw_data.company_name
-- ("Archer") often doesn't match the company record's display name
-- ("Archer Aviation") closely enough for exact-match lookups.
alter table public.job_ingestion_sources
  add column if not exists company_id uuid references public.companies(id);

-- Backfill the two sources already tied to an existing company record.
update public.job_ingestion_sources
set company_id = (select id from public.companies where slug = 'archer-aviation')
where configuration->>'board_token' = 'archer56' and company_id is null;

update public.job_ingestion_sources
set company_id = (select id from public.companies where slug = 'neon-aerospace')
where configuration->>'board_token' = 'neonaerospace' and company_id is null;

update public.job_ingestion_sources
set company_id = (select id from public.companies where slug = 'electra-aero')
where configuration->>'board_token' = 'electraaero' and company_id is null;

-- Create the company record for sources that don't have one yet, then link it.
insert into public.companies (name, slug, company_type, status)
select v.name, v.slug, 'manufacturer', 'active'
from (values
  ('BETA Technologies', 'beta-technologies', 'betatechnologiesinc'),
  ('Skyryse', 'skyryse', 'skyryse'),
  ('Supernal', 'supernal', 'supernal')
) as v(name, slug, board_token)
where not exists (select 1 from public.companies where slug = v.slug)
  and exists (select 1 from public.job_ingestion_sources where configuration->>'board_token' = v.board_token);

update public.job_ingestion_sources s
set company_id = c.id
from public.companies c, (values
  ('betatechnologiesinc', 'beta-technologies'),
  ('skyryse', 'skyryse'),
  ('supernal', 'supernal')
) as v(board_token, slug)
where s.configuration->>'board_token' = v.board_token
  and c.slug = v.slug
  and s.company_id is null;
