# Supabase Database Migrations

This directory holds the version-controlled SQL migration scripts for the Orbix Business Management System.

## Architecture Guidelines:
1. **Never bypass RLS (Row Level Security)**: Every business table must enable RLS:
   ```sql
   ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
   ```
2. **Organization-Level Isolation**:
   Every tenant-specific table must include an `organization_id` foreign key referencing the `organizations` table.
   Policies will verify the user belongs to that organization:
   ```sql
   CREATE POLICY "Users can access their organization's records"
   ON table_name
   FOR ALL
   USING (organization_id IN (
       SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
   ));
   ```
3. **Execution**:
   Migrations will be numbered sequentially (e.g., `00001_create_organizations_and_profiles.sql`, `00002_hrms_schema.sql`).
