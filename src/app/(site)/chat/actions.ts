"use server";

import {
  getOrCreateShipmentConversation,
  getOrCreateGeneralConversation,
  sendCustomerMessage,
  type ChatResult,
} from "@/lib/chat/customer";

export async function startShipmentChatAction(trackingId: string): Promise<ChatResult> {
  return getOrCreateShipmentConversation(trackingId);
}

export async function startGeneralChatAction(existingConversationId?: string): Promise<ChatResult> {
  return getOrCreateGeneralConversation(existingConversationId);
}

export async function sendChatMessageAction(
  conversationId: string,
  body: string
): Promise<ChatResult> {
  return sendCustomerMessage(conversationId, body);
}
