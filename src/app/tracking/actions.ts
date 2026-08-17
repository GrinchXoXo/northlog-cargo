"use server";

import { lookupShipment } from "@/lib/tracking";
import type { TrackingLookupResult } from "@/types/shipment";

/**
 * Server Action used by the client-side tracking UI. Database access
 * must stay server-side (the Supabase server client reads session
 * cookies via next/headers, which isn't available in the browser), so
 * this is the bridge between TrackingExperience's client state machine
 * and lib/tracking.ts.
 */
export async function trackShipmentAction(trackingId: string): Promise<TrackingLookupResult> {
  return lookupShipment(trackingId);
}
