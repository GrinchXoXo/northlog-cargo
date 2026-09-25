import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { resolveOrgContext } from "@/lib/platform/orgContext";
import { getOrgDashboardCounts } from "@/lib/platform/orgData";
import { DashboardView } from "@/components/admin/DashboardView";

export async function generateMetadata({
  params,
}: PageProps<"/admin/organizations/[orgId]">): Promise<Metadata> {
  const { orgId } = await params;
  const org = await resolveOrgContext(orgId);
  return { title: org ? org.name : "Organization", robots: { index: false, follow: false } };
}

/**
 * Platform owner inside an organization: the same operational dashboard
 * that organization's admin sees (Part C), scoped to that organization
 * by the data layer (orgData.ts), read-only by construction.
 */
export default async function OrgContextDashboardPage({
  params,
}: PageProps<"/admin/organizations/[orgId]">) {
  const { orgId } = await params;
  const org = await resolveOrgContext(orgId);
  if (!org) notFound();

  const counts = await getOrgDashboardCounts(org.id);

  return (
    <DashboardView
      counts={counts}
      shipmentsHref={`/admin/organizations/${org.id}/shipments`}
    />
  );
}
