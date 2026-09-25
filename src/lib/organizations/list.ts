import { createClient } from "@/lib/supabase/server";
import type { OrganizationListItem } from "@/types/organization";

export interface ListOrganizationsResult {
  organizations: OrganizationListItem[];
  error: string | null;
}

/**
 * Loads the organization list for the platform operator. The work
 * happens in list_organizations() (migration 0015), which refuses to
 * answer unless the caller is a platform owner — a customer admin
 * calling this gets an error, not a list of other companies.
 */
export async function listOrganizations(): Promise<ListOrganizationsResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { organizations: [], error: "Authentication required." };
  }

  const { data, error } = await supabase.rpc("list_organizations");

  if (error) {
    console.error("list_organizations failed:", error.message);
    return { organizations: [], error: "Could not load organizations." };
  }

  return {
    organizations: (data as OrganizationListItem[] | null) ?? [],
    error: null,
  };
}
