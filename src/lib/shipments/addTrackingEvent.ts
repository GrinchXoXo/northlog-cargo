import { createClient } from "@/lib/supabase/server";
import { validateStatusUpdateInput, ValidationError } from "@/lib/validation/shipment";
import type { ShipmentActionContext } from "./context";

export type AddTrackingEventResult = { ok: true } | { ok: false; error: string };

/**
 * Inserts a new tracking event and updates the shipment's current
 * status, location, ETA, and customs-action fields atomically via
 * add_tracking_event() (supabase/migrations/0007, widened in 0009).
 * Historical events are never overwritten: see PRD section 11/14.
 * Requires an authenticated admin: either the caller's browser session
 * (default) or a pre-authorized bot context (see lib/shipments/context.ts).
 */
export async function addTrackingEvent(
  input: unknown,
  ctx?: ShipmentActionContext
): Promise<AddTrackingEventResult> {
  let validated;
  try {
    validated = validateStatusUpdateInput(input);
  } catch (err) {
    if (err instanceof ValidationError) {
      return { ok: false, error: err.message };
    }
    throw err;
  }

  const supabase = ctx ? ctx.client : await createClient();

  if (!ctx) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, error: "Authentication required." };
    }
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
    p_actor_id: ctx ? ctx.actorId : null,
  });

  if (error) {
    console.error("add_tracking_event failed:", error.message);
    return { ok: false, error: "Could not add tracking event." };
  }

  return { ok: true };
}
