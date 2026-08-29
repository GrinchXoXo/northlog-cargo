import { createClient } from "@/lib/supabase/client";
import { validateImageFile, ValidationError } from "@/lib/validation/shipment";

const SHIPMENT_IMAGES_BUCKET = "shipment-images";

export type UploadImageResult = { ok: true; path: string } | { ok: false; error: string };

/**
 * Uploads a shipment image directly from the browser to the
 * shipment-images bucket (supabase/migrations/0004_storage.sql). Runs
 * client-side because it needs a File object; the resulting storage
 * path is what gets passed to createShipment/addTrackingEvent.
 */
export async function uploadShipmentImage(file: File): Promise<UploadImageResult> {
  try {
    validateImageFile(file);
  } catch (err) {
    if (err instanceof ValidationError) {
      return { ok: false, error: err.message };
    }
    throw err;
  }

  const supabase = createClient();

  const extension = file.name.split(".").pop() || "jpg";
  const path = `${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from(SHIPMENT_IMAGES_BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    return { ok: false, error: "Image upload failed. Please try another image." };
  }

  return { ok: true, path };
}
