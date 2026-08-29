export type ConversationStatus = "OPEN" | "CLOSED" | "ARCHIVED";
export type ConversationType = "SHIPMENT" | "GENERAL";
export type MessageSenderType = "CUSTOMER" | "ADMIN";

export interface ChatMessage {
  id: string;
  senderType: MessageSenderType;
  body: string;
  createdAt: string;
}

/** Shape returned by get_conversation_json() - what the customer widget sees. */
export interface PublicConversation {
  id: string;
  trackingId: string | null;
  type: ConversationType;
  status: ConversationStatus;
  messages: ChatMessage[];
}

/** Row shape for the admin inbox list. */
export interface AdminConversationSummary {
  id: string;
  trackingId: string | null;
  type: ConversationType;
  status: ConversationStatus;
  lastMessageAt: string;
  lastMessagePreview: string | null;
  createdAt: string;
}
