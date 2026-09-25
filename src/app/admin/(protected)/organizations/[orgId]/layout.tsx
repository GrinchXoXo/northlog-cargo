import { redirect } from "next/navigation";
import { isPlatformOwner } from "@/lib/platform/isPlatformOwner";
import { resolveOrgContext } from "@/lib/platform/orgContext";
import { OrgContextBanner } from "@/components/admin/OrgContextBanner";

/**
 * Guard + persistent context chrome for the platform owner's
 * organization-context routes (`/admin/organizations/<orgId>/...`).
 *
 * Authorization runs here, server-side, on every request that renders
 * anything below it:
 *
 *   1. Signed in (the parent layout + middleware already enforce this)
 *      AND a platform owner — an organization admin who types one of
 *      these URLs is redirected to their own dashboard before any
 *      tenant data is resolved.
 *   2. The organization id resolves to a real organization through the
 *      owner-only `list_organizations` RPC — unknown ids bounce back to
 *      the organization list.
 *
 * The banner is rendered from this layout, so the "Platform Owner /
 * <Organization>" indicator persists across every page in the context.
 */
export default async function OrgContextLayout({
  children,
  params,
}: LayoutProps<"/admin/organizations/[orgId]">) {
  const { orgId } = await params;

  if (!(await isPlatformOwner())) {
    redirect("/admin");
  }

  const org = await resolveOrgContext(orgId);
  if (!org) {
    redirect("/admin/organizations");
  }

  return (
    <div>
      <OrgContextBanner org={org} />
      {children}
    </div>
  );
}
