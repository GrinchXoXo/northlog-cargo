import type { AdminShipment, AdminTrackingEvent } from "@/types/shipment";

/** Raw shape of a row from the `shipments` table as Supabase returns it. */
export interface RawShipmentRow {
  id: string;
  tracking_id: string;
  product_description: string;
  product_image_path: string | null;
  sender_name: string;
  origin: string;
  destination: string;
  current_status: AdminShipment["currentStatus"];
  current_location_label: string | null;
  current_latitude: number | null;
  current_longitude: number | null;
  current_location_updated_at: string | null;
  estimated_delivery_at: string | null;
  requires_action: boolean;
  action_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface RawTrackingEventRow {
  id: string;
  shipment_id: string;
  status: AdminTrackingEvent["status"];
  location: string;
  latitude: number | null;
  longitude: number | null;
  note: string | null;
  image_path: string | null;
  created_at: string;
}

export function mapShipmentRow(row: RawShipmentRow): AdminShipment {
  return {
    id: row.id,
    trackingId: row.tracking_id,
    productDescription: row.product_description,
    productImagePath: row.product_image_path,
    senderName: row.sender_name,
    origin: row.origin,
    destination: row.destination,
    currentStatus: row.current_status,
    currentLocationLabel: row.current_location_label,
    currentLatitude: row.current_latitude,
    currentLongitude: row.current_longitude,
    currentLocationUpdatedAt: row.current_location_updated_at,
    estimatedDeliveryAt: row.estimated_delivery_at,
    requiresAction: row.requires_action,
    actionMessage: row.action_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapTrackingEventRow(row: RawTrackingEventRow): AdminTrackingEvent {
  return {
    id: row.id,
    shipmentId: row.shipment_id,
    status: row.status,
    location: row.location,
    latitude: row.latitude,
    longitude: row.longitude,
    note: row.note,
    imagePath: row.image_path,
    createdAt: row.created_at,
  };
}
