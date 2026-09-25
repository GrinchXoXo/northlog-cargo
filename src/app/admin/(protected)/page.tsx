import type { Metadata } from "next";
import { isPlatformOwner } from "@/lib/platform/isPlatformOwner";
import { getDashboardCounts } from "@/lib/shipments/getDashboardCounts";
import { DashboardView } from "@/components/admin/DashboardView";
import { PlatformDashboard } from "@/components/admin/PlatformDashboard";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  robots: { index: false, follow: false },
};

export default async function AdminDashboardPage() {
  // The platform operator's `/admin` is the platform control center
  // (Part A); every other signed-in user keeps the existing
  // organization dashboard below, untouched (Part B).
  if (await isPlatformOwner()) {
    return <PlatformDashboard />;
  }

  const counts = await getDashboardCounts();

  return (
    <DashboardView
      counts={counts}
      shipmentsHref="/admin/shipments"
      createShipmentHref="/admin/shipments/new"
    />
  );
}
