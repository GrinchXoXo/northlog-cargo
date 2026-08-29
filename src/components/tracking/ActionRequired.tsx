import { AlertTriangle } from "lucide-react";
import { ContactSupport } from "./ContactSupport";

export function ActionRequired({ message, trackingId }: { message: string; trackingId: string }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-signal bg-signal-tint p-6 sm:p-8">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-signal">
          <AlertTriangle size={17} strokeWidth={2.25} />
        </span>
        <div className="flex-1">
          <p className="font-data text-xs uppercase tracking-[0.12em] text-signal">
            Action Required
          </p>
          <p className="mt-1 text-sm leading-relaxed text-ink">{message}</p>
          <div className="mt-4">
            <ContactSupport variant="inline" trackingId={trackingId} />
          </div>
        </div>
      </div>
    </div>
  );
}
