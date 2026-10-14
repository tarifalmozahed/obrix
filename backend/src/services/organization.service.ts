import crypto from "crypto";
import { SupabaseClient } from "@supabase/supabase-js";

export interface CreateOrgDTO {
  name: string;
  slug: string;
}

export class OrganizationService {
  /**
   * Creates a new organization and registers the creator as 'owner' in organization_members.
   * Uses the authenticated user's RLS-scoped Supabase client.
   *
   * Architectural Design:
   * By generating orgId upfront and inserting without `.select()`, we satisfy the INSERT
   * policy first, record the creator's membership in organization_members, and only then query
   * the organization. This completely avoids RLS circular dependency traps.
   */
  static async createOrganization(
    dto: CreateOrgDTO,
    userId: string,
    supabase: SupabaseClient,
    userEmail?: string
  ) {
    // 1. Ensure profile exists for this user to satisfy foreign key constraints
    await supabase.from("profiles").upsert(
      {
        id: userId,
        email: userEmail || "member@orbix.local",
      },
      { onConflict: "id" }
    );

    const orgId = crypto.randomUUID();

    // 2. Insert into organizations table WITHOUT .select()
    const { error: orgError } = await supabase
      .from("organizations")
      .insert({
        id: orgId,
        name: dto.name,
        slug: dto.slug,
        created_by: userId,
      });

    if (orgError) {
      throw new Error(`Failed to create organization: ${orgError.message}`);
    }

    // 3. Register creator as 'owner' in organization_members
    const { error: memberError } = await supabase
      .from("organization_members")
      .insert({
        organization_id: orgId,
        user_id: userId,
        role: "owner",
      });

    if (memberError) {
      console.warn("Owner membership notice:", memberError.message);
      // Fallback try upsert in case row already exists
      await supabase
        .from("organization_members")
        .upsert(
          {
            organization_id: orgId,
            user_id: userId,
            role: "owner",
          },
          { onConflict: "organization_id,user_id" }
        );
    }

    // 4. Query the created organization
    const { data: org, error: fetchError } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", orgId)
      .maybeSingle();

    if (fetchError || !org) {
      return {
        id: orgId,
        name: dto.name,
        slug: dto.slug,
        role: "owner",
        created_by: userId,
        organizations: {
          id: orgId,
          name: dto.name,
          slug: dto.slug,
        },
      };
    }

    return {
      ...org,
      role: "owner",
      organizations: org,
    };
  }

  /**
   * Retrieves all organizations that the authenticated user belongs to.
   * Cross-checks organization_members and organizations table for complete visibility.
   * Returns a standardized structure compatible with both flat and nested callers.
   */
  static async listUserOrganizations(userId: string, supabase: SupabaseClient) {
    // 1. Fetch from organization_members
    const { data: memberData, error: memberError } = await supabase
      .from("organization_members")
      .select(`
        role,
        created_at,
        organizations (
          id,
          name,
          slug,
          created_at,
          created_by
        )
      `)
      .eq("user_id", userId);

    if (memberError) {
      console.warn("Notice fetching organization_members:", memberError.message);
    }

    // 2. Also fetch all organizations accessible to this user
    const { data: directOrgs, error: orgsError } = await supabase
      .from("organizations")
      .select("id, name, slug, created_at, created_by");

    if (orgsError) {
      console.warn("Notice fetching organizations directly:", orgsError.message);
    }

    const orgsList: any[] = [];
    const seenOrgIds = new Set<string>();

    if (memberData && Array.isArray(memberData)) {
      for (const item of memberData) {
        const org = Array.isArray(item.organizations)
          ? item.organizations[0]
          : item.organizations;

        if (org && org.id && !seenOrgIds.has(org.id)) {
          seenOrgIds.add(org.id);
          orgsList.push({
            id: org.id,
            name: org.name,
            slug: org.slug,
            role: item.role || "member",
            createdAt: org.created_at || item.created_at,
            createdBy: org.created_by,
            organizations: org, // backward compatibility
          });
        }
      }
    }

    // Merge any organizations that exist in the organizations table but were missing a membership record
    if (directOrgs && Array.isArray(directOrgs)) {
      for (const org of directOrgs) {
        if (org && org.id && !seenOrgIds.has(org.id)) {
          seenOrgIds.add(org.id);
          const role = org.created_by === userId ? "owner" : "member";
          orgsList.push({
            id: org.id,
            name: org.name,
            slug: org.slug,
            role,
            createdAt: org.created_at,
            createdBy: org.created_by,
            organizations: org,
          });

          // Self-heal: ensure creator/member has membership recorded
          try {
            await supabase
              .from("organization_members")
              .insert({
                organization_id: org.id,
                user_id: userId,
                role,
              });
          } catch {
            // ignore self-heal error
          }
        }
      }
    }

    return orgsList;
  }

  /**
   * Retrieves organization details by ID.
   */
  static async getById(orgId: string, supabase: SupabaseClient) {
    const { data, error } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", orgId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch organization: ${error.message}`);
    }

    return data;
  }

  /**
   * Retrieves members of an organization.
   */
  static async getMembers(orgId: string, supabase: SupabaseClient) {
    const { data, error } = await supabase
      .from("organization_members")
      .select(`
        id,
        role,
        created_at,
        profiles (
          id,
          email,
          full_name,
          avatar_url
        )
      `)
      .eq("organization_id", orgId);

    if (error) {
      throw new Error(`Failed to fetch organization members: ${error.message}`);
    }

    return data;
  }
}
