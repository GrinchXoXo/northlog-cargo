export const CHAT_OPEN_EVENT = "northlog:open-chat";

export interface ChatOpenDetail {
  trackingId?: string;
}

/** Opens the chat widget, optionally pre-scoped to a shipment's conversation. */
export function openChat(trackingId?: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ChatOpenDetail>(CHAT_OPEN_EVENT, { detail: { trackingId } }));
}
