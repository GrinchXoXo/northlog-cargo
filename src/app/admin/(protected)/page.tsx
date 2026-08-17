import type { Metadata } from "next";
import Link from "next/link";
import { Package, Truck, FileWarning, Send, CheckCircle2, AlertTriangle } from "lucide-react";
import { getDashboardCounts } from "@/lib/shipments/getDashboardCounts";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  robots: { index: false, follow: false },
};

export default async function AdminDashboardPage() {
  const counts = await getDashboardCounts();

  const cards = [
    { label: "Total Shipments", value: counts.total, icon: Package },
    { label: "In Transit", value: counts.inTransit, icon: Truck },
    { label: "Awaiting Customs", value: counts.awaitingCustoms, icon: FileWarning },
    { label: "Out for Delivery", value: counts.outForDelivery, icon: Send },
    { label: "Delivered", value: counts.delivered, icon: CheckCircle2 },
    { label: "Exceptions", value: counts.exceptions, icon: AlertTriangle },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-ink">Dashboard</h1>
        <Link
          href="/admin/shipments/new"
          className="inline-flex items-center justify-center rounded-[var(--radius-sm)] bg-signal px-4 py-2.5 text-sm font-medium text-white hover:bg-signal-hover"
        >
          Create Shipment
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
            </div>
          );
        })}
      </div>

      <div className="mt-8">
        <Link href="/admin/shipments" className="text-sm font-medium text-cargo hover:text-cargo-hover">
          View all shipments &rarr;
        </Link>
      </div>
    </div>
  );
}
