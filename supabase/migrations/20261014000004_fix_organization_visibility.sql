-- ==============================================================================
-- Orbix Business Management System - Organization Visibility & Auto-Membership Fix
-- Migration: 20261014000004_fix_organization_visibility.sql
-- ==============================================================================

-- 1. Ensure all auth users have profile records in public.profiles
INSERT INTO public.profiles (id, email, full_name)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1))
FROM auth.users
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email;

-- 2. If any organization has created_by IS NULL, assign it to the primary auth user
UPDATE public.organizations
SET created_by = (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1)
WHERE created_by IS NULL
  AND EXISTS (SELECT 1 FROM auth.users);

-- 3. Backfill organization_members: ensure owner membership exists for all organizations
INSERT INTO public.organization_members (organization_id, user_id, role)
SELECT 
  o.id, 
  COALESCE(o.created_by, p.id),
  'owner'
FROM public.organizations o
CROSS JOIN LATERAL (
  SELECT id FROM public.profiles ORDER BY created_at ASC LIMIT 1
) p
ON CONFLICT (organization_id, user_id) DO NOTHING;

-- Also ensure every user who has created an organization has an owner record
INSERT INTO public.organization_members (organization_id, user_id, role)
SELECT 
  o.id, 
  o.created_by,
  'owner'
FROM public.organizations o
WHERE o.created_by IS NOT NULL
ON CONFLICT (organization_id, user_id) DO NOTHING;

-- 4. Set sensible default for created_by on organizations table
ALTER TABLE public.organizations 
  ALTER COLUMN created_by SET DEFAULT auth.uid();

-- 5. Update SELECT policy on organizations to allow viewing created_by IS NULL, matching creator, or member
DROP POLICY IF EXISTS "Members can view their organizations" ON public.organizations;
DROP POLICY IF EXISTS "Members and creators can view their organizations" ON public.organizations;
DROP POLICY IF EXISTS "Authenticated users can view accessible organizations" ON public.organizations;

CREATE POLICY "Authenticated users can view accessible organizations"
ON public.organizations
FOR SELECT
TO authenticated
USING (
  created_by = (SELECT auth.uid())
  OR created_by IS NULL
  OR public.is_org_member(id, (SELECT auth.uid()))
);

-- 6. Update INSERT & UPDATE policies on organizations
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;

CREATE POLICY "Authenticated users can create organizations"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (
  created_by IS NULL OR created_by = (SELECT auth.uid())
);

DROP POLICY IF EXISTS "Owners and admins can update organizations" ON public.organizations;

CREATE POLICY "Owners and admins can update organizations"
ON public.organizations
FOR UPDATE
TO authenticated
USING (
  created_by = (SELECT auth.uid())
  OR created_by IS NULL
  OR public.get_user_org_role(id, (SELECT auth.uid())) IN ('owner', 'admin')
)
WITH CHECK (
  created_by = (SELECT auth.uid())
  OR created_by IS NULL
  OR public.get_user_org_role(id, (SELECT auth.uid())) IN ('owner', 'admin')
);

-- 7. Update policies on organization_members
DROP POLICY IF EXISTS "Members can view fellow organization members" ON public.organization_members;

CREATE POLICY "Members can view fellow organization members"
ON public.organization_members
FOR SELECT
TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR public.is_org_member(organization_id, (SELECT auth.uid()))
  OR EXISTS (
    SELECT 1 FROM public.organizations o
    WHERE o.id = organization_members.organization_id
    AND (o.created_by = (SELECT auth.uid()) OR o.created_by IS NULL)
  )
);

DROP POLICY IF EXISTS "Owners, admins, or org creator can add members" ON public.organization_members;

CREATE POLICY "Owners, admins, or org creator can add members"
ON public.organization_members
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = (SELECT auth.uid())
  OR public.get_user_org_role(organization_id, (SELECT auth.uid())) IN ('owner', 'admin')
  OR EXISTS (
    SELECT 1 FROM public.organizations o
    WHERE o.id = organization_members.organization_id
    AND (o.created_by = (SELECT auth.uid()) OR o.created_by IS NULL)
  )
);

DROP POLICY IF EXISTS "Owners and admins can update member roles" ON public.organization_members;

CREATE POLICY "Owners and admins can update member roles"
ON public.organization_members
FOR UPDATE
TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR public.get_user_org_role(organization_id, (SELECT auth.uid())) IN ('owner', 'admin')
  OR EXISTS (
    SELECT 1 FROM public.organizations o
    WHERE o.id = organization_members.organization_id
    AND (o.created_by = (SELECT auth.uid()) OR o.created_by IS NULL)
  )
)
WITH CHECK (
  user_id = (SELECT auth.uid())
  OR public.get_user_org_role(organization_id, (SELECT auth.uid())) IN ('owner', 'admin')
  OR EXISTS (
    SELECT 1 FROM public.organizations o
    WHERE o.id = organization_members.organization_id
    AND (o.created_by = (SELECT auth.uid()) OR o.created_by IS NULL)
  )
);

-- 8. Trigger 1 (BEFORE INSERT): ensure created_by and id are populated
CREATE OR REPLACE FUNCTION public.handle_org_before_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NEW.id IS NULL THEN
    NEW.id := gen_random_uuid();
  END IF;

  IF NEW.created_by IS NULL THEN
    NEW.created_by := COALESCE(auth.uid(), (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1));
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_org_before_insert ON public.organizations;
CREATE TRIGGER tr_org_before_insert
  BEFORE INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_org_before_insert();

-- 9. Trigger 2 (AFTER INSERT): automatically register creator as owner in organization_members
CREATE OR REPLACE FUNCTION public.handle_new_organization()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := COALESCE(NEW.created_by, auth.uid(), (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1));

  IF v_user_id IS NOT NULL THEN
    -- Ensure profile exists
    INSERT INTO public.profiles (id, email)
    SELECT id, email FROM auth.users WHERE id = v_user_id
    ON CONFLICT (id) DO NOTHING;

    -- Register owner
    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (NEW.id, v_user_id, 'owner')
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

-- 10. Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.organizations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.organization_members TO authenticated;
