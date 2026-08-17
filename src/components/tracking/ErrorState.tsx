import { PackageSearch, TriangleAlert } from "lucide-react";
import { ContactSupport } from "./ContactSupport";

export function NotFoundState({ trackingId }: { trackingId: string }) {
  return (
    <div className="flex flex-col items-center gap-5 rounded-[var(--radius-lg)] border border-hairline bg-surface px-8 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-sunken text-slate">
        <PackageSearch size={22} strokeWidth={2} />
      </span>
      <div>
        <h3 className="font-display text-xl font-semibold text-ink">
          We couldn&apos;t find a shipment with that tracking number.
        </h3>
        <p className="mt-2 text-sm text-slate">
          We checked <span className="font-data text-ink">{trackingId}</span> against our
          records. Please check the number and try again.
        </p>
      </div>
      <ContactSupport variant="inline" />
    </div>
  );
}

export function ServerErrorState() {
  return (
    <div className="flex flex-col items-center gap-5 rounded-[var(--radius-lg)] border border-hairline bg-surface px-8 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-danger-tint text-danger">
        <TriangleAlert size={22} strokeWidth={2} />
      </span>
      <div>
        <h3 className="font-display text-xl font-semibold text-ink">
          We couldn&apos;t retrieve your shipment right now.
        </h3>
        <p className="mt-2 text-sm text-slate">Please try again shortly or contact support.</p>
      </div>
      <ContactSupport variant="inline" />
    </div>
  );
}
