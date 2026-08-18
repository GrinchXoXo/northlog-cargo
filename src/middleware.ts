import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Named middleware.ts (not proxy.ts) deliberately. Next.js 16 renamed
 * this file to proxy.ts and proxy.ts always runs on the Node.js
 * runtime, but Cloudflare's OpenNext adapter does not yet support
 * Node.js middleware ("ERROR Node.js middleware is not currently
 * supported. Consider switching to Edge Middleware."). The older
 * middleware.ts convention is deprecated but still works and runs on
 * the Edge runtime, which OpenNext does support. Switch this back to
 * proxy.ts once @opennextjs/cloudflare adds Node.js middleware support
 * (tracked upstream: cloudflare/workers-sdk#13755, #13937).
 */
export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Scoped to /admin only. Public marketing/tracking pages don't need
  // session refresh and shouldn't break if Supabase env vars are ever
  // missing or misconfigured.
  matcher: ["/admin", "/admin/:path*"],
};
