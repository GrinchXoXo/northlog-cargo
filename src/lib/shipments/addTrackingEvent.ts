import { createClient } from "@/lib/supabase/server";
import { validateStatusUpdateInput, ValidationError } from "@/lib/validation/shipment";

export type AddTrackingEventResult = { ok: true } | { ok: false; error: string };

/**
 * Inserts a new tracking event and updates the shipment's current
 * status, location, ETA, and customs-action fields atomically via
 * add_tracking_event() (supabase/migrations/0007, superseded from 0009
 * on). Historical events are never overwritten: see PRD section 11/14.
 * Requires an authenticated admin: the function is SECURITY INVOKER, so
 * the caller's organization membership decides which shipment may be
 * touched.
 */
export async function addTrackingEvent(input: unknown): Promise<AddTrackingEventResult> {
  let validated;
  try {
    validated = validateStatusUpdateInput(input);
  } catch (err) {
    if (err instanceof ValidationError) {
      return { ok: false, error: err.message };
    }
    throw err;
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Authentication required." };
  }

  const { error } = await supabase.rpc("add_tracking_event", {
    p_shipment_id: validated.shipmentId,
    p_status: validated.status,
    p_location: validated.location,
    p_latitude: validated.latitude,
    p_longitude: validated.longitude,
    p_note: validated.note,
    p_image_path: validated.imagePath,
    p_estimated_delivery_at: validated.estimatedDeliveryAt,
    p_clear_estimated_delivery: validated.clearEstimatedDelivery,
    p_requires_action: validated.requiresAction,
    p_action_message: validated.actionMessage,
  });

  if (error) {
    console.error("add_tracking_event failed:", error.message);
    return { ok: false, error: "Could not add tracking event." };
  }

  return { ok: true };
}
