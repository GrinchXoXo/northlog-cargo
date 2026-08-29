"use client";

import { MessageCircleQuestion } from "lucide-react";
import { openChat } from "@/lib/chat/openChatEvent";

export function ContactSupport({
  variant = "block",
  trackingId,
}: {
  variant?: "block" | "inline";
  trackingId?: string;
}) {
  const baseClasses =
    "inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] font-medium transition-colors";

  if (variant === "inline") {
    return (
      <button
        type="button"
        onClick={() => openChat(trackingId)}
        className={`${baseClasses} border border-hairline bg-transparent px-5 py-2.5 text-sm text-ink hover:bg-surface-sunken`}
      >
        <MessageCircleQuestion size={16} />
        Contact Support
      </button>
    );
  }

  return (
    <div className="flex flex-col items-start gap-3 rounded-[var(--radius-md)] border border-hairline bg-surface-sunken p-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-display text-base font-semibold text-ink">Need help with a shipment?</p>
        <p className="mt-1 text-sm text-slate">
          Our support team can look into a status, location, or delivery question.
        </p>
      </div>
      <button
        type="button"
        onClick={() => openChat(trackingId)}
        className={`${baseClasses} bg-cargo px-6 py-2.5 text-sm text-white hover:bg-cargo-hover`}
      >
        <MessageCircleQuestion size={16} />
        Contact Support
      </button>
    </div>
  );
}
