-- ==============================================================================
-- Orbix Business Management System - HRMS Module Schema Migration
-- Migration: 20261014000002_hrms_module.sql
-- Description: Creates departments, employees, attendance, and leave_requests
--              with organization-level multi-tenant isolation and strict RLS.
-- ==============================================================================

-- ==============================================================================
-- 1. DEPARTMENTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT uq_dept_org_name UNIQUE (organization_id, name)
);

CREATE INDEX IF NOT EXISTS idx_departments_org_id ON public.departments(organization_id);

CREATE TRIGGER set_departments_updated_at
  BEFORE UPDATE ON public.departments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ==============================================================================
-- 2. EMPLOYEES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  job_title TEXT NOT NULL,
  employment_type TEXT NOT NULL DEFAULT 'full_time' CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'intern')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'on_leave', 'terminated')),
  hire_date DATE DEFAULT CURRENT_DATE NOT NULL,
  salary NUMERIC(12, 2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT uq_employee_org_email UNIQUE (organization_id, email)
);

CREATE INDEX IF NOT EXISTS idx_employees_org_id ON public.employees(organization_id);
CREATE INDEX IF NOT EXISTS idx_employees_dept_id ON public.employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON public.employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON public.employees(organization_id, status);

CREATE TRIGGER set_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ==============================================================================
-- 3. ATTENDANCE TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE NOT NULL,
  clock_in TIMESTAMPTZ NOT NULL,
  clock_out TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'late', 'half_day', 'absent')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT uq_emp_attendance_date UNIQUE (employee_id, date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_org_id ON public.attendance(organization_id);
CREATE INDEX IF NOT EXISTS idx_attendance_emp_date ON public.attendance(employee_id, date);

-- ==============================================================================
-- 4. LEAVE REQUESTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL CHECK (leave_type IN ('annual', 'sick', 'casual', 'maternity', 'unpaid')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_leave_requests_org_id ON public.leave_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_emp_id ON public.leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON public.leave_requests(organization_id, status);

CREATE TRIGGER set_leave_requests_updated_at
  BEFORE UPDATE ON public.leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- --- DEPARTMENTS POLICIES ---
-- Any organization member can view departments
CREATE POLICY "Org members can view departments"
ON public.departments
FOR SELECT
TO authenticated
USING (public.is_org_member(organization_id, (SELECT auth.uid())));

-- Only owner, admin, or manager can create/update/delete departments
CREATE POLICY "Admins and managers can manage departments"
ON public.departments
FOR ALL
TO authenticated
USING (public.get_user_org_role(organization_id, (SELECT auth.uid())) IN ('owner', 'admin', 'manager'))
WITH CHECK (public.get_user_org_role(organization_id, (SELECT auth.uid())) IN ('owner', 'admin', 'manager'));

-- --- EMPLOYEES POLICIES ---
-- Any organization member can view employee directory
CREATE POLICY "Org members can view employees"
ON public.employees
FOR SELECT
TO authenticated
USING (public.is_org_member(organization_id, (SELECT auth.uid())));

-- Only owner, admin, or manager can manage employees
CREATE POLICY "Admins and managers can manage employees"
ON public.employees
FOR ALL
TO authenticated
USING (public.get_user_org_role(organization_id, (SELECT auth.uid())) IN ('owner', 'admin', 'manager'))
WITH CHECK (public.get_user_org_role(organization_id, (SELECT auth.uid())) IN ('owner', 'admin', 'manager'));

-- --- ATTENDANCE POLICIES ---
-- Members can view attendance records in their organization
CREATE POLICY "Org members can view attendance"
ON public.attendance
FOR SELECT
TO authenticated
USING (public.is_org_member(organization_id, (SELECT auth.uid())));

-- Members can record their own attendance; managers/admins can record for anyone
CREATE POLICY "Members and admins can record attendance"
ON public.attendance
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_org_member(organization_id, (SELECT auth.uid()))
);

CREATE POLICY "Admins can update attendance"
ON public.attendance
FOR UPDATE
TO authenticated
USING (
  public.get_user_org_role(organization_id, (SELECT auth.uid())) IN ('owner', 'admin', 'manager')
  OR
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = attendance.employee_id AND e.user_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  public.get_user_org_role(organization_id, (SELECT auth.uid())) IN ('owner', 'admin', 'manager')
  OR
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = attendance.employee_id AND e.user_id = (SELECT auth.uid())
  )
);

-- --- LEAVE REQUESTS POLICIES ---
-- Members can view leave requests in their organization
CREATE POLICY "Org members can view leave requests"
ON public.leave_requests
FOR SELECT
TO authenticated
USING (public.is_org_member(organization_id, (SELECT auth.uid())));

-- Any employee can submit a leave request
CREATE POLICY "Employees can submit leave requests"
ON public.leave_requests
FOR INSERT
TO authenticated
WITH CHECK (public.is_org_member(organization_id, (SELECT auth.uid())));

-- Only owner, admin, or manager can review/approve/reject leave requests
CREATE POLICY "Admins and managers can review leave requests"
ON public.leave_requests
FOR UPDATE
TO authenticated
USING (public.get_user_org_role(organization_id, (SELECT auth.uid())) IN ('owner', 'admin', 'manager'))
WITH CHECK (public.get_user_org_role(organization_id, (SELECT auth.uid())) IN ('owner', 'admin', 'manager'));
