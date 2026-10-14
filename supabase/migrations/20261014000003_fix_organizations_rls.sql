-- ==============================================================================
-- Orbix Business Management System - Fix Organizations RLS & Auto-Owner Trigger
-- Migration: 20261014000003_fix_organizations_rls.sql
-- ==============================================================================

-- 1. Backfill any existing auth users into public.profiles to satisfy foreign keys
INSERT INTO public.profiles (id, email, full_name, avatar_url)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', ''),
  COALESCE(raw_user_meta_data->>'avatar_url', '')
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 2. Update default on created_by to automatically use current authenticated user
ALTER TABLE public.organizations 
  ALTER COLUMN created_by SET DEFAULT auth.uid();

-- 3. Fix the SELECT policy on organizations
-- Previously, it required is_org_member() BEFORE the membership record was written.
-- By including 'created_by = (SELECT auth.uid())', newly created rows can be returned.
DROP POLICY IF EXISTS "Members can view their organizations" ON public.organizations;
DROP POLICY IF EXISTS "Members and creators can view their organizations" ON public.organizations;

CREATE POLICY "Members and creators can view their organizations"
ON public.organizations
FOR SELECT
TO authenticated
USING (
  created_by = (SELECT auth.uid())
  OR public.is_org_member(id, (SELECT auth.uid()))
);

-- 4. Fix INSERT policy on organizations (allow if created_by is null or matches auth.uid)
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;

CREATE POLICY "Authenticated users can create organizations"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (
  created_by IS NULL OR created_by = (SELECT auth.uid())
);

-- 5. Automatic Owner Trigger:
-- When an organization is created, immediately make the creator the 'owner' in organization_members.
CREATE OR REPLACE FUNCTION public.handle_new_organization()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NEW.created_by IS NOT NULL THEN
    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (NEW.id, NEW.created_by, 'owner')
    ON CONFLICT (organization_id, user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_organization_created ON public.organizations;
CREATE TRIGGER on_organization_created
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_organization();

-- 6. Ensure member can self-insert if needed as owner
DROP POLICY IF EXISTS "Owners, admins, or org creator can add members" ON public.organization_members;

CREATE POLICY "Owners, admins, or org creator can add members"
ON public.organization_members
FOR INSERT
TO authenticated
WITH CHECK (
  (user_id = (SELECT auth.uid()) AND role = 'owner')
  OR
  public.get_user_org_role(organization_id, (SELECT auth.uid())) IN ('owner', 'admin')
);
