-- ==============================================================================
-- Orbix Business Management System - HRMS Configuration Migration
-- Migration: 20261014000008_hrms_configuration_probation_shifts.sql
-- Description: Creates probation_durations, shifts configuration tables,
--              links employees table to shifts & probation durations, and sets up RLS.
-- ==============================================================================

-- ==============================================================================
-- 1. PROBATION DURATIONS & POLICIES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.probation_durations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  duration_months INTEGER NOT NULL DEFAULT 3,
  duration_days INTEGER,
  evaluation_frequency TEXT NOT NULL DEFAULT 'Monthly',
  notice_period_days INTEGER NOT NULL DEFAULT 14,
  is_default BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT uq_probation_org_title UNIQUE (organization_id, title)
);

CREATE INDEX IF NOT EXISTS idx_probation_org_id ON public.probation_durations(organization_id);

CREATE TRIGGER set_probation_durations_updated_at
  BEFORE UPDATE ON public.probation_durations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.probation_durations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_probation_select"
  ON public.probation_durations FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id, (SELECT auth.uid())));

CREATE POLICY "org_admins_probation_insert"
  ON public.probation_durations FOR INSERT TO authenticated
  WITH CHECK (public.has_org_role(organization_id, (SELECT auth.uid()), ARRAY['owner', 'admin', 'manager']));

CREATE POLICY "org_admins_probation_update"
  ON public.probation_durations FOR UPDATE TO authenticated
  USING (public.has_org_role(organization_id, (SELECT auth.uid()), ARRAY['owner', 'admin', 'manager']))
  WITH CHECK (public.has_org_role(organization_id, (SELECT auth.uid()), ARRAY['owner', 'admin', 'manager']));

CREATE POLICY "org_admins_probation_delete"
  ON public.probation_durations FOR DELETE TO authenticated
  USING (public.has_org_role(organization_id, (SELECT auth.uid()), ARRAY['owner', 'admin', 'manager']));

-- ==============================================================================
-- 2. SHIFTS CONFIGURATION TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  start_time TIME NOT NULL DEFAULT '09:00:00',
  end_time TIME NOT NULL DEFAULT '18:00:00',
  grace_period_minutes INTEGER NOT NULL DEFAULT 15,
  break_duration_minutes INTEGER NOT NULL DEFAULT 60,
  half_day_threshold_hours NUMERIC(4, 2) DEFAULT 4.50,
  work_days TEXT[] NOT NULL DEFAULT ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  is_default BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT uq_shift_org_name UNIQUE (organization_id, name)
);

CREATE INDEX IF NOT EXISTS idx_shifts_org_id ON public.shifts(organization_id);

CREATE TRIGGER set_shifts_updated_at
  BEFORE UPDATE ON public.shifts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_shifts_select"
  ON public.shifts FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id, (SELECT auth.uid())));

CREATE POLICY "org_admins_shifts_insert"
  ON public.shifts FOR INSERT TO authenticated
  WITH CHECK (public.has_org_role(organization_id, (SELECT auth.uid()), ARRAY['owner', 'admin', 'manager']));

CREATE POLICY "org_admins_shifts_update"
  ON public.shifts FOR UPDATE TO authenticated
  USING (public.has_org_role(organization_id, (SELECT auth.uid()), ARRAY['owner', 'admin', 'manager']))
  WITH CHECK (public.has_org_role(organization_id, (SELECT auth.uid()), ARRAY['owner', 'admin', 'manager']));

CREATE POLICY "org_admins_shifts_delete"
  ON public.shifts FOR DELETE TO authenticated
  USING (public.has_org_role(organization_id, (SELECT auth.uid()), ARRAY['owner', 'admin', 'manager']));

-- ==============================================================================
-- 3. LINK EMPLOYEES TO PROBATION DURATION & SHIFTS
-- ==============================================================================
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS shift_id UUID REFERENCES public.shifts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS probation_duration_id UUID REFERENCES public.probation_durations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_employees_shift_id ON public.employees(shift_id);
CREATE INDEX IF NOT EXISTS idx_employees_probation_duration_id ON public.employees(probation_duration_id);
