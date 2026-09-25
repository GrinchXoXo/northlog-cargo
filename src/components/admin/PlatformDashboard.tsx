import Link from "next/link";
import { Building2, Package, Layers } from "lucide-react";
import { getPlatformOverview } from "@/lib/platform/overview";

function formatUpdated(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * The platform owner's `/admin` body: platform-level totals and two
 * short recents lists. Deliberately minimal — totals and recents, not
 * analytics or reporting. Organization admins never render this
 * component; their `/admin` keeps the operational dashboard.
 */
export async function PlatformDashboard() {
  const overview = await getPlatformOverview();

  const cards = [
    { label: "Total Organizations", value: overview.totalOrganizations, icon: Building2 },
    { label: "Active Organizations", value: overview.activeOrganizations, icon: Layers, hint: "with at least one shipment" },
    { label: "Total Shipments", value: overview.totalShipments, icon: Package },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Platform Dashboard</h1>
          <p className="mt-1 text-sm text-slate">
            Northlog platform overview across every organization.
          </p>
        </div>
        <Link
          href="/admin/organizations"
          className="inline-flex items-center justify-center rounded-[var(--radius-sm)] bg-signal px-4 py-2.5 text-sm font-medium text-white hover:bg-signal-hover"
        >
          Manage Organizations
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-[var(--radius-lg)] border border-hairline bg-surface p-6">
              <div className="flex items-center justify-between">
                <p className="font-data text-xs uppercase tracking-[0.1em] text-slate-light">
                  {card.label}
                </p>
                <Icon size={16} className="text-slate-light" strokeWidth={2} />
              </div>
              <p className="mt-3 font-display text-3xl font-semibold text-ink">{card.value}</p>
              {card.hint && <p className="mt-1 text-xs text-slate-light">{card.hint}</p>}
            </div>
          );
        })}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-[var(--radius-lg)] border border-hairline bg-surface">
          <div className="border-b border-hairline px-5 py-4">
            <h2 className="font-display text-base font-semibold text-ink">
              Recently created organizations
            </h2>
          </div>
          {overview.recentOrganizations.length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate">No organizations yet.</p>
          ) : (
            <ul className="divide-y divide-hairline">
              {overview.recentOrganizations.map((org) => (
                <li key={org.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{org.name}</p>
                    <p className="font-data text-xs text-slate">{org.slug}</p>
                  </div>
                  <Link
                    href={`/admin/organizations/${org.id}`}
                    className="shrink-0 text-sm font-medium text-cargo hover:text-cargo-hover"
                  >
                    Open &rarr;
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-[var(--radius-lg)] border border-hairline bg-surface">
          <div className="border-b border-hairline px-5 py-4">
            <h2 className="font-display text-base font-semibold text-ink">
              Recent organization activity
            </h2>
          </div>
          {overview.recentShipments.length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate">No shipment activity yet.</p>
          ) : (
            <ul className="divide-y divide-hairline">
              {overview.recentShipments.map((shipment) => (
                <li key={shipment.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate font-data text-sm font-medium text-cargo">
                      {shipment.trackingId}
                    </p>
                    <p className="truncate text-xs text-slate">
                      {shipment.organizationName} &middot;{" "}
                      {shipment.status.replaceAll("_", " ")}
                    </p>
                  </div>
                  <span className="shrink-0 font-data text-xs text-slate-light">
                    {formatUpdated(shipment.updatedAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
