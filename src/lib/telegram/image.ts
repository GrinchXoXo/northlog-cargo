import { createServiceRoleClient } from "@/lib/supabase/service";
import { getFile, downloadFile } from "./api";
import { validateImageFile, ValidationError } from "@/lib/validation/shipment";

const BUCKET = "shipment-images";

/**
 * Pipes a Telegram photo (by file_id) into the same Supabase Storage
 * bucket the dashboard uses (PRD section 12), so an image uploaded via
 * Telegram is indistinguishable from one uploaded via the dashboard.
 * Returns the storage path (not a URL): same shape as
 * lib/shipments/uploadShipmentImage.ts.
 */
export async function uploadTelegramPhoto(fileId: string): Promise<string> {
  const file = await getFile(fileId);
  if (!file.file_path) {
    throw new Error("Telegram did not return a file path for this photo.");
  }

  const { bytes, contentType } = await downloadFile(file.file_path);

  validateImageFile({ type: contentType, size: bytes.byteLength });

  const extension = file.file_path.split(".").pop() || "jpg";
  const path = `telegram/${crypto.randomUUID()}.${extension}`;

  const supabase = createServiceRoleClient();
  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
    contentType,
    upsert: false,
  });

  if (error) {
    throw new ValidationError("Could not upload the image. Please try again.");
  }

  return path;
}
