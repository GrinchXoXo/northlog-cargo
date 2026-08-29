import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. Bypasses RLS entirely: this is the
 * first and only place in the app that uses it, and it exists solely
 * because the Telegram webhook has no browser session to authenticate
 * with (Telegram's servers call ours directly). Authorization for every
 * write made with this client is enforced in application code (verify
 * the Telegram user maps to an active admin in telegram_accounts)
 * before any shipment operation runs.
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
