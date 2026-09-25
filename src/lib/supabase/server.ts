import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "./env";

/**
 * Server-side Supabase client for use in Server Components, Route
 * Handlers, and Server Actions. Reads/writes the auth session via
 * cookies so admin writes are authorized as the signed-in user. This
 * is the client every dashboard page uses; the service-role key
 * (./service.ts) is only reached by organization provisioning, which
 * has no browser session of its own to work with.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabaseEnv();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component that can't set cookies;
          // the middleware below refreshes the session on each
          // request, so this is safe to ignore.
        }
      },
    },
  });
}
