import { ArrowRight } from "lucide-react";
import type { Shipment } from "@/types/shipment";

export function ShipmentSummary({ shipment }: { shipment: Shipment }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-hairline bg-surface p-6 sm:p-8">
      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-surface-sunken">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={shipment.product.image}
            alt={`Package photo: ${shipment.product.description}`}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="flex-1">
          <h3 className="font-display text-lg font-semibold text-ink">
            {shipment.product.description}
          </h3>
          <p className="mt-1 text-sm text-slate">
            Sender <span className="text-ink">{shipment.sender.name}</span>
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3 font-data text-sm">
            <div>
              <p className="text-xs uppercase tracking-[0.1em] text-slate-light">From</p>
              <p className="mt-1 text-ink">{shipment.origin}</p>
            </div>
            <ArrowRight size={16} className="mt-4 text-slate-light" aria-hidden="true" />
            <div>
              <p className="text-xs uppercase tracking-[0.1em] text-slate-light">To</p>
              <p className="mt-1 text-ink">{shipment.destination}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
