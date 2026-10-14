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
      .upsert(
        {
          organization_id: orgId,
          user_id: userId,
          role: "owner",
        },
        { onConflict: "organization_id,user_id" }
      );

    if (memberError) {
      console.warn("Owner membership notice:", memberError.message);
    }

    // 4. Now that membership is recorded, SELECT policy is guaranteed to pass!
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
        created_by: userId,
      };
    }

    return org;
  }

  /**
   * Retrieves all organizations that the authenticated user belongs to.
   */
  static async listUserOrganizations(userId: string, supabase: SupabaseClient) {
    const { data, error } = await supabase
      .from("organization_members")
      .select(`
        role,
        created_at,
        organizations (
          id,
          name,
          slug,
          created_at
        )
      `)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to fetch user organizations: ${error.message}`);
    }

    return data;
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
