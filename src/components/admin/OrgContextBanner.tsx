import Link from "next/link";
import { ArrowLeft, Eye } from "lucide-react";
import type { OrgContext } from "@/lib/platform/orgContext";

/**
 * Persistent organization-context indicator shown while the platform
 * owner is inside an organization's operational view:
 * "Platform Owner / <Organization>" plus an exit link. Rendered by the
 * organization-context layout, so it stays visible on every page of
 * that context.
 */
export function OrgContextBanner({ org }: { org: OrgContext }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-cargo bg-cargo-tint px-4 py-3">
      <div className="flex min-w-0 items-center gap-2 text-sm">
        <Link
          href="/admin/organizations"
          className="inline-flex items-center gap-1 font-medium text-cargo hover:text-cargo-hover"
        >
          <ArrowLeft size={14} strokeWidth={2} />
          Organizations
        </Link>
        <span className="text-slate-light" aria-hidden="true">
          /
        </span>
        <span className="font-medium text-ink">Platform Owner</span>
        <span className="text-slate-light" aria-hidden="true">
          /
        </span>
        <span className="truncate font-medium text-ink">{org.name}</span>
      </div>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1 font-data text-[10px] uppercase tracking-[0.1em] text-cargo">
        <Eye size={11} strokeWidth={2} />
        Read-only inspection
      </span>
    </div>
  );
}
