import type { Metadata } from "next";
import { listShipments } from "@/lib/shipments/listShipments";
import { ShipmentsListView } from "@/components/admin/ShipmentsListView";

export const metadata: Metadata = {
  title: "Shipments",
  robots: { index: false, follow: false },
};

export default async function AdminShipmentsPage({
  searchParams,
}: PageProps<"/admin/shipments">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const { shipments, error } = await listShipments(q);

  return (
    <ShipmentsListView
      shipments={shipments}
      error={error}
      search={q}
      basePath="/admin/shipments"
      createShipmentHref="/admin/shipments/new"
    />
  );
}
