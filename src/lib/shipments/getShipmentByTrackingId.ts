import { createClient } from "@/lib/supabase/server";
import type { Shipment, TrackingLookupResult } from "@/types/shipment";

const PLACEHOLDER_PRODUCT_IMAGE = "/images/placeholder-package.svg";
const SHIPMENT_IMAGES_BUCKET = "shipment-images";

/**
 * Looks up a shipment by tracking ID via the public get_public_shipment()
 * Postgres function (see supabase/migrations/0007_phase3_schema_and_functions.sql
 * for its current definition: originally created in 0002, superseded there).
 * That function already shapes most of its result to match the Shipment
 * type; this layer additionally resolves the stored image path (if any)
 * to a public URL and falls back to the Phase 1 placeholder when no
 * image has been uploaded yet.
 */
export async function getShipmentByTrackingId(
  rawTrackingId: string
): Promise<TrackingLookupResult> {
  const trackingId = rawTrackingId.trim();
  if (!trackingId) {
    return { state: "not_found" };
  }
  // Defensive cap: real tracking IDs are ~10 chars (NMX-XXXXXX). This
  // isn't a performance concern (the RPC does a simple indexed equality
  // lookup either way), just rejecting obviously-malformed input before
  // it reaches the database. See Phase 7 PRD section 19.
  if (trackingId.length > 64) {
    return { state: "not_found" };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_public_shipment", {
    p_tracking_id: trackingId,
  });

  if (error) {
    console.error("get_public_shipment failed:", error.message);
    return { state: "error" };
  }

  if (!data) {
    return { state: "not_found" };
  }

  const raw = data as Shipment;
  const imagePath = raw.product.image;

  const shipment: Shipment = {
    ...raw,
    product: {
      ...raw.product,
      image: imagePath
        ? supabase.storage.from(SHIPMENT_IMAGES_BUCKET).getPublicUrl(imagePath).data.publicUrl
        : PLACEHOLDER_PRODUCT_IMAGE,
    },
  };

  return { state: "success", shipment };
}

