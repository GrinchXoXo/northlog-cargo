import type { Shipment } from "@/types/shipment";
import { formatRelativeTime } from "@/lib/format";
import { StatusBadge } from "./StatusBadge";
import { ShipmentSummary } from "./ShipmentSummary";
import { TrackingTimeline } from "./TrackingTimeline";
import { LocationCard } from "./LocationCard";
import { DeliveryEstimate } from "./DeliveryEstimate";
import { ActionRequired } from "./ActionRequired";
import { ContactSupport } from "./ContactSupport";

export function TrackingResult({ shipment }: { shipment: Shipment }) {
  const lastEvent = shipment.events[shipment.events.length - 1];

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-[var(--radius-lg)] border border-hairline bg-surface p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-data text-xs uppercase tracking-[0.12em] text-slate-light">
              Tracking ID
            </p>
            <p className="mt-1 font-data text-2xl font-semibold tracking-wide text-ink">
              {shipment.trackingId}
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <StatusBadge status={shipment.status} />
            {lastEvent && (
              <p className="text-xs text-slate">
                Last updated {formatRelativeTime(lastEvent.timestamp)}
              </p>
            )}
          </div>
        </div>
      </div>

      {shipment.requiresAction && shipment.actionMessage && (
        <ActionRequired message={shipment.actionMessage} trackingId={shipment.trackingId} />
      )}

      <ShipmentSummary shipment={shipment} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <LocationCard location={shipment.currentLocation} />
        <DeliveryEstimate
          estimatedDeliveryAt={shipment.estimatedDeliveryAt}
          paused={shipment.requiresAction}
        />
      </div>

      <div className="rounded-[var(--radius-lg)] border border-hairline bg-surface p-6 sm:p-8">
        <h3 className="font-display text-lg font-semibold text-ink mb-6">Tracking History</h3>
        <TrackingTimeline shipment={shipment} />
      </div>

      <ContactSupport trackingId={shipment.trackingId} />
    </div>
  );
}
