import type { ShipmentStatus } from "@/types/shipment";
import { STATUS_LABELS } from "@/types/shipment";

const EXCEPTION_STATUSES: ShipmentStatus[] = ["EXCEPTION"];
const DELIVERED_STATUSES: ShipmentStatus[] = ["DELIVERED"];

export function StatusBadge({ status }: { status: ShipmentStatus }) {
  const isException = EXCEPTION_STATUSES.includes(status);
  const isDelivered = DELIVERED_STATUSES.includes(status);

  const tone = isException
    ? "border-danger text-danger bg-danger-tint"
    : isDelivered
      ? "border-cargo text-cargo bg-cargo-tint"
      : "border-signal text-signal bg-signal-tint";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-[var(--radius-sm)] border px-3 py-1.5 font-data text-xs font-semibold uppercase tracking-[0.12em] ${tone}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${isException ? "bg-danger" : isDelivered ? "bg-cargo" : "bg-signal"} ${
          !isDelivered && !isException ? "animate-pulse" : ""
        }`}
        aria-hidden="true"
      />
      {STATUS_LABELS[status]}
    </span>
  );
}
