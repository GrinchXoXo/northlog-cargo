"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { generateTelegramLinkAction, disconnectTelegramAction } from "./actions";

export function ConnectTelegramCard({
  initialConnection,
}: {
  initialConnection: { username: string | null; linkedAt: string } | null;
}) {
  const [connection, setConnection] = useState(initialConnection);
  const [deepLink, setDeepLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleConnect() {
    setError(null);
    setLoading(true);
    const result = await generateTelegramLinkAction();
    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    setDeepLink(result.deepLink);
  }

  async function handleDisconnect() {
    setError(null);
    setLoading(true);
    const result = await disconnectTelegramAction();
    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    setConnection(null);
    setDeepLink(null);
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-hairline bg-surface p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] bg-cargo-tint text-cargo">
          <Send size={16} strokeWidth={2.25} />
        </span>
        <h2 className="font-display text-lg font-semibold text-ink">Telegram</h2>
      </div>

      {connection ? (
        <div className="mt-4">
          <p className="text-sm text-slate">
            Connected as{" "}
            <span className="text-ink">{connection.username ? `@${connection.username}` : "Telegram user"}</span>
          </p>
          <p className="mt-1 text-xs text-slate-light">
            Connected {new Date(connection.linkedAt).toLocaleDateString()}
          </p>
          <button
            type="button"
            onClick={handleDisconnect}
            disabled={loading}
            className="mt-4 inline-flex items-center justify-center rounded-[var(--radius-sm)] border border-hairline px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-surface-sunken disabled:opacity-50"
          >
            {loading ? "Disconnecting…" : "Disconnect Telegram"}
          </button>
        </div>
      ) : (
        <div className="mt-4">
          <p className="text-sm text-slate">
            Connect Telegram to manage shipments from your phone.
          </p>

          {deepLink ? (
            <div className="mt-4 rounded-[var(--radius-sm)] border border-hairline bg-surface-sunken p-4">
              <p className="text-sm text-ink">
                Tap the link below to open Telegram and confirm the connection. It expires in 10
                minutes.
              </p>
              <a
                href={deepLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center justify-center rounded-[var(--radius-sm)] bg-cargo px-5 py-2.5 text-sm font-medium text-white hover:bg-cargo-hover"
              >
                Open Telegram
              </a>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleConnect}
              disabled={loading}
              className="mt-4 inline-flex items-center justify-center rounded-[var(--radius-sm)] bg-cargo px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-cargo-hover disabled:opacity-50"
            >
              {loading ? "Generating link…" : "Connect Telegram"}
            </button>
          )}
        </div>
      )}

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
    </div>
  );
}
