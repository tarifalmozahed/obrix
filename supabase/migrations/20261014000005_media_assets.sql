-- ==============================================================================
-- Orbix Business Management System - Media & Cloudinary Assets Migration
-- Migration: 20261014000005_media_assets.sql
-- Description: Creates media_assets table for Cloudinary references,
--              adds avatar fields to employees, and sets up RLS policies.
-- ==============================================================================

-- 1. MEDIA ASSETS TABLE
CREATE TABLE IF NOT EXISTS public.media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  public_id TEXT NOT NULL,
  secure_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  resource_type TEXT NOT NULL DEFAULT 'image', -- 'image', 'raw', 'video'
  folder TEXT NOT NULL,                        -- 'hrms/employees', 'hrms/documents', 'crm/contacts', 'projects/attachments', 'company/branding'
  is_private BOOLEAN NOT NULL DEFAULT false,
  related_type TEXT,                           -- 'employee', 'employee_doc', 'company_logo', 'crm_contact', 'project_attachment'
  related_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT uq_media_org_public_id UNIQUE (organization_id, public_id)
);

-- 2. INDEXES
CREATE INDEX IF NOT EXISTS idx_media_assets_org_id ON public.media_assets(organization_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_related ON public.media_assets(organization_id, related_type, related_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_public_id ON public.media_assets(public_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_folder ON public.media_assets(organization_id, folder);

-- 3. TIMESTAMP TRIGGER
CREATE TRIGGER set_media_assets_updated_at
  BEFORE UPDATE ON public.media_assets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 4. ADD AVATAR & LOGO COLUMNS TO EXISTING TABLES (IF NOT EXISTS)
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS avatar_public_id TEXT;

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS logo_public_id TEXT;

-- 5. ROW-LEVEL SECURITY (RLS)
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

-- Select Policy: Organization members can access non-private assets.
-- For private assets (confidential documents), requires owner, admin, manager role or uploader ownership.
CREATE POLICY "org_members_select_media"
  ON public.media_assets
  FOR SELECT
  TO authenticated
  USING (
    public.is_org_member(organization_id, (SELECT auth.uid()))
    AND (
      is_private = false
      OR uploaded_by = (SELECT auth.uid())
      OR public.get_user_org_role(organization_id, (SELECT auth.uid())) IN ('owner', 'admin', 'manager')
    )
  );

-- Insert Policy: Authenticated org members can insert media records
CREATE POLICY "org_members_insert_media"
  ON public.media_assets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_org_member(organization_id, (SELECT auth.uid()))
  );

-- Update Policy: Media can be updated by uploader or org managers/admins/owners
CREATE POLICY "org_members_update_media"
  ON public.media_assets
  FOR UPDATE
  TO authenticated
  USING (
    public.is_org_member(organization_id, (SELECT auth.uid()))
    AND (
      uploaded_by = (SELECT auth.uid())
      OR public.get_user_org_role(organization_id, (SELECT auth.uid())) IN ('owner', 'admin', 'manager')
    )
  )
  WITH CHECK (
    public.is_org_member(organization_id, (SELECT auth.uid()))
  );

-- Delete Policy: Media can be deleted by uploader or org managers/admins/owners
CREATE POLICY "org_members_delete_media"
  ON public.media_assets
  FOR DELETE
  TO authenticated
  USING (
    public.is_org_member(organization_id, (SELECT auth.uid()))
    AND (
      uploaded_by = (SELECT auth.uid())
      OR public.get_user_org_role(organization_id, (SELECT auth.uid())) IN ('owner', 'admin', 'manager')
    )
  );
