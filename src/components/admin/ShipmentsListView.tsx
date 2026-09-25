import Link from "next/link";
import { StatusBadge } from "@/components/tracking/StatusBadge";
import { SearchBox } from "@/app/admin/(protected)/shipments/SearchBox";
import type { AdminShipment } from "@/types/shipment";

function formatUpdated(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * The shipments list body, shared by the organization admin's
 * `/admin/shipments` page and the platform owner's organization-context
 * view. `basePath` is the route this list lives on (it drives both the
 * search box and the per-row detail links), so the two callers render
 * identical markup against their own URLs.
 */
export function ShipmentsListView({
  shipments,
  error,
  search,
  basePath,
  createShipmentHref,
}: {
  shipments: AdminShipment[];
  error: string | null;
  search: string;
  basePath: string;
  createShipmentHref?: string;
}) {
  const q = search.trim();

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-2xl font-semibold text-ink">Shipments</h1>
        {createShipmentHref && (
          <Link
            href={createShipmentHref}
            className="inline-flex items-center justify-center rounded-[var(--radius-sm)] bg-signal px-4 py-2.5 text-sm font-medium text-white hover:bg-signal-hover"
          >
            Create Shipment
          </Link>
        )}
      </div>

      <div className="mt-6">
        <SearchBox initialValue={q} basePath={basePath} />
      </div>

      {error && <p className="mt-6 text-sm text-danger">{error}</p>}

      {!error && shipments.length === 0 && (
        <p className="mt-10 text-sm text-slate">
          {q ? `No shipments match "${q}".` : "No shipments yet."}
        </p>
      )}

      {!error && shipments.length > 0 && (
        <>
          {/* Mobile: stacked cards. Genuinely usable on a touch screen,
              rather than just technically not overflowing. */}
          <div className="mt-6 flex flex-col gap-3 sm:hidden">
            {shipments.map((shipment) => (
              <Link
                key={shipment.id}
                href={`${basePath}/${shipment.trackingId}`}
                className="block rounded-[var(--radius-lg)] border border-hairline bg-surface p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-data text-sm font-medium text-cargo">
                    {shipment.trackingId}
                  </span>
                  <StatusBadge status={shipment.currentStatus} />
                </div>
                <p className="mt-2 text-sm text-ink">{shipment.senderName}</p>
                <p className="text-sm text-slate">{shipment.destination}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-light">
                  <span>{shipment.currentLocationLabel || "Not set"}</span>
                  <span className="font-data">{formatUpdated(shipment.updatedAt)}</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Tablet and up: full table. */}
          <div className="mt-6 hidden overflow-x-auto rounded-[var(--radius-lg)] border border-hairline bg-surface sm:block">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-hairline text-xs uppercase tracking-[0.08em] text-slate-light">
                  <th className="px-4 py-3 font-medium">Tracking ID</th>
                  <th className="px-4 py-3 font-medium">Sender</th>
                  <th className="px-4 py-3 font-medium">Destination</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody>
                {shipments.map((shipment) => (
                  <tr key={shipment.id} className="border-b border-hairline last:border-0">
                    <td className="px-4 py-3">
                      <Link
                        href={`${basePath}/${shipment.trackingId}`}
                        className="font-data text-sm font-medium text-cargo hover:text-cargo-hover"
                      >
                        {shipment.trackingId}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-ink">{shipment.senderName}</td>
                    <td className="px-4 py-3 text-ink">{shipment.destination}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={shipment.currentStatus} />
                    </td>
                    <td className="px-4 py-3 text-slate">
                      {shipment.currentLocationLabel || "Not set"}
                    </td>
                    <td className="px-4 py-3 font-data text-xs text-slate-light">
                      {formatUpdated(shipment.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
