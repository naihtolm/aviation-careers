-- =========================================================
-- 018_fix_employer_members_rls_recursion.sql
-- employer_members_self_read (010_rls_policies.sql) has a subquery that
-- selects from employer_members from *within* employer_members' own
-- select policy -- Postgres re-evaluates RLS on that inner select too,
-- causing "infinite recursion detected in policy for relation
-- employer_members" on every read. This breaks every employer-facing
-- page (getEmployerContext, requireVerifiedEmployer, etc. all read this
-- table first). Found via live testing of the Sprint 6 registration flow.
--
-- Fix: move the "is an admin/owner of this org" check into a
-- security-definer function (same pattern as is_employer_member below),
-- which runs as the function owner and so isn't subject to the calling
-- policy's RLS -- breaking the recursion.
-- =========================================================

create or replace function public.is_employer_org_admin(target_organization_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.employer_members em
    where em.organization_id = target_organization_id
      and em.user_id = auth.uid()
      and em.role in ('owner', 'admin')
      and em.status = 'active'
  );
$$ language sql stable security definer set search_path = public;

drop policy "employer_members_self_read" on public.employer_members;

create policy "employer_members_self_read" on public.employer_members
  for select using (
    user_id = auth.uid()
    or public.is_employer_org_admin(organization_id)
  );
