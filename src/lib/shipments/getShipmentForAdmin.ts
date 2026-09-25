import { createClient } from "@/lib/supabase/server";
import { mapShipmentRow, mapTrackingEventRow, type RawShipmentRow, type RawTrackingEventRow } from "./mapRows";
import type { AdminShipment, AdminTrackingEvent } from "@/types/shipment";

export type GetShipmentForAdminResult =
  | { state: "success"; shipment: AdminShipment; events: AdminTrackingEvent[] }
  | { state: "not_found" }
  | { state: "unauthorized" }
  | { state: "error" };

/**
 * Fetches the full internal record for one shipment (by tracking ID) for
 * the admin detail page, including the complete event history: unlike the
 * public contract, nothing here is filtered. Requires an authenticated
 * session; RLS scopes the rows to the caller's organization.
 */
export async function getShipmentForAdmin(trackingId: string): Promise<GetShipmentForAdminResult> {
  if (trackingId.trim().length === 0 || trackingId.length > 64) {
    return { state: "not_found" };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { state: "unauthorized" };
  }

  const { data: shipmentRow, error: shipmentError } = await supabase
    .from("shipments")
    .select("*")
    .ilike("tracking_id", trackingId.trim())
    .maybeSingle();

  if (shipmentError) {
    console.error("getShipmentForAdmin (shipment) failed:", shipmentError.message);
    return { state: "error" };
  }

  if (!shipmentRow) {
    return { state: "not_found" };
  }

  const { data: eventRows, error: eventsError } = await supabase
    .from("tracking_events")
    .select("*")
    .eq("shipment_id", (shipmentRow as RawShipmentRow).id)
    .order("created_at", { ascending: true });

  if (eventsError) {
    console.error("getShipmentForAdmin (events) failed:", eventsError.message);
    return { state: "error" };
  }

  return {
    state: "success",
    shipment: mapShipmentRow(shipmentRow as RawShipmentRow),
    events: (eventRows as RawTrackingEventRow[]).map(mapTrackingEventRow),
  };
}
