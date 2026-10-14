-- ==============================================================================
-- Orbix Business Management System - Employee Onboarding Module Schema
-- Migration: 20261014000006_employee_onboarding.sql
-- Description: Complete 8-section onboarding data architecture with wizard steps,
--              checklist tasks, document verification, multi-stage approvals,
--              and automated employee record activation.
-- ==============================================================================

-- 1. EMPLOYEE ONBOARDING PIPELINE TABLE
CREATE TABLE IF NOT EXISTS public.employee_onboardings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Status & Wizard Tracking
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'in_review', 'approved', 'rejected', 'completed', 'cancelled')),
  current_step INTEGER NOT NULL DEFAULT 1,
  progress INTEGER NOT NULL DEFAULT 10,
  
  -- Section 1: Personal Information (JSONB for rich flexible storage)
  personal_info JSONB NOT NULL DEFAULT '{
    "firstName": "",
    "middleName": "",
    "lastName": "",
    "preferredName": "",
    "dateOfBirth": null,
    "gender": "prefer_not_to_say",
    "personalEmail": "",
    "personalPhone": "",
    "alternatePhone": "",
    "presentAddress": "",
    "permanentAddress": "",
    "sameAsPresent": false,
    "emergencyContactName": "",
    "emergencyContactRelationship": "",
    "emergencyContactPhone": "",
    "profilePhotoUrl": null,
    "profilePhotoPublicId": null
  }'::jsonb,

  -- Section 2: Employment Information
  employment_info JSONB NOT NULL DEFAULT '{
    "employeeCode": "",
    "branchLocation": "Headquarters",
    "departmentId": null,
    "departmentName": "",
    "designation": "",
    "reportingManagerId": null,
    "reportingManagerName": "",
    "assignedHrOfficerId": null,
    "assignedHrOfficerName": "",
    "employmentType": "Permanent",
    "joiningDate": null,
    "probationDurationMonths": 3,
    "probationEndDate": null,
    "workEmail": "",
    "workPhone": "",
    "workLocation": "Hybrid",
    "shift": "General Day",
    "costCenter": ""
  }'::jsonb,

  -- Section 3: Compensation & Payroll
  compensation_info JSONB NOT NULL DEFAULT '{
    "salaryStructure": "Standard Full-Time",
    "basicSalary": 0,
    "houseRentAllowance": 0,
    "medicalAllowance": 0,
    "transportAllowance": 0,
    "otherAllowances": 0,
    "effectiveDate": null,
    "payFrequency": "Monthly",
    "currency": "USD",
    "bankName": "",
    "accountHolderName": "",
    "bankAccountNumber": ""
  }'::jsonb,

  -- Section 7: Equipment & Access Tracking
  equipment_info JSONB NOT NULL DEFAULT '{
    "assetType": "Laptop",
    "assetName": "",
    "assetSerialNumber": "",
    "issuedDate": null,
    "issuedBy": "",
    "expectedReturnDate": null,
    "handoverAcknowledged": false,
    "companyEmailProvisioned": false,
    "requiredAccess": [],
    "provisionedBy": "",
    "provisioningDate": null,
    "notes": ""
  }'::jsonb,

  -- Section 8: Final Activation Link
  employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  activation_date TIMESTAMPTZ,
  confirmed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. ONBOARDING DOCUMENTS (Section 4)
CREATE TABLE IF NOT EXISTS public.onboarding_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  onboarding_id UUID NOT NULL REFERENCES public.employee_onboardings(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- 'cv', 'offer_letter', 'contract', 'id_proof', 'education', 'tax', 'bank_form'
  title TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  public_id TEXT NOT NULL,
  secure_url TEXT NOT NULL,
  is_private BOOLEAN NOT NULL DEFAULT true,
  is_mandatory BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. ONBOARDING CHECKLIST TASKS (Section 5)
CREATE TABLE IF NOT EXISTS public.onboarding_checklist_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  onboarding_id UUID NOT NULL REFERENCES public.employee_onboardings(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  task_name TEXT NOT NULL,
  description TEXT,
  responsible_dept TEXT NOT NULL DEFAULT 'HR', -- 'HR', 'IT', 'Admin', 'Finance'
  assigned_person TEXT,
  due_date DATE,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  is_mandatory BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  completed_at TIMESTAMPTZ,
  completion_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. ONBOARDING APPROVALS & DECISIONS (Section 6)
CREATE TABLE IF NOT EXISTS public.onboarding_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  onboarding_id UUID NOT NULL REFERENCES public.employee_onboardings(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  stage_name TEXT NOT NULL, -- 'HR Officer Review', 'HR Manager Approval', 'Department Head Sign-off'
  stage_order INTEGER NOT NULL DEFAULT 1,
  approver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'changes_requested')),
  decision_date TIMESTAMPTZ,
  comments TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 5. INDEXES
CREATE INDEX IF NOT EXISTS idx_onboarding_org ON public.employee_onboardings(organization_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_status ON public.employee_onboardings(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_onboarding_docs ON public.onboarding_documents(onboarding_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_tasks ON public.onboarding_checklist_tasks(onboarding_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_approvals ON public.onboarding_approvals(onboarding_id);

-- 6. TRIGGERS
CREATE TRIGGER set_employee_onboardings_updated_at
  BEFORE UPDATE ON public.employee_onboardings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 7. ROW-LEVEL SECURITY
ALTER TABLE public.employee_onboardings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_checklist_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_onboarding_select"
  ON public.employee_onboardings FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id, (SELECT auth.uid())));

CREATE POLICY "org_members_onboarding_insert"
  ON public.employee_onboardings FOR INSERT TO authenticated
  WITH CHECK (public.is_org_member(organization_id, (SELECT auth.uid())));

CREATE POLICY "org_members_onboarding_update"
  ON public.employee_onboardings FOR UPDATE TO authenticated
  USING (public.is_org_member(organization_id, (SELECT auth.uid())))
  WITH CHECK (public.is_org_member(organization_id, (SELECT auth.uid())));

CREATE POLICY "org_members_onboarding_delete"
  ON public.employee_onboardings FOR DELETE TO authenticated
  USING (public.is_org_member(organization_id, (SELECT auth.uid())));

-- Docs RLS
CREATE POLICY "org_members_onboarding_docs_all"
  ON public.onboarding_documents FOR ALL TO authenticated
  USING (public.is_org_member(organization_id, (SELECT auth.uid())));

-- Tasks RLS
CREATE POLICY "org_members_onboarding_tasks_all"
  ON public.onboarding_checklist_tasks FOR ALL TO authenticated
  USING (public.is_org_member(organization_id, (SELECT auth.uid())));

-- Approvals RLS
CREATE POLICY "org_members_onboarding_approvals_all"
  ON public.onboarding_approvals FOR ALL TO authenticated
  USING (public.is_org_member(organization_id, (SELECT auth.uid())));
