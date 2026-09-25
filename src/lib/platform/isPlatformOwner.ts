import { createClient } from "@/lib/supabase/server";

/**
 * Whether the signed-in user is the designated Northlog platform
 * operator (the `platform_owners` list, migration 0015).
 *
 * Used to decide whether to show/allow the organization-management
 * page. This is a convenience for the UI only: every provisioning RPC
 * re-checks the same condition inside the database, so hiding the nav
 * link is never the thing standing between a customer admin and
 * organization creation.
 *
 * Fails closed — an auth error, a missing user, or an RPC failure all
 * mean "not the platform operator".
 */
export async function isPlatformOwner(): Promise<boolean> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const { data, error } = await supabase.rpc("is_platform_owner");

  if (error) {
    console.error("is_platform_owner failed:", error.message);
    return false;
  }

  return data === true;
}
