import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getShipmentForAdmin } from "@/lib/shipments/getShipmentForAdmin";
import { ShipmentDetailView } from "@/components/admin/ShipmentDetailView";

export async function generateMetadata({
  params,
}: PageProps<"/admin/shipments/[trackingId]">): Promise<Metadata> {
  const { trackingId } = await params;
  return { title: trackingId, robots: { index: false, follow: false } };
}

export default async function AdminShipmentDetailPage({
  params,
}: PageProps<"/admin/shipments/[trackingId]">) {
  const { trackingId } = await params;
  const result = await getShipmentForAdmin(trackingId);

  if (result.state === "not_found") notFound();
  if (result.state === "unauthorized") notFound();
  if (result.state === "error") {
    return <p className="text-sm text-danger">Could not load this shipment. Please try again.</p>;
  }

  return <ShipmentDetailView shipment={result.shipment} events={result.events} mode="admin" />;
}
