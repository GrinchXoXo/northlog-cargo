import { Check } from "lucide-react";
import type { Shipment, TrackingEvent } from "@/types/shipment";
import { STATUS_LABELS, STATUS_ORDER } from "@/types/shipment";
import { formatDate, formatTime } from "@/lib/format";

type TimelineNode =
  | { kind: "completed"; event: TrackingEvent }
  | { kind: "current"; event: TrackingEvent }
  | { kind: "pending"; status: (typeof STATUS_ORDER)[number] };

function buildNodes(shipment: Shipment): TimelineNode[] {
  const { events, status } = shipment;
  if (events.length === 0) return [];

  const lastEvent = events[events.length - 1];
  const completedEvents = events.slice(0, -1);

  const nodes: TimelineNode[] = completedEvents.map((event) => ({
    kind: "completed",
    event,
  }));

  const isTerminal = status === "DELIVERED" || status === "EXCEPTION";
  nodes.push({ kind: isTerminal ? "completed" : "current", event: lastEvent });

  if (!isTerminal) {
    const currentIndex = STATUS_ORDER.indexOf(status);
    const remaining = STATUS_ORDER.slice(currentIndex + 1);
    for (const pendingStatus of remaining) {
      nodes.push({ kind: "pending", status: pendingStatus });
    }
  }

  return nodes;
}

export function TrackingTimeline({ shipment }: { shipment: Shipment }) {
  const nodes = buildNodes(shipment);

  return (
    <ol className="relative flex flex-col gap-8" aria-label="Shipment tracking history">
      {nodes.map((node, index) => {
        const isLast = index === nodes.length - 1;
        const label =
          node.kind === "pending" ? STATUS_LABELS[node.status] : STATUS_LABELS[node.event.status];

        return (
          <li key={index} className="relative flex gap-4 pl-1">
            {!isLast && (
              <span
                className="route-line absolute left-[15px] top-8 bottom-[-32px] w-0.5"
                aria-hidden="true"
              />
            )}

            <span
              className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
                node.kind === "completed"
                  ? "border-cargo bg-cargo text-white"
                  : node.kind === "current"
                    ? "border-signal bg-signal-tint text-signal"
                    : "border-dashed border-hairline bg-surface text-slate-light"
              }`}
              aria-hidden="true"
            >
              {node.kind === "completed" ? (
                <Check size={16} strokeWidth={2.5} />
              ) : node.kind === "current" ? (
                <span className="h-2.5 w-2.5 rounded-full bg-signal animate-pulse" />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-hairline" />
              )}
            </span>

            <div className="flex-1 pb-1">
              <p
                className={`font-display text-sm font-semibold ${
                  node.kind === "pending" ? "text-slate-light" : "text-ink"
                }`}
              >
                {label}
                {node.kind === "current" && (
                  <span className="ml-2 rounded-full bg-signal-tint px-2 py-0.5 font-data text-[10px] font-semibold uppercase tracking-[0.1em] text-signal">
                    Current
                  </span>
                )}
              </p>

              {node.kind === "pending" ? (
                <p className="mt-1 font-data text-xs uppercase tracking-[0.08em] text-slate-light">
                  Pending
                </p>
              ) : (
                <div className="mt-1 space-y-0.5">
                  <p className="text-sm text-slate">{node.event.location}</p>
                  <p className="font-data text-xs text-slate-light">
                    {formatDate(node.event.timestamp)}, {formatTime(node.event.timestamp)}
                  </p>
                  {node.event.note && (
                    <p className="text-sm italic text-slate">{node.event.note}</p>
                  )}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
