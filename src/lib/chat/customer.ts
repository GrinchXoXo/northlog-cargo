import { createClient } from "@/lib/supabase/server";
import type { PublicConversation } from "@/types/chat";

export type ChatResult =
  | { ok: true; conversation: PublicConversation }
  | { ok: false; error: string };

/**
 * Gets or creates the conversation for a shipment. Same trust model as
 * public tracking: knowing the tracking ID is what grants access, no
 * separate customer account or session needed. Returns ok:false with
 * a not-found-style message if the tracking ID doesn't match a real
 * shipment - never reveals which ID is real vs simply mistyped.
 */
export async function getOrCreateShipmentConversation(trackingId: string): Promise<ChatResult> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_or_create_shipment_conversation", {
    p_tracking_id: trackingId.trim(),
  });

  if (error) {
    console.error("get_or_create_shipment_conversation failed:", error.message);
    return { ok: false, error: "We couldn't start a conversation right now. Please try again." };
  }
  if (!data) {
    return { ok: false, error: "We couldn't find a shipment with that tracking ID." };
  }

  return { ok: true, conversation: data as PublicConversation };
}

/**
 * Gets or creates a general (no tracking ID) support conversation.
 * Pass the ID previously returned by this same function (stored
 * client-side) to resume an existing one; omit it to start fresh.
 */
export async function getOrCreateGeneralConversation(
  existingConversationId?: string
): Promise<ChatResult> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_or_create_general_conversation", {
    p_conversation_id: existingConversationId ?? null,
  });

  if (error || !data) {
    console.error("get_or_create_general_conversation failed:", error?.message);
    return { ok: false, error: "We couldn't start a conversation right now. Please try again." };
  }

  return { ok: true, conversation: data as PublicConversation };
}

export async function sendCustomerMessage(
  conversationId: string,
  body: string
): Promise<ChatResult> {
  const trimmed = body.trim();
  if (!trimmed) {
    return { ok: false, error: "Message cannot be empty." };
  }
  if (trimmed.length > 4000) {
    return { ok: false, error: "Message is too long." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("send_customer_message", {
    p_conversation_id: conversationId,
    p_body: trimmed,
  });

  if (error || !data) {
    console.error("send_customer_message failed:", error?.message);
    return { ok: false, error: "Message failed to send. Please try again." };
  }

  return { ok: true, conversation: data as PublicConversation };
}
