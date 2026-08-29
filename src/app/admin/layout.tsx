import type { Metadata } from "next";
import "../globals.css";
import { SITE_SHORT_NAME } from "@/lib/constants";

/**
 * A separate root layout for everything under /admin, deliberately not
 * nested under (site)/layout.tsx. The public Header/Footer belong on
 * marketing/tracking pages, not the admin dashboard or login screen -
 * having both wrapped the same pages in two navigation bars at once,
 * which was especially cramped on mobile. This is Next.js's supported
 * "multiple root layouts" pattern: each top-level segment that needs
 * its own <html>/<body> defines its own root layout, and there is no
 * single shared app/layout.tsx above them.
 */
export const metadata: Metadata = {
  title: {
    default: `${SITE_SHORT_NAME} Admin`,
    template: `%s | ${SITE_SHORT_NAME} Admin`,
  },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-canvas text-ink">{children}</body>
    </html>
  );
}
