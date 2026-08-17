import type { Shipment } from "@/types/shipment";

/**
 * Mock shipment records.
 *
 * Isolated from UI components so this file (or the shape it exports) can be
 * swapped for a real backend call in Phase 2 without touching any tracking
 * component. See PRD/PHASE-01-PUBLIC-WEBSITE.md section 27.
 */
export const MOCK_SHIPMENTS: Record<string, Shipment> = {
  "NMX-842731": {
    trackingId: "NMX-842731",
    product: {
      description: "Nike Air Max Shoes",
      image: "/images/placeholder-package.svg",
    },
    sender: {
      name: "John Doe",
    },
    origin: "Guangzhou, China",
    destination: "Lagos, Nigeria",
    status: "IN_TRANSIT",
    currentLocation: {
      label: "International Transit",
      latitude: null,
      longitude: null,
      updatedAt: "2026-08-07T04:15:00Z",
    },
    estimatedDelivery: {
      from: "2026-08-14",
      to: "2026-08-16",
    },
    estimatedDeliveryAt: "2026-08-15T14:00:00Z",
    requiresAction: false,
    actionMessage: null,
    events: [
      {
        status: "SHIPMENT_CREATED",
        location: "Guangzhou, China",
        timestamp: "2026-08-06T09:42:00Z",
      },
      {
        status: "DEPARTED_ORIGIN",
        location: "Guangzhou, China",
        timestamp: "2026-08-06T18:20:00Z",
      },
      {
        status: "IN_TRANSIT",
        location: "International Transit",
        timestamp: "2026-08-07T04:15:00Z",
      },
    ],
  },
  "NMX-113305": {
    trackingId: "NMX-113305",
    product: {
      description: "Office Desk Chair",
      image: "/images/placeholder-package.svg",
    },
    sender: {
      name: "Amara Okoye",
    },
    origin: "Istanbul, Turkey",
    destination: "Port Harcourt, Nigeria",
    status: "DELIVERED",
    currentLocation: {
      label: "Port Harcourt, Nigeria",
      latitude: null,
      longitude: null,
      updatedAt: "2026-08-05T15:02:00Z",
    },
    estimatedDelivery: {
      from: "2026-08-05",
      to: "2026-08-05",
    },
    estimatedDeliveryAt: "2026-08-05T15:02:00Z",
    requiresAction: false,
    actionMessage: null,
    events: [
      {
        status: "SHIPMENT_CREATED",
        location: "Istanbul, Turkey",
        timestamp: "2026-07-29T10:00:00Z",
      },
      {
        status: "DEPARTED_ORIGIN",
        location: "Istanbul, Turkey",
        timestamp: "2026-07-30T06:40:00Z",
      },
      {
        status: "IN_TRANSIT",
        location: "International Transit",
        timestamp: "2026-08-01T12:00:00Z",
      },
      {
        status: "ARRIVED_DESTINATION_COUNTRY",
        location: "Lagos, Nigeria",
        timestamp: "2026-08-03T09:15:00Z",
      },
      {
        status: "RECEIVED_LOCAL_FACILITY",
        location: "Port Harcourt, Nigeria",
        timestamp: "2026-08-04T08:30:00Z",
      },
      {
        status: "OUT_FOR_DELIVERY",
        location: "Port Harcourt, Nigeria",
        timestamp: "2026-08-05T09:10:00Z",
      },
      {
        status: "DELIVERED",
        location: "Port Harcourt, Nigeria",
        timestamp: "2026-08-05T15:02:00Z",
        note: "Received by front desk.",
      },
    ],
  },
};
