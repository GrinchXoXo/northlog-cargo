/**
 * Reads the Supabase env vars with a clear, actionable error instead of
 * the generic "URL and Key are required" message the Supabase client
 * throws on its own. Missing/misconfigured env vars are a setup issue,
 * not a code bug: this should point straight at the fix.
 */
export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase environment variables. Copy .env.example to " +
        ".env.local in the project root, fill in NEXT_PUBLIC_SUPABASE_URL " +
        "and NEXT_PUBLIC_SUPABASE_ANON_KEY from your Supabase project's " +
        "Settings → API page, then restart `npm run dev`."
    );
  }

  return { url, anonKey };
}
