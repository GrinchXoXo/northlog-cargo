import { createClient } from "@/lib/supabase/server";
import type { AdminConversationSummary, ChatMessage, ConversationStatus } from "@/types/chat";

export async function listConversations(
  statusFilter?: ConversationStatus
): Promise<{ conversations: AdminConversationSummary[]; error?: string }> {
  const supabase = await createClient();

  let query = supabase
    .from("conversations")
    .select("id, tracking_id, type, status, last_message_at, last_message_preview, created_at")
    .is("deleted_at", null)
    .order("last_message_at", { ascending: false })
    .limit(200);

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  } else {
    // Default view excludes archived, same as any normal inbox.
    query = query.neq("status", "ARCHIVED");
  }

  const { data, error } = await query;

  if (error) {
    console.error("listConversations failed:", error.message);
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

export interface AdminConversationDetail extends AdminConversationSummary {
  messages: ChatMessage[];
}

export async function getConversationForAdmin(
  conversationId: string
): Promise<{ conversation: AdminConversationDetail } | { error: string }> {
  const supabase = await createClient();

  const { data: convo, error: convoError } = await supabase
    .from("conversations")
    .select("id, tracking_id, type, status, last_message_at, last_message_preview, created_at")
    .eq("id", conversationId)
    .is("deleted_at", null)
    .maybeSingle();

  if (convoError || !convo) {
    return { error: "Conversation not found." };
  }

  const { data: messages, error: messagesError } = await supabase
    .from("messages")
    .select("id, sender_type, body, created_at")
    .eq("conversation_id", conversationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (messagesError) {
    console.error("getConversationForAdmin messages failed:", messagesError.message);
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

export async function sendAdminMessage(
  conversationId: string,
  body: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const trimmed = body.trim();
  if (!trimmed) return { ok: false, error: "Message cannot be empty." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("send_admin_message", {
    p_conversation_id: conversationId,
    p_body: trimmed,
  });

  if (error) {
    console.error("send_admin_message failed:", error.message);
    return { ok: false, error: "Could not send message." };
  }
  return { ok: true };
}

async function callVoidRpc(fn: string, conversationId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc(fn, { p_conversation_id: conversationId });
  if (error) {
    console.error(`${fn} failed:`, error.message);
    return { ok: false as const, error: "Action failed. Please try again." };
  }
  return { ok: true as const };
}

export const closeConversation = (id: string) => callVoidRpc("close_conversation", id);
export const reopenConversation = (id: string) => callVoidRpc("reopen_conversation", id);
export const archiveConversation = (id: string) => callVoidRpc("archive_conversation", id);
export const deleteConversation = (id: string) => callVoidRpc("delete_conversation", id);
