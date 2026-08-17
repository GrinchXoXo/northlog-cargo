import { createClient } from "@/lib/supabase/server";
import { mapShipmentRow, type RawShipmentRow } from "./mapRows";
import type { AdminShipment } from "@/types/shipment";

export interface ListShipmentsResult {
  shipments: AdminShipment[];
  error: string | null;
}

/**
 * Lists shipments for the admin dashboard, optionally filtered by a
 * search term matched case-insensitively against tracking ID or sender
 * name (PRD section 9). Requires an authenticated session: RLS enforces
 * this regardless, but we check up front for a clearer result.
 */
export async function listShipments(search?: string): Promise<ListShipmentsResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { shipments: [], error: "Authentication required." };
  }

  let query = supabase
    .from("shipments")
    .select("*")
    .order("updated_at", { ascending: false });

  const term = search?.trim();
  if (term) {
    query = query.or(`tracking_id.ilike.%${term}%,sender_name.ilike.%${term}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("listShipments failed:", error.message);
    return { shipments: [], error: "Could not load shipments." };
  }

  return {
    shipments: (data as RawShipmentRow[]).map(mapShipmentRow),
    error: null,
  };
}
