import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { resolveOrgContext } from "@/lib/platform/orgContext";
import { listOrgShipments } from "@/lib/platform/orgData";
import { ShipmentsListView } from "@/components/admin/ShipmentsListView";

export const metadata: Metadata = {
  title: "Shipments",
  robots: { index: false, follow: false },
};

export default async function OrgContextShipmentsPage({
  params,
  searchParams,
}: PageProps<"/admin/organizations/[orgId]/shipments">) {
  const { orgId } = await params;
  const org = await resolveOrgContext(orgId);
  if (!org) notFound();

  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const { shipments, error } = await listOrgShipments(org.id, q);

  return (
    <ShipmentsListView
      shipments={shipments}
      error={error}
      search={q}
      basePath={`/admin/organizations/${org.id}/shipments`}
    />
  );
}
