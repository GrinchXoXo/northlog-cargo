"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Phase = "verifying" | "choose-password" | "done" | "blocked";

/**
 * Landing page for Supabase Auth invitation links. The link arrives as
 * session tokens in the URL fragment; this exchanges them for a real
 * session, lets the admin choose their own password, and sends them to
 * the dashboard. No password ever exists before this moment.
 */
export function AcceptInviteForm() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("verifying");
  const [blockedReason, setBlockedReason] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function establishSession() {
      const supabase = createClient();
      const params = new URLSearchParams(window.location.hash.slice(1));
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");

      let sessionError: string | null = null;

      if (access_token && refresh_token) {
        const { error: exchangeError } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });
        sessionError = exchangeError?.message ?? null;
        if (!exchangeError) {
          // Consume the tokens from the address bar: they are now in
          // httpOnly-equivalent cookies and a refresh would fail.
          window.history.replaceState(null, "", window.location.pathname);
        }
      }

      if (cancelled) return;

      if (sessionError) {
        setBlockedReason(
          "This invitation link has expired or was already used. Ask the platform operator to send a new invitation."
        );
        setPhase("blocked");
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (cancelled) return;

      if (session) {
        setPhase("choose-password");
      } else {
        setBlockedReason(
          "This page only works when opened from an invitation link. Ask the platform operator to send a new invitation, or sign in at /admin if you already have an account."
        );
        setPhase("blocked");
      }
    }

    establishSession();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        setError(
          updateError.message.includes("same as the old")
            ? "Choose a password you have not used before."
            : "Could not save the password. Please try again."
        );
        return;
      }

      setPhase("done");
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (phase === "verifying") {
    return <p className="text-sm text-slate">Verifying invitation link…</p>;
  }

  if (phase === "blocked") {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-danger">{blockedReason}</p>
        <a
          href="/admin/login"
          className="inline-flex items-center justify-center rounded-[var(--radius-sm)] border border-hairline px-4 py-3 text-sm font-medium text-ink hover:bg-surface-sunken"
        >
          Go to sign in
        </a>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-slate">
          Password set — you are signed in. Welcome aboard.
        </p>
        <button
          type="button"
          onClick={() => {
            router.push("/admin");
            router.refresh();
          }}
          className="inline-flex items-center justify-center rounded-[var(--radius-sm)] bg-signal px-4 py-3 text-sm font-medium text-white hover:bg-signal-hover"
        >
          Go to dashboard
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label htmlFor="invitePassword" className="mb-1.5 block text-sm font-medium text-ink">
          New password
        </label>
        <input
          id="invitePassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-[var(--radius-sm)] border border-hairline bg-surface px-4 py-2.5 text-sm text-ink focus:border-cargo"
        />
      </div>

      <div>
        <label htmlFor="inviteConfirm" className="mb-1.5 block text-sm font-medium text-ink">
          Confirm password
        </label>
        <input
          id="inviteConfirm"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full rounded-[var(--radius-sm)] border border-hairline bg-surface px-4 py-2.5 text-sm text-ink focus:border-cargo"
        />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center justify-center rounded-[var(--radius-sm)] bg-signal px-4 py-3 text-sm font-medium text-white hover:bg-signal-hover disabled:opacity-50"
      >
        {submitting ? "Saving…" : "Set password and continue"}
      </button>
    </form>
  );
}
