import { STATUS_LABELS, type AdminShipment } from "@/types/shipment";

function formatDate(iso: string | null): string {
  if (!iso) return "Not set";
  return new Date(iso).toLocaleString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Matches the fields shown on /track (PRD section 14): no internal notes. */
export function formatShipmentSummary(shipment: AdminShipment): string {
  return [
    `Tracking ID: ${shipment.trackingId}`,
    "",
    `Sender: ${shipment.senderName}`,
    `Product: ${shipment.productDescription}`,
    `Destination: ${shipment.destination}`,
    "",
    `Status: ${STATUS_LABELS[shipment.currentStatus]}`,
    `Current Location: ${shipment.currentLocationLabel ?? "Not set"}`,
    `Estimated Delivery: ${formatDate(shipment.estimatedDeliveryAt)}`,
  ].join("\n");
}
