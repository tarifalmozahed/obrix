-- ==============================================================================
-- Orbix Business Management System - Initial Database Schema Migration
-- Migration: 20261014000001_initial_schema.sql
-- Description: Sets up multi-tenant foundation: profiles, organizations, 
--              organization_members, RLS policies, and triggers.
-- ==============================================================================

-- 1. UTILITY FUNCTIONS
-- Automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ==============================================================================
-- 2. PROFILES TABLE (User profiles synced with Supabase Auth)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ==============================================================================
-- 3. ORGANIZATIONS TABLE (Tenant / Company entity for data isolation)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);

CREATE TRIGGER set_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ==============================================================================
-- 4. ORGANIZATION MEMBERS TABLE (Role-Based Access Control - RBAC)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'manager', 'member')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT uq_organization_member UNIQUE (organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_lookup ON public.organization_members(organization_id, user_id, role);

-- ==============================================================================
-- 5. RLS HELPER SECURITY FUNCTIONS (Prevents infinite recursion in RLS policies)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.is_org_member(check_org_id UUID, check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE organization_id = check_org_id AND user_id = check_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_org_role(check_org_id UUID, check_user_id UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
STABLE
AS $$
  SELECT role
  FROM public.organization_members
  WHERE organization_id = check_org_id AND user_id = check_user_id
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.is_org_member(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_org_member(UUID, UUID) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_user_org_role(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_org_role(UUID, UUID) TO authenticated;

-- ==============================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- --- PROFILES POLICIES ---
-- Users can view their own profile and profiles of fellow members in shared organizations
CREATE POLICY "Users can view relevant profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.organization_members my_m
    JOIN public.organization_members their_m ON my_m.organization_id = their_m.organization_id
    WHERE my_m.user_id = (SELECT auth.uid()) AND their_m.user_id = public.profiles.id
  )
);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = (SELECT auth.uid()))
WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (id = (SELECT auth.uid()));

-- --- ORGANIZATIONS POLICIES ---
CREATE POLICY "Members and creators can view their organizations"
ON public.organizations
FOR SELECT
TO authenticated
USING (
  created_by = (SELECT auth.uid())
  OR public.is_org_member(id, (SELECT auth.uid()))
);

CREATE POLICY "Authenticated users can create organizations"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (
  created_by IS NULL OR created_by = (SELECT auth.uid())
);


CREATE POLICY "Owners and admins can update organizations"
ON public.organizations
FOR UPDATE
TO authenticated
USING (
  public.get_user_org_role(id, (SELECT auth.uid())) IN ('owner', 'admin')
)
WITH CHECK (
  public.get_user_org_role(id, (SELECT auth.uid())) IN ('owner', 'admin')
);

-- --- ORGANIZATION MEMBERS POLICIES ---
CREATE POLICY "Members can view fellow organization members"
ON public.organization_members
FOR SELECT
TO authenticated
USING (
  public.is_org_member(organization_id, (SELECT auth.uid()))
);

CREATE POLICY "Owners, admins, or org creator can add members"
ON public.organization_members
FOR INSERT
TO authenticated
WITH CHECK (
  (user_id = (SELECT auth.uid()) AND role = 'owner')
  OR
  public.get_user_org_role(organization_id, (SELECT auth.uid())) IN ('owner', 'admin')
);

CREATE POLICY "Owners and admins can update member roles"
ON public.organization_members
FOR UPDATE
TO authenticated
USING (
  public.get_user_org_role(organization_id, (SELECT auth.uid())) IN ('owner', 'admin')
)
WITH CHECK (
  public.get_user_org_role(organization_id, (SELECT auth.uid())) IN ('owner', 'admin')
);

CREATE POLICY "Owners, admins can remove members or users can leave"
ON public.organization_members
FOR DELETE
TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR
  public.get_user_org_role(organization_id, (SELECT auth.uid())) IN ('owner', 'admin')
);

-- ==============================================================================
-- 7. AUTOMATIC AUTH TRIGGER (Sync auth.users -> public.profiles)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = CASE WHEN EXCLUDED.full_name <> '' THEN EXCLUDED.full_name ELSE public.profiles.full_name END,
    updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
