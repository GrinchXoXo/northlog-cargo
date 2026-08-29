"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import {
  startShipmentChatAction,
  startGeneralChatAction,
  sendChatMessageAction,
} from "@/app/(site)/chat/actions";
import { CHAT_OPEN_EVENT, type ChatOpenDetail } from "@/lib/chat/openChatEvent";
import type { PublicConversation } from "@/types/chat";

const GENERAL_CONVERSATION_STORAGE_KEY = "northlog_chat_conversation_id";
const POLL_INTERVAL_MS = 5000;

type WidgetState =
  | { phase: "closed" }
  | { phase: "prompt" }
  | { phase: "loading" }
  | { phase: "chatting"; conversation: PublicConversation }
  | { phase: "error"; message: string };

export function ChatWidget() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [state, setState] = useState<WidgetState>({ phase: "closed" });
  const [trackingIdInput, setTrackingIdInput] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [sending, setSending] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Admin routes get their own chat inbox; the customer widget has no
  // business appearing there.
  const hideOnAdmin = pathname?.startsWith("/admin");

  async function openWithShipment(trackingId: string) {
    setState({ phase: "loading" });
    const result = await startShipmentChatAction(trackingId);
    if (!result.ok) {
      setState({ phase: "error", message: result.error });
      return;
    }
    setState({ phase: "chatting", conversation: result.conversation });
  }

  async function openWithGeneral() {
    setState({ phase: "loading" });
    const existingId = localStorage.getItem(GENERAL_CONVERSATION_STORAGE_KEY) ?? undefined;
    const result = await startGeneralChatAction(existingId);
    if (!result.ok) {
      setState({ phase: "error", message: result.error });
      return;
    }
    localStorage.setItem(GENERAL_CONVERSATION_STORAGE_KEY, result.conversation.id);
    setState({ phase: "chatting", conversation: result.conversation });
  }

  // Listen for other components (ContactSupport buttons) asking us to open,
  // optionally scoped to a specific shipment.
  useEffect(() => {
    function handleOpenEvent(e: Event) {
      const detail = (e as CustomEvent<ChatOpenDetail>).detail;
      if (detail?.trackingId) {
        openWithShipment(detail.trackingId);
      } else {
        setState({ phase: "prompt" });
      }
    }
    window.addEventListener(CHAT_OPEN_EVENT, handleOpenEvent);
    return () => window.removeEventListener(CHAT_OPEN_EVENT, handleOpenEvent);
  }, []);

  // Poll for new messages while a conversation is open.
  useEffect(() => {
    if (state.phase !== "chatting") {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }

    pollRef.current = setInterval(async () => {
      const conversation = state.conversation;
      const result = conversation.trackingId
        ? await startShipmentChatAction(conversation.trackingId)
        : await startGeneralChatAction(conversation.id);

      if (result.ok) {
        setState((prev) =>
          prev.phase === "chatting" ? { phase: "chatting", conversation: result.conversation } : prev
        );
      }
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase === "chatting" ? state.conversation.id : null]);

  function handleFabClick() {
    if (state.phase !== "closed") {
      setState({ phase: "closed" });
      return;
    }

    // On the tracking page with a resolved shipment, jump straight into
    // that shipment's conversation instead of asking again.
    if (pathname === "/tracking") {
      const id = searchParams.get("id");
      if (id) {
        openWithShipment(id);
        return;
      }
    }
    setState({ phase: "prompt" });
  }

  async function handleTrackingIdSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!trackingIdInput.trim()) return;
    await openWithShipment(trackingIdInput.trim());
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (state.phase !== "chatting" || !messageInput.trim() || sending) return;

    setSending(true);
    const result = await sendChatMessageAction(state.conversation.id, messageInput.trim());
    setSending(false);

    if (result.ok) {
      setMessageInput("");
      setState({ phase: "chatting", conversation: result.conversation });
    }
  }

  if (hideOnAdmin) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {state.phase !== "closed" && (
        <div className="flex h-[28rem] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-[var(--radius-lg)] border border-hairline bg-surface shadow-lg">
          <div className="flex items-center justify-between border-b border-hairline bg-cargo px-4 py-3 text-white">
            <p className="font-display text-sm font-semibold">Northlog Support</p>
            <button
              type="button"
              onClick={() => setState({ phase: "closed" })}
              aria-label="Close chat"
              className="rounded-full p-1 hover:bg-white/10"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {state.phase === "loading" && (
              <div className="flex h-full items-center justify-center text-slate">
                <Loader2 size={20} className="animate-spin" />
              </div>
            )}

            {state.phase === "prompt" && (
              <div className="flex h-full flex-col justify-center gap-4">
                <p className="text-center text-sm text-ink">How can we help?</p>
                <form onSubmit={handleTrackingIdSubmit} className="flex flex-col gap-2">
                  <label htmlFor="chat-tracking-id" className="text-xs text-slate">
                    Have a tracking ID? Enter it to continue.
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="chat-tracking-id"
                      value={trackingIdInput}
                      onChange={(e) => setTrackingIdInput(e.target.value)}
                      placeholder="e.g. NMX-842731"
                      className="w-full rounded-[var(--radius-sm)] border border-hairline bg-surface px-3 py-2 font-data text-sm text-ink focus:border-cargo"
                    />
                    <button
                      type="submit"
                      className="rounded-[var(--radius-sm)] bg-cargo px-3 py-2 text-sm font-medium text-white hover:bg-cargo-hover"
                    >
                      Go
                    </button>
                  </div>
                </form>
                <div className="flex items-center gap-2 text-xs text-slate-light">
                  <span className="h-px flex-1 bg-hairline" />
                  or
                  <span className="h-px flex-1 bg-hairline" />
                </div>
                <button
                  type="button"
                  onClick={openWithGeneral}
                  className="rounded-[var(--radius-sm)] border border-hairline px-3 py-2 text-sm font-medium text-ink hover:bg-surface-sunken"
                >
                  Continue without a tracking ID
                </button>
              </div>
            )}

            {state.phase === "error" && (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <p className="text-sm text-ink">{state.message}</p>
                <button
                  type="button"
                  onClick={() => setState({ phase: "prompt" })}
                  className="text-sm font-medium text-cargo hover:text-cargo-hover"
                >
                  Try again
                </button>
              </div>
            )}

            {state.phase === "chatting" && (
              <div className="flex flex-col gap-3">
                {state.conversation.trackingId && (
                  <p className="font-data text-xs text-slate-light">
                    Shipment: {state.conversation.trackingId}
                  </p>
                )}
                {state.conversation.messages.length === 0 && (
                  <p className="text-sm text-slate">
                    Send a message and our team will get back to you.
                  </p>
                )}
                {state.conversation.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`max-w-[85%] rounded-[var(--radius-md)] px-3 py-2 text-sm ${
                      message.senderType === "CUSTOMER"
                        ? "self-end bg-cargo text-white"
                        : "self-start bg-surface-sunken text-ink"
                    }`}
                  >
                    {message.body}
                  </div>
                ))}
              </div>
            )}
          </div>

          {state.phase === "chatting" && (
            <form onSubmit={handleSendMessage} className="flex gap-2 border-t border-hairline p-3">
              <input
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Type a message…"
                className="w-full rounded-[var(--radius-sm)] border border-hairline bg-surface px-3 py-2 text-sm text-ink focus:border-cargo"
              />
              <button
                type="submit"
                disabled={sending || !messageInput.trim()}
                aria-label="Send message"
                className="flex items-center justify-center rounded-[var(--radius-sm)] bg-signal px-3 py-2 text-white hover:bg-signal-hover disabled:opacity-50"
              >
                <Send size={16} />
              </button>
            </form>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={handleFabClick}
        aria-label={state.phase === "closed" ? "Open support chat" : "Close support chat"}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-signal text-white shadow-lg transition-transform hover:scale-105"
      >
        {state.phase === "closed" ? <MessageCircle size={24} /> : <X size={24} />}
      </button>
    </div>
  );
}
