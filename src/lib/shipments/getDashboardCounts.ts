import { createClient } from "@/lib/supabase/server";
import type { DashboardCounts } from "@/types/shipment";

const EMPTY_COUNTS: DashboardCounts = {
  total: 0,
  inTransit: 0,
  awaitingCustoms: 0,
  outForDelivery: 0,
  delivered: 0,
  exceptions: 0,
};

/**
 * Operational counts for the dashboard overview (PRD section 7). These
 * are simple counts, not analytics: intentionally not more than this.
 */
export async function getDashboardCounts(): Promise<DashboardCounts> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return EMPTY_COUNTS;
  }

  const countFor = async (status?: string) => {
    let query = supabase.from("shipments").select("id", { count: "exact", head: true });
    if (status) query = query.eq("current_status", status);
    const { count, error } = await query;
    if (error) {
      console.error("getDashboardCounts failed:", error.message);
      return 0;
    }
    return count ?? 0;
  };

  const [total, inTransit, awaitingCustoms, outForDelivery, delivered, exceptions] = await Promise.all([
    countFor(),
    countFor("IN_TRANSIT"),
    countFor("CUSTOMS_CLEARANCE"),
    countFor("OUT_FOR_DELIVERY"),
    countFor("DELIVERED"),
    countFor("EXCEPTION"),
  ]);

  return { total, inTransit, awaitingCustoms, outForDelivery, delivered, exceptions };
}
