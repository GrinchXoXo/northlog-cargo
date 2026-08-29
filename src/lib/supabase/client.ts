import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./env";

/**
 * Browser Supabase client. Uses the public anon key only: RLS decides
 * what this client can read or write. Never import a service-role key
 * here or in anything bundled to the client.
 */
export function createClient() {
  const { url, anonKey } = getSupabaseEnv();
  return createBrowserClient(url, anonKey);
}
