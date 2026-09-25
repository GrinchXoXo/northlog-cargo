import { createClient } from "@/lib/supabase/server";
import { validateCreateShipmentInput, ValidationError } from "@/lib/validation/shipment";

export type CreateShipmentResult =
  | { ok: true; trackingId: string; shipmentId: string }
  | { ok: false; error: string };

/**
 * Creates a shipment and its initial tracking event atomically via the
 * create_shipment_with_event() RPC (supabase/migrations/0003, superseded
 * in 0007/0009, organization-aware in 0014). Requires an authenticated
 * admin: the function is SECURITY INVOKER, so both the write and the
 * organization it is filed under come from the caller's session.
 */
export async function createShipment(input: unknown): Promise<CreateShipmentResult> {
  let validated;
  try {
    validated = validateCreateShipmentInput(input);
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

  const { data, error } = await supabase
    .rpc("create_shipment_with_event", {
      p_product_description: validated.productDescription,
      p_sender_name: validated.senderName,
      p_origin: validated.origin,
      p_destination: validated.destination,
      p_estimated_delivery_at: validated.estimatedDeliveryAt,
      p_product_image_path: validated.productImagePath,
      p_initial_location: validated.initialLocation,
    })
    .single();

  if (error || !data) {
    console.error("create_shipment_with_event failed:", error?.message);
    return { ok: false, error: "Could not create shipment." };
  }

  const shipment = data as { id: string; tracking_id: string };
  return { ok: true, trackingId: shipment.tracking_id, shipmentId: shipment.id };
}
