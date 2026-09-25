import Link from "next/link";
import type { AdminConversationSummary } from "@/types/chat";

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_STYLES: Record<string, string> = {
  OPEN: "bg-signal-tint text-signal",
  CLOSED: "bg-surface-sunken text-slate",
  ARCHIVED: "bg-surface-sunken text-slate-light",
};

/**
 * The support inbox body, shared by the organization admin's
 * `/admin/support` page and the platform owner's organization-context
 * view. `basePath` drives the per-row links.
 */
export function SupportListView({
  conversations,
  error,
  basePath,
}: {
  conversations: AdminConversationSummary[];
  error?: string;
  basePath: string;
}) {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Support</h1>

      {error && <p className="mt-6 text-sm text-danger">{error}</p>}

      {!error && conversations.length === 0 && (
        <p className="mt-10 text-sm text-slate">No conversations yet.</p>
      )}

      {!error && conversations.length > 0 && (
        <div className="mt-6 flex flex-col gap-2">
          {conversations.map((c) => (
            <Link
              key={c.id}
              href={`${basePath}/${c.id}`}
              className="flex flex-col gap-2 rounded-[var(--radius-lg)] border border-hairline bg-surface p-4 hover:border-cargo sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-data text-sm font-medium text-ink">
                    {c.trackingId ?? "General Support"}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 font-data text-[10px] font-semibold uppercase tracking-[0.08em] ${STATUS_STYLES[c.status]}`}
                  >
                    {c.status}
                  </span>
                </div>
                {c.lastMessagePreview && (
                  <p className="mt-1 truncate text-sm text-slate">{c.lastMessagePreview}</p>
                )}
              </div>
              <span className="shrink-0 font-data text-xs text-slate-light">
                {formatTime(c.lastMessageAt)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
