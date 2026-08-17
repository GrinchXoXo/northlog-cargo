import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Scoped to /admin only. Public marketing/tracking pages don't need
  // session refresh and shouldn't break if Supabase env vars are ever
  // missing or misconfigured.
  matcher: ["/admin", "/admin/:path*"],
};
