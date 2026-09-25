import { isPlatformOwner } from "@/lib/platform/isPlatformOwner";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { mapShipmentRow, mapTrackingEventRow, type RawShipmentRow, type RawTrackingEventRow } from "@/lib/shipments/mapRows";
import type { AdminConversationDetail } from "@/lib/chat/admin";
import type { AdminConversationSummary } from "@/types/chat";
import type { AdminShipment, AdminTrackingEvent, DashboardCounts } from "@/types/shipment";

/**
 * Platform-owner organization inspection reads (Part C of the
 * organization-context scaffold).
 *
 * Why the service-role client: an organization's admin sees rows
 * through RLS because they are a member; the platform operator
 * deliberately is NOT a member of every organization (no impersonation,
 * no memberships granted behind their back), so the member-scoped
 * policies would — correctly — show them nothing. Rather than weaken
 * RLS or insert the operator into every tenant, these readers take the
 * explicit privileged path: the same service-role client provisioning
 * uses, but only after `is_platform_owner()` has succeeded inside this
 * request, and only ever with an `.eq("organization_id", orgId)` scope
 * that is resolved server-side from the route.
 *
 * Rules for this module (checked by review, enforced by the guard at
 * the top of every function):
 *
 *   1. Every function starts by re-verifying the platform owner from
 *      the caller's session (fail closed on any error).
 *   2. Every row read is scoped to the resolved organization id.
 *   3. Writes live here NEVER — this is a read-only inspection path.
 *      The organization admin's own actions (create shipment, status
 *      updates, support replies) keep using their session + RLS, and
 *      the platform operator's session has no write path into a tenant.
 *
 * RLS is untouched: it remains the final boundary for every
 * organization admin and for all browser traffic.
 */

const EMPTY_COUNTS: DashboardCounts = {
  total: 0,
  inTransit: 0,
  awaitingCustoms: 0,
  outForDelivery: 0,
  delivered: 0,
  exceptions: 0,
};

/** Fail-closed prelude: returns a scoped reader, or null when the caller is not the platform owner. */
async function ownerServiceClient(): Promise<ReturnType<typeof createServiceRoleClient> | null> {
  const ok = await isPlatformOwner();
  if (ok !== true) {
    return null;
  }
  try {
    return createServiceRoleClient();
  } catch (err) {
    console.error("orgData: service client unavailable:", err instanceof Error ? err.message : err);
    return null;
  }
}

export async function getOrgDashboardCounts(orgId: string): Promise<DashboardCounts> {
  const service = await ownerServiceClient();
  if (!service) return EMPTY_COUNTS;

  const countFor = async (status?: string) => {
    let query = service
      .from("shipments")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId);
    if (status) query = query.eq("current_status", status);
    const { count, error } = await query;
    if (error) {
      console.error("getOrgDashboardCounts failed:", error.message);
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

export interface ListOrgShipmentsResult {
  shipments: AdminShipment[];
  error: string | null;
}

export async function listOrgShipments(orgId: string, search?: string): Promise<ListOrgShipmentsResult> {
  const service = await ownerServiceClient();
  if (!service) return { shipments: [], error: "Could not load shipments." };

  let query = service
    .from("shipments")
    .select("*")
    .eq("organization_id", orgId)
    .order("updated_at", { ascending: false });

  const term = search?.trim();
  if (term) {
    query = query.or(`tracking_id.ilike.%${term}%,sender_name.ilike.%${term}%`);
  }

  const { data, error } = await query;
  if (error) {
    console.error("listOrgShipments failed:", error.message);
    return { shipments: [], error: "Could not load shipments." };
  }

  return { shipments: (data as RawShipmentRow[]).map(mapShipmentRow), error: null };
}

export type GetOrgShipmentResult =
  | { state: "success"; shipment: AdminShipment; events: AdminTrackingEvent[] }
  | { state: "not_found" }
  | { state: "unauthorized" }
  | { state: "error" };

export async function getOrgShipmentForAdmin(orgId: string, trackingId: string): Promise<GetOrgShipmentResult> {
  if (trackingId.trim().length === 0 || trackingId.length > 64) {
    return { state: "not_found" };
  }

  const service = await ownerServiceClient();
  if (!service) return { state: "unauthorized" };

  const { data: shipmentRow, error: shipmentError } = await service
    .from("shipments")
    .select("*")
    .eq("organization_id", orgId)
    .ilike("tracking_id", trackingId.trim())
    .maybeSingle();

  if (shipmentError) {
    console.error("getOrgShipmentForAdmin (shipment) failed:", shipmentError.message);
    return { state: "error" };
  }
  if (!shipmentRow) {
    return { state: "not_found" };
  }

  const { data: eventRows, error: eventsError } = await service
    .from("tracking_events")
    .select("*")
    .eq("shipment_id", (shipmentRow as RawShipmentRow).id)
    .order("created_at", { ascending: true });

  if (eventsError) {
    console.error("getOrgShipmentForAdmin (events) failed:", eventsError.message);
    return { state: "error" };
  }

  return {
    state: "success",
    shipment: mapShipmentRow(shipmentRow as RawShipmentRow),
    events: (eventRows as RawTrackingEventRow[]).map(mapTrackingEventRow),
  };
}

export async function listOrgConversations(
  orgId: string
): Promise<{ conversations: AdminConversationSummary[]; error?: string }> {
  const service = await ownerServiceClient();
  if (!service) return { conversations: [], error: "Could not load conversations." };

  let query = service
    .from("conversations")
    .select("id, tracking_id, type, status, last_message_at, last_message_preview, created_at")
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .order("last_message_at", { ascending: false })
    .limit(200);

  query = query.neq("status", "ARCHIVED");

  const { data, error } = await query;
  if (error) {
    console.error("listOrgConversations failed:", error.message);
    return { conversations: [], error: "Could not load conversations." };
  }

  return {
    conversations: (data ?? []).map((row) => ({
      id: row.id,
      trackingId: row.tracking_id,
      type: row.type,
      status: row.status,
      lastMessageAt: row.last_message_at,
      lastMessagePreview: row.last_message_preview,
      createdAt: row.created_at,
    })),
  };
}

export async function getOrgConversation(
  orgId: string,
  conversationId: string
): Promise<{ conversation: AdminConversationDetail } | { error: string }> {
  const service = await ownerServiceClient();
  if (!service) return { error: "Could not load conversation." };

  const { data: convo, error: convoError } = await service
    .from("conversations")
    .select("id, tracking_id, type, status, last_message_at, last_message_preview, created_at")
    .eq("id", conversationId)
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .maybeSingle();

  if (convoError || !convo) {
    return { error: "Conversation not found." };
  }

  const { data: messages, error: messagesError } = await service
    .from("messages")
    .select("id, sender_type, body, created_at")
    .eq("conversation_id", conversationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (messagesError) {
    console.error("getOrgConversation messages failed:", messagesError.message);
    return { error: "Could not load messages." };
  }

  return {
    conversation: {
      id: convo.id,
      trackingId: convo.tracking_id,
      type: convo.type,
      status: convo.status,
      lastMessageAt: convo.last_message_at,
      lastMessagePreview: convo.last_message_preview,
      createdAt: convo.created_at,
      messages: (messages ?? []).map((m) => ({
        id: m.id,
        senderType: m.sender_type,
        body: m.body,
        createdAt: m.created_at,
      })),
    },
  };
}
