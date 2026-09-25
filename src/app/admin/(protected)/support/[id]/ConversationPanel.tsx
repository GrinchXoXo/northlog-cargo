"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import type { AdminConversationDetail } from "@/lib/chat/admin";
import {
  sendAdminMessageAction,
  closeConversationAction,
  reopenConversationAction,
  archiveConversationAction,
  deleteConversationAction,
} from "../actions";

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ConversationPanel({
  conversation,
  readOnly = false,
}: {
  conversation: AdminConversationDetail;
  /** Platform-owner inspection mode: messages visible, no reply composer, no lifecycle actions. */
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || sending) return;
    setSending(true);
    setError(null);
    const result = await sendAdminMessageAction(conversation.id, body.trim());
    setSending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setBody("");
    router.refresh();
  }

  async function runLifecycleAction(action: (id: string) => Promise<{ ok: boolean; error?: string }>) {
    setBusy(true);
    setError(null);
    const result = await action(conversation.id);
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? "Action failed.");
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">
            {conversation.trackingId ?? "General Support"}
          </h1>
          <p className="mt-1 text-xs text-slate">Status: {conversation.status}</p>
        </div>

        {!readOnly && (
        <div className="flex flex-wrap gap-2">
          {conversation.status === "OPEN" && (
            <button
              onClick={() => runLifecycleAction(closeConversationAction)}
              disabled={busy}
              className="rounded-[var(--radius-sm)] border border-hairline px-3 py-2 text-sm font-medium text-ink hover:bg-surface-sunken disabled:opacity-50"
            >
              Close
            </button>
          )}
          {conversation.status === "CLOSED" && (
            <button
              onClick={() => runLifecycleAction(reopenConversationAction)}
              disabled={busy}
              className="rounded-[var(--radius-sm)] border border-hairline px-3 py-2 text-sm font-medium text-ink hover:bg-surface-sunken disabled:opacity-50"
            >
              Reopen
            </button>
          )}
          {conversation.status !== "ARCHIVED" && (
            <button
              onClick={() => runLifecycleAction(archiveConversationAction)}
              disabled={busy}
              className="rounded-[var(--radius-sm)] border border-hairline px-3 py-2 text-sm font-medium text-ink hover:bg-surface-sunken disabled:opacity-50"
            >
              Archive
            </button>
          )}
          <button
            onClick={() => {
              if (confirm("Delete this conversation? This cannot be undone from the dashboard.")) {
                runLifecycleAction(deleteConversationAction).then(() => router.push("/admin/support"));
              }
            }}
            disabled={busy}
            className="rounded-[var(--radius-sm)] border border-danger px-3 py-2 text-sm font-medium text-danger hover:bg-danger-tint disabled:opacity-50"
          >
            Delete
          </button>
        </div>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3 rounded-[var(--radius-lg)] border border-hairline bg-surface p-4">
        {conversation.messages.length === 0 && (
          <p className="text-sm text-slate">No messages yet.</p>
        )}
        {conversation.messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-[80%] rounded-[var(--radius-md)] px-3 py-2 text-sm ${
              message.senderType === "ADMIN"
                ? "self-end bg-cargo text-white"
                : "self-start bg-surface-sunken text-ink"
            }`}
          >
            <p className="whitespace-pre-wrap">{message.body}</p>
            <p
              className={`mt-1 font-data text-[10px] ${
                message.senderType === "ADMIN" ? "text-white/70" : "text-slate-light"
              }`}
            >
              {formatTime(message.createdAt)}
            </p>
          </div>
        ))}
      </div>

      {!readOnly && conversation.status !== "ARCHIVED" && (
        <form onSubmit={handleSend} className="mt-4 flex gap-2">
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Type a response…"
            className="w-full rounded-[var(--radius-sm)] border border-hairline bg-surface px-4 py-2.5 text-sm text-ink focus:border-cargo"
          />
          <button
            type="submit"
            disabled={sending || !body.trim()}
            className="flex items-center justify-center rounded-[var(--radius-sm)] bg-signal px-4 py-2.5 text-white hover:bg-signal-hover disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </form>
      )}

      {readOnly && (
        <p className="mt-4 text-xs text-slate-light">
          Read-only platform view — replies and status changes are made by this
          organization&apos;s administrators.
        </p>
      )}

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
    </div>
  );
}
