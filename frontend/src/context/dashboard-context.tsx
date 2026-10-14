"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { apiRequest } from "@/lib/api";

export interface DashboardUser {
  id: string;
  email: string;
  fullName: string;
  firstName: string;
  avatarUrl: string | null;
  initials: string;
  role: string;
}

export interface OrganizationMember {
  id: string;
  userId: string;
  role: string;
  createdAt: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
}

export interface OrganizationItem {
  id: string;
  name: string;
  slug: string;
  role: string;
  createdAt?: string;
  createdBy?: string;
  memberCount?: number;
  members?: OrganizationMember[];
}

interface DashboardContextType {
  user: DashboardUser | null;
  organizations: OrganizationItem[];
  activeOrg: OrganizationItem | null;
  setActiveOrg: (org: OrganizationItem) => void;
  loading: boolean;
  orgLoading: boolean;
  refreshUserData: () => Promise<void>;
  createOrganization: (name: string, slug: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

function formatInitials(name: string): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function deriveNameFromEmail(email: string): string {
  const local = email.split("@")[0] || "User";
  return local
    .split(/[._-]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [organizations, setOrganizations] = useState<OrganizationItem[]>([]);
  const [activeOrg, setActiveOrgState] = useState<OrganizationItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [orgLoading, setOrgLoading] = useState(false);

  const supabase = createClient();

  const setActiveOrg = (org: OrganizationItem) => {
    setActiveOrgState(org);
    if (typeof window !== "undefined") {
      localStorage.setItem("orbix_active_org_id", org.id);
    }
  };

  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);
      setOrgLoading(true);

      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !authUser) {
        setUser(null);
        setOrganizations([]);
        setActiveOrgState(null);
        setLoading(false);
        setOrgLoading(false);
        router.replace("/login");
        return;
      }

      // 1. Compute User Info from Supabase Auth
      const metadata = authUser.user_metadata || {};
      const fullName =
        metadata.full_name ||
        metadata.name ||
        deriveNameFromEmail(authUser.email || "user");
      const firstName = fullName.split(" ")[0];
      const initials = formatInitials(fullName);
      const avatarUrl = metadata.avatar_url || null;

      // 2. Fetch Organizations (Combine Express REST API + Direct Supabase queries)
      const orgsMap = new Map<string, OrganizationItem>();

      const addOrgToMap = (rawItem: any, fallbackRole = "member") => {
        if (!rawItem) return;
        // Handle flat ({ id, name, slug }) and nested ({ organizations: { id, name, slug } }) formats
        const org = Array.isArray(rawItem.organizations)
          ? rawItem.organizations[0]
          : (rawItem.organizations || rawItem.organization || rawItem);

        const id = org?.id || rawItem?.id || rawItem?.organization_id;
        const name = org?.name || rawItem?.name;
        const slug =
          org?.slug ||
          rawItem?.slug ||
          (name ? name.toLowerCase().replace(/[^a-z0-9]+/g, "-") : "workspace");
        const role = rawItem?.role || org?.role || fallbackRole;
        const createdAt = org?.created_at || rawItem?.created_at;
        const createdBy = org?.created_by || rawItem?.created_by;

        if (id && name) {
          const existing = orgsMap.get(id);
          // Prefer owner role and preserve existing member details if available
          if (!existing || (existing.role !== "owner" && role === "owner")) {
            orgsMap.set(id, {
              id,
              name,
              slug,
              role,
              createdAt: createdAt || existing?.createdAt,
              createdBy: createdBy || existing?.createdBy,
              memberCount: existing?.memberCount,
              members: existing?.members,
            });
          }
        }
      };

      // A. Try Express API
      try {
        const res = await apiRequest<any[]>("/organizations");
        if (res.success && Array.isArray(res.data)) {
          for (const item of res.data) {
            addOrgToMap(item, "owner");
          }
        }
      } catch (e) {
        console.warn("Express API /organizations fetch notice:", e);
      }

      // B. Query Supabase organization_members directly
      try {
        const { data: memberRows } = await supabase
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
          `);

        if (memberRows && Array.isArray(memberRows)) {
          for (const row of memberRows) {
            addOrgToMap(row, row.role || "member");
          }
        }
      } catch (dbErr) {
        console.warn("Direct Supabase organization_members query notice:", dbErr);
      }

      // C. Query Supabase organizations table directly (for orgs created by user or visible)
      try {
        const { data: directOrgs } = await supabase
          .from("organizations")
          .select("id, name, slug, created_at, created_by");

        if (directOrgs && Array.isArray(directOrgs)) {
          for (const org of directOrgs) {
            addOrgToMap(org, "owner");
          }
        }
      } catch (orgErr) {
        console.warn("Direct Supabase organizations query notice:", orgErr);
      }

      let parsedOrgs = Array.from(orgsMap.values());

      // Safe fallback in memory ONLY if database returned zero records (do not trigger side-effect POSTs)
      if (parsedOrgs.length === 0) {
        parsedOrgs = [
          {
            id: "default-org",
            name: `${firstName}'s Workspace`,
            slug: "default",
            role: "owner",
          },
        ];
      }

      // 4. Determine Active Organization
      const savedOrgId =
        typeof window !== "undefined"
          ? localStorage.getItem("orbix_active_org_id")
          : null;
      let matchedOrg =
        parsedOrgs.find((o) => o.id === savedOrgId) || parsedOrgs[0];

      // 5. Fetch Active Organization Members & Info
      if (matchedOrg && matchedOrg.id !== "default-org") {
        try {
          const { data: membersData } = await supabase
            .from("organization_members")
            .select(`
              id,
              role,
              created_at,
              user_id,
              profiles (
                id,
                email,
                full_name,
                avatar_url
              )
            `)
            .eq("organization_id", matchedOrg.id);

          if (membersData && Array.isArray(membersData)) {
            const mappedMembers: OrganizationMember[] = membersData.map((m: any) => {
              const prof = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
              return {
                id: m.id,
                userId: m.user_id,
                role: m.role || "member",
                createdAt: m.created_at,
                email: prof?.email || "member@orbix.local",
                fullName: prof?.full_name || "Team Member",
                avatarUrl: prof?.avatar_url,
              };
            });

            matchedOrg = {
              ...matchedOrg,
              memberCount: mappedMembers.length,
              members: mappedMembers,
            };
          }
        } catch (memberErr) {
          console.warn("Fetch members for active org notice:", memberErr);
        }
      }

      setOrganizations(parsedOrgs);
      setActiveOrgState(matchedOrg);

      // Determine user role label
      const rawRole = matchedOrg?.role || "member";
      const formattedRole =
        rawRole === "owner"
          ? "Owner"
          : rawRole === "admin"
            ? "Administrator"
            : rawRole.charAt(0).toUpperCase() + rawRole.slice(1);

      setUser({
        id: authUser.id,
        email: authUser.email || "",
        fullName,
        firstName,
        avatarUrl,
        initials,
        role: formattedRole,
      });
    } catch (err) {
      console.error("Error loading dashboard user and organization data:", err);
    } finally {
      setLoading(false);
      setOrgLoading(false);
    }
  }, [router, supabase]);

  useEffect(() => {
    fetchUserData();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        setUser(null);
        setOrganizations([]);
        setActiveOrgState(null);
        router.replace("/login");
      } else if (event === "SIGNED_IN") {
        fetchUserData();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserData, router, supabase]);

  const signOut = async () => {
    await supabase.auth.signOut();
    if (typeof window !== "undefined") {
      localStorage.removeItem("orbix_active_org_id");
    }
    setUser(null);
    router.replace("/login");
  };

  const createOrganization = async (name: string, slug: string) => {
    try {
      setOrgLoading(true);
      const cleanSlug =
        slug.toLowerCase().trim() ||
        name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

      const res = await apiRequest<{ id: string; name: string; slug: string }>("/organizations", {
        method: "POST",
        body: JSON.stringify({ name, slug: cleanSlug }),
      });

      if (res.success && res.data) {
        const newOrg: OrganizationItem = {
          id: res.data.id,
          name: res.data.name,
          slug: res.data.slug,
          role: "owner",
          memberCount: 1,
        };

        // Instantly update state so it shows in the UI with zero delay
        setOrganizations((prev) => {
          const filtered = prev.filter((o) => o.id !== "default-org");
          if (filtered.some((o) => o.id === newOrg.id)) return filtered;
          return [...filtered, newOrg];
        });
        setActiveOrgState(newOrg);

        if (typeof window !== "undefined") {
          localStorage.setItem("orbix_active_org_id", res.data.id);
        }

        // Background sync to fetch any additional DB associations
        await fetchUserData();
        return { success: true };
      } else {
        return {
          success: false,
          error: res.error?.message || "Failed to create organization",
        };
      }
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Network error creating organization",
      };
    } finally {
      setOrgLoading(false);
    }
  };

  return (
    <DashboardContext.Provider
      value={{
        user,
        organizations,
        activeOrg,
        setActiveOrg,
        loading,
        orgLoading,
        refreshUserData: fetchUserData,
        createOrganization,
        signOut,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}
