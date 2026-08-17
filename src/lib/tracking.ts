import { getShipmentByTrackingId } from "@/lib/shipments/getShipmentByTrackingId";
import type { TrackingLookupResult } from "@/types/shipment";

/**
 * Looks up a shipment by tracking ID.
 *
 * This is the seam between the tracking UI and the data source. As of
 * Phase 2 it delegates to the real backend (see
 * lib/shipments/getShipmentByTrackingId.ts); the tracking UI itself did
 * not need to change to make this swap. See PRD/Technical Setup section
 * 15 and Phase 1 PRD section 30.
 */
export async function lookupShipment(rawTrackingId: string): Promise<TrackingLookupResult> {
  return getShipmentByTrackingId(rawTrackingId);
}

