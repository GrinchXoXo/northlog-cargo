import { createClient } from "@/lib/supabase/server";

export type UpdateShipmentResult = { ok: true } | { ok: false; error: string };

export interface UpdateShipmentInput {
  productDescription?: string;
  senderName?: string;
  origin?: string;
  destination?: string;
  estimatedDeliveryAt?: string | null;
  productImagePath?: string | null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Patches shipment fields that don't represent a status change (e.g.
 * correcting a typo in the product description). Status changes and
 * location updates go through addTrackingEvent() instead, so the
 * append-only history stays authoritative for those.
 */
export async function updateShipment(
  shipmentId: string,
  input: UpdateShipmentInput
): Promise<UpdateShipmentResult> {
  if (!UUID_RE.test(shipmentId)) {
    return { ok: false, error: "Invalid shipment ID." };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Authentication required." };
  }

  const patch: Record<string, unknown> = {};
  if (input.productDescription !== undefined) patch.product_description = input.productDescription;
  if (input.senderName !== undefined) patch.sender_name = input.senderName;
  if (input.origin !== undefined) patch.origin = input.origin;
  if (input.destination !== undefined) patch.destination = input.destination;
  if (input.estimatedDeliveryAt !== undefined) patch.estimated_delivery_at = input.estimatedDeliveryAt;
  if (input.productImagePath !== undefined) patch.product_image_path = input.productImagePath;

  if (Object.keys(patch).length === 0) {
    return { ok: true };
  }

  const { error } = await supabase.from("shipments").update(patch).eq("id", shipmentId);

  if (error) {
    console.error("updateShipment failed:", error.message);
    return { ok: false, error: "Could not update shipment." };
  }

  return { ok: true };
}
