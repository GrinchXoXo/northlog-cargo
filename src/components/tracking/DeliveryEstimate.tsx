"use client";

import { useEffect, useState } from "react";
import { CalendarClock, PauseCircle, Clock } from "lucide-react";

function getRemaining(targetIso: string, now: Date) {
  const diffMs = new Date(targetIso).getTime() - now.getTime();
  if (diffMs <= 0) return null;

  const totalMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (days > 0 || hours > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  return parts.join(" ");
}

export function DeliveryEstimate({
  estimatedDeliveryAt,
  paused,
}: {
  estimatedDeliveryAt: string | null;
  /** True while the shipment is blocked on a customer action (e.g. customs). */
  paused: boolean;
}) {
  // Initialized once per mount; only ever updated from the interval
  // callback below, never synchronously in the effect body. The initial
  // render (server and client) can disagree on the exact minute, so the
  // countdown text is marked suppressHydrationWarning below: it's a
  // live clock, not content whose mismatch matters.
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  let icon = <CalendarClock size={17} strokeWidth={2.25} />;
  const heading = "Estimated Delivery";
  let body: string;
  let sub = "An estimate based on current progress, not a guaranteed delivery date.";

  if (paused) {
    icon = <PauseCircle size={17} strokeWidth={2.25} />;
    body = "Delivery estimate paused";
    sub = "Action is required from the recipient before this shipment can continue.";
  } else if (!estimatedDeliveryAt) {
    body = "Not yet available";
    sub = "An estimate will appear here once one has been set.";
  } else {
    const remaining = getRemaining(estimatedDeliveryAt, now);
    if (remaining === null) {
      icon = <Clock size={17} strokeWidth={2.25} />;
      body = "Delivery update pending";
      sub = "This shipment's estimate has passed. We're confirming its latest status.";
    } else {
      body = remaining;
    }
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-hairline bg-surface p-6 sm:p-8">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-signal-tint text-signal">
          {icon}
        </span>
        <div>
          <p className="font-data text-xs uppercase tracking-[0.12em] text-slate-light">{heading}</p>
          <p className="mt-1 font-display text-xl font-semibold text-ink" suppressHydrationWarning>
            {body}
          </p>
          <p className="mt-1 text-sm text-slate">{sub}</p>
        </div>
      </div>
    </div>
  );
}
