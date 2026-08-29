"use server";

import { createClient } from "@/lib/supabase/server";

export type GenerateLinkResult = { ok: true; deepLink: string } | { ok: false; error: string };

/**
 * Generates a short-lived, single-use link token and returns the
 * Telegram deep link the admin taps to start the connect flow (PRD
 * section 5). The bot username is public (needed to build the t.me
 * URL) but the token itself is only ever sent to the authenticated
 * admin who requested it.
 */
export async function generateTelegramLinkAction(): Promise<GenerateLinkResult> {
  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
  if (!botUsername) {
    return { ok: false, error: "Telegram bot is not configured yet." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Authentication required." };
  }

  const { data, error } = await supabase.rpc("create_telegram_link_token", { p_ttl_minutes: 10 });

  if (error || !data) {
    console.error("create_telegram_link_token failed:", error?.message);
    return { ok: false, error: "Could not generate a connection link. Please try again." };
  }

  return { ok: true, deepLink: `https://t.me/${botUsername}?start=${data}` };
}

export type DisconnectResult = { ok: true } | { ok: false; error: string };

export async function disconnectTelegramAction(): Promise<DisconnectResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Authentication required." };
  }

  const { error } = await supabase
    .from("telegram_accounts")
    .update({ active: false })
    .eq("admin_id", user.id);

  if (error) {
    console.error("disconnectTelegramAction failed:", error.message);
    return { ok: false, error: "Could not disconnect Telegram. Please try again." };
  }

  return { ok: true };
}
