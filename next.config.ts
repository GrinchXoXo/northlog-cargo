import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Applies to every route. These are conservative, well-understood
        // headers with essentially no risk of breaking functionality.
        // A Content-Security-Policy is deliberately not included here:
        // getting one right requires testing against the real deployed
        // app (Supabase origins, etc.) which hasn't been
        // possible from this build environment. See Phase 7 audit notes.
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
