"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2 } from "lucide-react";
import { startShipmentChatAction, startGeneralChatAction, sendChatMessageAction } from "@/app/(site)/chat/actions";
import { openChat } from "@/lib/chat/openChatEvent";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const trackingId = String(formData.get("trackingId") ?? "").trim();
    const message = String(formData.get("message") ?? "").trim();

    const fullMessage = `From: ${name} (${email})\n\n${message}`;

    const conversationResult = trackingId
      ? await startShipmentChatAction(trackingId)
      : await startGeneralChatAction();

    if (!conversationResult.ok) {
      setLoading(false);
      setError(conversationResult.error);
      return;
    }

    const sendResult = await sendChatMessageAction(conversationResult.conversation.id, fullMessage);
    setLoading(false);

    if (!sendResult.ok) {
      setError(sendResult.error);
      return;
    }

    setSubmitted(true);
    // Open the widget so the customer sees their message land as a real
    // conversation they can continue, rather than a message into a void.
    openChat(trackingId || undefined);
  }

  if (submitted) {
    return (
      <div className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-hairline bg-cargo-tint p-6 text-sm text-cargo">
        <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
        <p>
          Your message has been sent. We&apos;ve opened the chat so you can see the
          conversation and continue it any time.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-ink">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="w-full rounded-[var(--radius-sm)] border border-hairline bg-surface px-4 py-2.5 text-sm text-ink focus:border-cargo"
          />
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-[var(--radius-sm)] border border-hairline bg-surface px-4 py-2.5 text-sm text-ink focus:border-cargo"
          />
        </div>
      </div>

      <div>
        <label htmlFor="tracking-id-optional" className="mb-1.5 block text-sm font-medium text-ink">
          Tracking ID <span className="font-normal text-slate">(optional)</span>
        </label>
        <input
          id="tracking-id-optional"
          name="trackingId"
          type="text"
          placeholder="e.g. NMX-842731"
          className="w-full rounded-[var(--radius-sm)] border border-hairline bg-surface px-4 py-2.5 font-data text-sm text-ink placeholder:font-body focus:border-cargo"
        />
      </div>

      <div>
        <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-ink">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          className="w-full rounded-[var(--radius-sm)] border border-hairline bg-surface px-4 py-2.5 text-sm text-ink focus:border-cargo"
        />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center rounded-[var(--radius-sm)] bg-signal px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-signal-hover disabled:opacity-50"
      >
        {loading ? "Sending…" : "Send Message"}
      </button>
    </form>
  );
}
