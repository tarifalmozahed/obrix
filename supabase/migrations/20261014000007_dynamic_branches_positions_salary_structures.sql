-- ==============================================================================
-- Orbix Business Management System - Dynamic Branches & Positions Migration
-- Migration: 20261014000007_dynamic_branches_positions_salary_structures.sql
-- Description: Adds dynamic organization branches/locations, positions with
--              position-wise default salary structures, and upgrades public.employees
--              to capture full onboarding fidelity.
-- ==============================================================================

-- ==============================================================================
-- 1. DYNAMIC BRANCHES / LOCATIONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  city TEXT,
  country TEXT,
  address TEXT,
  is_headquarters BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT uq_branch_org_name UNIQUE (organization_id, name)
);

CREATE INDEX IF NOT EXISTS idx_branches_org_id ON public.branches(organization_id);

CREATE TRIGGER set_branches_updated_at
  BEFORE UPDATE ON public.branches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_branches_select"
  ON public.branches FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id, (SELECT auth.uid())));

CREATE POLICY "org_admins_branches_insert"
  ON public.branches FOR INSERT TO authenticated
  WITH CHECK (public.has_org_role(organization_id, (SELECT auth.uid()), ARRAY['owner', 'admin', 'manager']));

CREATE POLICY "org_admins_branches_update"
  ON public.branches FOR UPDATE TO authenticated
  USING (public.has_org_role(organization_id, (SELECT auth.uid()), ARRAY['owner', 'admin', 'manager']))
  WITH CHECK (public.has_org_role(organization_id, (SELECT auth.uid()), ARRAY['owner', 'admin', 'manager']));

CREATE POLICY "org_admins_branches_delete"
  ON public.branches FOR DELETE TO authenticated
  USING (public.has_org_role(organization_id, (SELECT auth.uid()), ARRAY['owner', 'admin', 'manager']));

-- ==============================================================================
-- 2. DYNAMIC POSITIONS WITH DEFAULT SALARY STRUCTURES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  code TEXT,
  min_salary NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  max_salary NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  basic_salary NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  house_rent_allowance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  medical_allowance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  transport_allowance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  other_allowances JSONB NOT NULL DEFAULT '[]'::jsonb,
  pay_frequency TEXT NOT NULL DEFAULT 'Monthly',
  currency TEXT NOT NULL DEFAULT 'USD',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT uq_position_org_title UNIQUE (organization_id, title)
);

CREATE INDEX IF NOT EXISTS idx_positions_org_id ON public.positions(organization_id);
CREATE INDEX IF NOT EXISTS idx_positions_dept_id ON public.positions(department_id);

CREATE TRIGGER set_positions_updated_at
  BEFORE UPDATE ON public.positions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_positions_select"
  ON public.positions FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id, (SELECT auth.uid())));

CREATE POLICY "org_admins_positions_insert"
  ON public.positions FOR INSERT TO authenticated
  WITH CHECK (public.has_org_role(organization_id, (SELECT auth.uid()), ARRAY['owner', 'admin', 'manager']));

CREATE POLICY "org_admins_positions_update"
  ON public.positions FOR UPDATE TO authenticated
  USING (public.has_org_role(organization_id, (SELECT auth.uid()), ARRAY['owner', 'admin', 'manager']))
  WITH CHECK (public.has_org_role(organization_id, (SELECT auth.uid()), ARRAY['owner', 'admin', 'manager']));

CREATE POLICY "org_admins_positions_delete"
  ON public.positions FOR DELETE TO authenticated
  USING (public.has_org_role(organization_id, (SELECT auth.uid()), ARRAY['owner', 'admin', 'manager']));

-- ==============================================================================
-- 3. UPGRADE PUBLIC.EMPLOYEES TABLE WITH ONBOARDING FIELDS
-- ==============================================================================
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS employee_code TEXT,
  ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS branch_location TEXT,
  ADD COLUMN IF NOT EXISTS position_id UUID REFERENCES public.positions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS probation_duration_months INTEGER DEFAULT 3,
  ADD COLUMN IF NOT EXISTS probation_end_date DATE,
  ADD COLUMN IF NOT EXISTS work_location TEXT DEFAULT 'Office',
  ADD COLUMN IF NOT EXISTS shift TEXT DEFAULT 'General Day Shift',
  ADD COLUMN IF NOT EXISTS cost_center TEXT,
  ADD COLUMN IF NOT EXISTS personal_email TEXT,
  ADD COLUMN IF NOT EXISTS personal_phone TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_relationship TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS salary_structure JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS bank_name TEXT,
  ADD COLUMN IF NOT EXISTS account_holder_name TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_id UUID REFERENCES public.employee_onboardings(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_employees_branch_id ON public.employees(branch_id);
CREATE INDEX IF NOT EXISTS idx_employees_position_id ON public.employees(position_id);
CREATE INDEX IF NOT EXISTS idx_employees_onboarding_id ON public.employees(onboarding_id);
CREATE INDEX IF NOT EXISTS idx_employees_code ON public.employees(organization_id, employee_code);
