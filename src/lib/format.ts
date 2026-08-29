/** Formats an ISO timestamp as "Aug 06, 2026". */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

/** Formats an ISO timestamp as "09:42". */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** Formats a relative "18 minutes ago" style string against now. */
export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const then = new Date(iso).getTime();
  const diffMs = now.getTime() - then;
  const diffMinutes = Math.round(diffMs / 60000);

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}

/** Formats an estimated delivery range as "August 14–16, 2026" or a single date. */
export function formatDeliveryRange(from: string, to: string): string {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const monthFmt = new Intl.DateTimeFormat("en-US", { month: "long" });

  if (from === to) {
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(fromDate);
  }

  const sameMonth = fromDate.getMonth() === toDate.getMonth() && fromDate.getFullYear() === toDate.getFullYear();

  if (sameMonth) {
    return `${monthFmt.format(fromDate)} ${fromDate.getDate()}\u2013${toDate.getDate()}, ${fromDate.getFullYear()}`;
  }

  const fromFmt = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric" }).format(fromDate);
  const toFmt = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(toDate);
  return `${fromFmt} \u2013 ${toFmt}`;
}
