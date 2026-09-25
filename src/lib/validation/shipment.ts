import type { ShipmentStatus } from "@/types/shipment";
import { STATUS_LABELS } from "@/types/shipment";
import { ValidationError } from "./error";

// Re-exported so existing importers keep a single import site; the
// class itself now lives in ./error so other validators (organization
// provisioning) can share it.
export { ValidationError };

function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ValidationError(`${field} is required.`);
  }
  if (value.length > 500) {
    throw new ValidationError(`${field} is too long.`);
  }
  return value.trim();
}

function optionalDateString(value: unknown, field: string): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    throw new ValidationError(`${field} must be a valid date.`);
  }
  return value;
}

export interface CreateShipmentInput {
  productDescription: string;
  senderName: string;
  origin: string;
  destination: string;
  estimatedDeliveryAt?: string | null;
  productImagePath?: string | null;
  initialLocation?: string | null;
}

export function validateCreateShipmentInput(input: unknown): CreateShipmentInput {
  if (typeof input !== "object" || input === null) {
    throw new ValidationError("Invalid shipment payload.");
  }
  const value = input as Record<string, unknown>;

  return {
    productDescription: requireNonEmptyString(value.productDescription, "Product description"),
    senderName: requireNonEmptyString(value.senderName, "Sender name"),
    origin: requireNonEmptyString(value.origin, "Origin"),
    destination: requireNonEmptyString(value.destination, "Destination"),
    estimatedDeliveryAt: optionalDateString(value.estimatedDeliveryAt, "Estimated delivery"),
    productImagePath:
      typeof value.productImagePath === "string" ? value.productImagePath : null,
    initialLocation: typeof value.initialLocation === "string" ? value.initialLocation : null,
  };
}

export interface AddTrackingEventInput {
  shipmentId: string;
  status: ShipmentStatus;
  location: string;
  latitude: number | null;
  longitude: number | null;
  note: string | null;
  imagePath: string | null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateAddTrackingEventInput(input: unknown): AddTrackingEventInput {
  if (typeof input !== "object" || input === null) {
    throw new ValidationError("Invalid tracking event payload.");
  }
  const value = input as Record<string, unknown>;

  if (typeof value.shipmentId !== "string" || !UUID_RE.test(value.shipmentId)) {
    throw new ValidationError("A valid shipment ID is required.");
  }

  if (typeof value.status !== "string" || !(value.status in STATUS_LABELS)) {
    throw new ValidationError("Invalid shipment status.");
  }

  const latitude = typeof value.latitude === "number" ? value.latitude : null;
  const longitude = typeof value.longitude === "number" ? value.longitude : null;
  if (latitude !== null && (latitude < -90 || latitude > 90)) {
    throw new ValidationError("Latitude must be between -90 and 90.");
  }
  if (longitude !== null && (longitude < -180 || longitude > 180)) {
    throw new ValidationError("Longitude must be between -180 and 180.");
  }

  return {
    shipmentId: value.shipmentId,
    status: value.status as ShipmentStatus,
    location: requireNonEmptyString(value.location, "Location"),
    latitude,
    longitude,
    note: typeof value.note === "string" ? value.note : null,
    imagePath: typeof value.imagePath === "string" ? value.imagePath : null,
  };
}

export const ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB, matches the storage bucket limit

export function validateImageFile(file: { type: string; size: number }): void {
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {
    throw new ValidationError("Unsupported image type. Use JPEG, PNG, or WebP.");
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new ValidationError("Image is too large. Maximum size is 5MB.");
  }
}

export interface StatusUpdateInput {
  shipmentId: string;
  status: ShipmentStatus;
  location: string;
  latitude: number | null;
  longitude: number | null;
  note: string | null;
  imagePath: string | null;
  estimatedDeliveryAt: string | null;
  clearEstimatedDelivery: boolean;
  requiresAction: boolean | null;
  actionMessage: string | null;
}

/**
 * Validates the combined "add tracking event" form used on the shipment
 * detail page: status change, location, optional note/image, and the
 * optional ETA/customs-action fields (PRD sections 13–23).
 */
export function validateStatusUpdateInput(input: unknown): StatusUpdateInput {
  const base = validateAddTrackingEventInput(input);
  const value = input as Record<string, unknown>;

  const estimatedDeliveryAt = optionalDateString(value.estimatedDeliveryAt, "Estimated delivery");
  const clearEstimatedDelivery = value.clearEstimatedDelivery === true;

  const requiresAction =
    typeof value.requiresAction === "boolean" ? value.requiresAction : null;
  const actionMessage = typeof value.actionMessage === "string" ? value.actionMessage.trim() : null;

  if (requiresAction === true && !actionMessage) {
    throw new ValidationError("An action message is required when action is required.");
  }

  return {
    ...base,
    estimatedDeliveryAt,
    clearEstimatedDelivery,
    requiresAction,
    actionMessage: requiresAction === false ? null : actionMessage,
  };
}
