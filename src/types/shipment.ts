/**
 * Shipment types.
 *
 * These mirror the Phase 1 frontend data contract (see
 * PRD/PHASE-01-PUBLIC-WEBSITE.md, section 30) and the conceptual data model
 * in PRD/MASTER-PRD.md (sections 13–14). They are intentionally shaped so
 * that a Phase 2 backend/API response can be mapped onto the same types
 * without redesigning the tracking UI.
 */

export type ShipmentStatus =
  | "SHIPMENT_CREATED"
  | "RECEIVED_AT_ORIGIN"
  | "PROCESSING"
  | "DEPARTED_ORIGIN"
  | "IN_TRANSIT"
  | "ARRIVED_DESTINATION_COUNTRY"
  | "CUSTOMS_CLEARANCE"
  | "RECEIVED_LOCAL_FACILITY"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "EXCEPTION";

/** Canonical, ordered lifecycle used to render timeline progress. */
export const STATUS_ORDER: ShipmentStatus[] = [
  "SHIPMENT_CREATED",
  "RECEIVED_AT_ORIGIN",
  "PROCESSING",
  "DEPARTED_ORIGIN",
  "IN_TRANSIT",
  "ARRIVED_DESTINATION_COUNTRY",
  "CUSTOMS_CLEARANCE",
  "RECEIVED_LOCAL_FACILITY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

export const STATUS_LABELS: Record<ShipmentStatus, string> = {
  SHIPMENT_CREATED: "Shipment Created",
  RECEIVED_AT_ORIGIN: "Received at Origin",
  PROCESSING: "Processing",
  DEPARTED_ORIGIN: "Departed Origin",
  IN_TRANSIT: "In Transit",
  ARRIVED_DESTINATION_COUNTRY: "Arrived in Destination Country",
  CUSTOMS_CLEARANCE: "Customs Clearance",
  RECEIVED_LOCAL_FACILITY: "Received at Local Facility",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  EXCEPTION: "Exception",
};

export interface ShipmentProduct {
  description: string;
  image: string;
}

export interface ShipmentSender {
  name: string;
}

export interface ShipmentLocation {
  label: string;
  latitude: number | null;
  longitude: number | null;
  updatedAt: string;
}

export interface EstimatedDelivery {
  from: string;
  to: string;
}

export interface TrackingEvent {
  status: ShipmentStatus;
  location: string;
  timestamp: string;
  note?: string;
}

export interface Shipment {
  trackingId: string;
  product: ShipmentProduct;
  sender: ShipmentSender;
  origin: string;
  destination: string;
  status: ShipmentStatus;
  currentLocation: ShipmentLocation;
  estimatedDelivery: EstimatedDelivery;
  /** Canonical single-timestamp ETA, used for the live countdown (Phase 3). Null if unset. */
  estimatedDeliveryAt: string | null;
  /** True while the shipment needs recipient action (e.g. customs clearance). */
  requiresAction: boolean;
  /** Customer-facing message shown when requiresAction is true. */
  actionMessage: string | null;
  events: TrackingEvent[];
}

/** Discriminated result type for the tracking lookup abstraction. */
export type TrackingLookupResult =
  | { state: "success"; shipment: Shipment }
  | { state: "not_found" }
  | { state: "error" };

/**
 * Full internal shipment record as read directly from the `shipments`
 * table by an authenticated admin. Distinct from `Shipment` (the public
 * contract) because it includes fields the public tracking page must
 * never see: see PRD/Phase_02___Backend___Database.md section 13.
 */
export interface AdminShipment {
  id: string;
  trackingId: string;
  productDescription: string;
  productImagePath: string | null;
  senderName: string;
  origin: string;
  destination: string;
  currentStatus: ShipmentStatus;
  currentLocationLabel: string | null;
  currentLatitude: number | null;
  currentLongitude: number | null;
  currentLocationUpdatedAt: string | null;
  estimatedDeliveryAt: string | null;
  requiresAction: boolean;
  actionMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminTrackingEvent {
  id: string;
  shipmentId: string;
  status: ShipmentStatus;
  location: string;
  latitude: number | null;
  longitude: number | null;
  note: string | null;
  imagePath: string | null;
  createdAt: string;
}

export interface DashboardCounts {
  total: number;
  inTransit: number;
  awaitingCustoms: number;
  outForDelivery: number;
  delivered: number;
  exceptions: number;
}
