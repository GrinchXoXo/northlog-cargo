import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Optional context for shipment data-access functions that need to run
 * outside a browser session: currently only the Telegram bot webhook.
 *
 * When omitted, functions fall back to their original Phase 2/3
 * behavior: a cookie-authenticated server client, with the shipment's
 * created_by/history attributed to auth.uid().
 *
 * When provided (bot path), the caller has already verified the
 * Telegram user maps to an active, authorized admin: client is a
 * service-role client (no session of its own) and actorId is that
 * admin's user ID, passed through to the RPCs explicitly.
 */
export interface ShipmentActionContext {
  client: SupabaseClient;
  actorId: string;
}
