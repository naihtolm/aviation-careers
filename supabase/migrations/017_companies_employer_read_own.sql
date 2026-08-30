-- =========================================================
-- 017_companies_employer_read_own.sql
-- companies_public_read (010_rls_policies.sql) only allows select where
-- status = 'active', and companies_employer_manage only covers update --
-- there was no select policy letting an employer read their OWN company
-- while it's still pending/rejected/needs_information. That broke
-- getEmployerContext() for every employer immediately after registering
-- (before admin approval), bouncing /employer/verification back to
-- /employers/sign-up. Found via live testing of the Sprint 6 registration
-- flow.
-- =========================================================

create policy "companies_employer_read_own" on public.companies
  for select using (public.is_employer_member(id));
