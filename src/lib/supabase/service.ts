import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. Bypasses RLS entirely.
 *
 * Used by exactly one request path: organization provisioning
 * (src/lib/organizations/provision.ts), which needs to create a
 * Supabase Auth user and look one up by email — neither of which the
 * cookie-authenticated client may do. Everything it touches there is
 * explicitly authorized first by is_platform_owner().
 *
 * Because it bypasses RLS it also bypasses the organization boundary,
 * so any caller must resolve the organization itself and check
 * membership before touching rows — never rely on this client to
 * enforce tenant isolation. It must never be used to read business
 * data (shipments, conversations, messages) for the dashboard.
 *
 * NEVER import this from a Client Component or anything that could end
 * up in a browser bundle. It is only safe in Route Handlers / server-
 * only modules that never ship to the client.
 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing Supabase service-role configuration. Set " +
        "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (Project " +
        "Settings → API → service_role key) in .env.local, then restart " +
        "the server. SUPABASE_SERVICE_ROLE_KEY must never be prefixed " +
        "with NEXT_PUBLIC_."
    );
  }

  return createSupabaseClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
