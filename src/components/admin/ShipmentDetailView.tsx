import { StatusBadge } from "@/components/tracking/StatusBadge";
import { formatDate, formatTime } from "@/lib/format";
import { StatusUpdateForm } from "@/app/admin/(protected)/shipments/[trackingId]/StatusUpdateForm";
import type { AdminShipment, AdminTrackingEvent } from "@/types/shipment";

/**
 * The shipment detail body, shared by the organization admin's
 * shipment page and the platform owner's organization-context view.
 *
 * In "inspect" mode (platform owner) the tracking-update form is
 * replaced by a note: status changes remain an organization-admin
 * action, performed through their own session and RLS. Everything
 * above it renders identically.
 */
export function ShipmentDetailView({
  shipment,
  events,
  mode = "admin",
}: {
  shipment: AdminShipment;
  events: AdminTrackingEvent[];
  mode?: "admin" | "inspect";
}) {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
      <div className="lg:col-span-3 flex flex-col gap-6">
        <div className="rounded-[var(--radius-lg)] border border-hairline bg-surface p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-data text-2xl font-semibold tracking-wide text-ink">
              {shipment.trackingId}
            </p>
            <StatusBadge status={shipment.currentStatus} />
          </div>

          <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="font-data text-xs uppercase tracking-[0.1em] text-slate-light">Sender</dt>
              <dd className="mt-1 text-sm text-ink">{shipment.senderName}</dd>
            </div>
            <div>
              <dt className="font-data text-xs uppercase tracking-[0.1em] text-slate-light">Product</dt>
              <dd className="mt-1 text-sm text-ink">{shipment.productDescription}</dd>
            </div>
            <div>
              <dt className="font-data text-xs uppercase tracking-[0.1em] text-slate-light">Origin</dt>
              <dd className="mt-1 text-sm text-ink">{shipment.origin}</dd>
            </div>
            <div>
              <dt className="font-data text-xs uppercase tracking-[0.1em] text-slate-light">Destination</dt>
              <dd className="mt-1 text-sm text-ink">{shipment.destination}</dd>
            </div>
            <div>
              <dt className="font-data text-xs uppercase tracking-[0.1em] text-slate-light">
                Current Location
              </dt>
              <dd className="mt-1 text-sm text-ink">{shipment.currentLocationLabel || "Not set"}</dd>
            </div>
            <div>
              <dt className="font-data text-xs uppercase tracking-[0.1em] text-slate-light">
                Estimated Delivery
              </dt>
              <dd className="mt-1 text-sm text-ink">
                {shipment.estimatedDeliveryAt
                  ? new Date(shipment.estimatedDeliveryAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "2-digit",
                      year: "numeric",
                    })
                  : "Not set"}
              </dd>
            </div>
          </dl>

          {shipment.requiresAction && (
            <div className="mt-6 rounded-[var(--radius-md)] border border-signal bg-signal-tint p-4">
              <p className="font-data text-xs uppercase tracking-[0.1em] text-signal">Action Required</p>
              <p className="mt-1 text-sm text-ink">{shipment.actionMessage}</p>
            </div>
          )}
        </div>

        <div className="rounded-[var(--radius-lg)] border border-hairline bg-surface p-6 sm:p-8">
          <h2 className="font-display text-lg font-semibold text-ink mb-6">Tracking History</h2>
          <ol className="flex flex-col gap-4">
            {events.map((event) => (
              <li key={event.id} className="border-b border-hairline pb-4 last:border-0 last:pb-0">
                <p className="text-sm font-medium text-ink">
                  {event.status.replaceAll("_", " ")}
                </p>
                <p className="mt-0.5 text-sm text-slate">{event.location}</p>
                <p className="mt-0.5 font-data text-xs text-slate-light">
                  {formatDate(event.createdAt)}, {formatTime(event.createdAt)}
                </p>
                {event.note && <p className="mt-1 text-sm italic text-slate">{event.note}</p>}
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="sticky top-6 rounded-[var(--radius-lg)] border border-hairline bg-surface p-6 sm:p-8">
          {mode === "inspect" ? (
            <>
              <h2 className="font-display text-lg font-semibold text-ink mb-6">Inspection view</h2>
              <p className="text-sm text-slate">
                Read-only platform view. Status updates are made by this organization&apos;s
                administrators from their own dashboard.
              </p>
            </>
          ) : (
            <>
              <h2 className="font-display text-lg font-semibold text-ink mb-6">Add Tracking Update</h2>
              <StatusUpdateForm
                shipmentId={shipment.id}
                currentStatus={shipment.currentStatus}
                currentLocation={shipment.currentLocationLabel ?? ""}
                requiresAction={shipment.requiresAction}
                actionMessage={shipment.actionMessage ?? ""}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
