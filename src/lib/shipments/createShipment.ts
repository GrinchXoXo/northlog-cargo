import { createClient } from "@/lib/supabase/server";
import { validateCreateShipmentInput, ValidationError } from "@/lib/validation/shipment";
import type { ShipmentActionContext } from "./context";

export type CreateShipmentResult =
  | { ok: true; trackingId: string; shipmentId: string }
  | { ok: false; error: string };

/**
 * Creates a shipment and its initial tracking event atomically via the
 * create_shipment_with_event() RPC (supabase/migrations/0003, widened in
 * 0009). Requires an authenticated admin: either the caller's browser
 * session (default) or a pre-authorized bot context (see
 * lib/shipments/context.ts).
 */
export async function createShipment(
  input: unknown,
  ctx?: ShipmentActionContext
): Promise<CreateShipmentResult> {
  let validated;
  try {
    validated = validateCreateShipmentInput(input);
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

  const { data, error } = await supabase
    .rpc("create_shipment_with_event", {
      p_product_description: validated.productDescription,
      p_sender_name: validated.senderName,
      p_origin: validated.origin,
      p_destination: validated.destination,
      p_estimated_delivery_at: validated.estimatedDeliveryAt,
      p_product_image_path: validated.productImagePath,
      p_initial_location: validated.initialLocation,
      p_actor_id: ctx ? ctx.actorId : null,
    })
    .single();

  if (error || !data) {
    console.error("create_shipment_with_event failed:", error?.message);
    return { ok: false, error: "Could not create shipment." };
  }

  const shipment = data as { id: string; tracking_id: string };
  return { ok: true, trackingId: shipment.tracking_id, shipmentId: shipment.id };
}
