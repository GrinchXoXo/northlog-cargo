import { MapPin } from "lucide-react";
import type { ShipmentLocation } from "@/types/shipment";
import { formatRelativeTime } from "@/lib/format";

export function LocationCard({ location }: { location: ShipmentLocation }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-hairline bg-surface p-6 sm:p-8">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cargo-tint text-cargo">
          <MapPin size={17} strokeWidth={2.25} />
        </span>
        <div>
          <p className="font-data text-xs uppercase tracking-[0.12em] text-slate-light">
            Last Known Location
          </p>
          <p className="mt-1 font-display text-xl font-semibold text-ink">{location.label}</p>
          <p className="mt-1 text-sm text-slate">
            Last updated {formatRelativeTime(location.updatedAt)}
          </p>
        </div>
      </div>
    </div>
  );
}
