import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { resolveOrgContext } from "@/lib/platform/orgContext";
import { getOrgShipmentForAdmin } from "@/lib/platform/orgData";
import { ShipmentDetailView } from "@/components/admin/ShipmentDetailView";

export async function generateMetadata({
  params,
}: PageProps<"/admin/organizations/[orgId]/shipments/[trackingId]">): Promise<Metadata> {
  const { trackingId } = await params;
  return { title: trackingId, robots: { index: false, follow: false } };
}

export default async function OrgContextShipmentDetailPage({
  params,
}: PageProps<"/admin/organizations/[orgId]/shipments/[trackingId]">) {
  const { orgId, trackingId } = await params;
  const org = await resolveOrgContext(orgId);
  if (!org) notFound();

  const result = await getOrgShipmentForAdmin(org.id, trackingId);

  if (result.state === "not_found") notFound();
  if (result.state === "unauthorized") notFound();
  if (result.state === "error") {
    return <p className="text-sm text-danger">Could not load this shipment. Please try again.</p>;
  }

  return <ShipmentDetailView shipment={result.shipment} events={result.events} mode="inspect" />;
}
