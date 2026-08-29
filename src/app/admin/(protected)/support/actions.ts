"use server";

import { revalidatePath } from "next/cache";
import {
  sendAdminMessage,
  closeConversation,
  reopenConversation,
  archiveConversation,
  deleteConversation,
} from "@/lib/chat/admin";

export async function sendAdminMessageAction(conversationId: string, body: string) {
  const result = await sendAdminMessage(conversationId, body);
  revalidatePath(`/admin/support/${conversationId}`);
  return result;
}

export async function closeConversationAction(conversationId: string) {
  const result = await closeConversation(conversationId);
  revalidatePath(`/admin/support/${conversationId}`);
  revalidatePath("/admin/support");
  return result;
}

export async function reopenConversationAction(conversationId: string) {
  const result = await reopenConversation(conversationId);
  revalidatePath(`/admin/support/${conversationId}`);
  revalidatePath("/admin/support");
  return result;
}

export async function archiveConversationAction(conversationId: string) {
  const result = await archiveConversation(conversationId);
  revalidatePath("/admin/support");
  return result;
}

export async function deleteConversationAction(conversationId: string) {
  const result = await deleteConversation(conversationId);
  revalidatePath("/admin/support");
  return result;
}
