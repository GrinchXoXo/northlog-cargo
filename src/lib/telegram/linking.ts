import { createServiceRoleClient } from "@/lib/supabase/service";

/**
 * Resolves a Telegram user to an authorized admin, if linked and active.
 * This is the authorization check every bot command runs before doing
 * anything: a disabled/unlinked Telegram account must not be able to
 * touch shipment data, regardless of what it asks for.
 */
export async function resolveAdminForTelegramUser(telegramUserId: number): Promise<string | null> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("telegram_accounts")
    .select("admin_id")
    .eq("telegram_user_id", telegramUserId)
    .eq("active", true)
    .maybeSingle();

  if (error) {
    console.error("resolveAdminForTelegramUser query failed:", error.message);
    return null;
  }
  if (!data) return null;
  return data.admin_id as string;
}

/**
 * Checks whether a link token is currently valid, without consuming it.
 * Used to show the "Connect Account?" confirmation before the token is
 * actually redeemed (PRD section 5: the bot asks for confirmation
 * before finalizing the link).
 */
export async function isLinkTokenValid(token: string): Promise<boolean> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("telegram_link_tokens")
    .select("token")
    .eq("token", token)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (error) {
    console.error("isLinkTokenValid query failed:", error.message);
    return false;
  }
  return Boolean(data);
}

/**
 * Redeems a link token from a /start deep link, connecting a Telegram
 * user to the admin who generated it in the dashboard. Returns the
 * admin's ID on success, or null if the token is missing/expired/used.
 */
export async function redeemLinkToken(
  token: string,
  telegramUserId: number,
  telegramUsername: string | undefined
): Promise<string | null> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase.rpc("redeem_telegram_link_token", {
    p_token: token,
    p_telegram_user_id: telegramUserId,
    p_telegram_username: telegramUsername ?? null,
  });

  if (error) {
    console.error("redeem_telegram_link_token failed:", error.message);
    return null;
  }

  return (data as string | null) ?? null;
}

export async function disconnectTelegramForAdmin(telegramUserId: number): Promise<void> {
  const supabase = createServiceRoleClient();
  await supabase
    .from("telegram_accounts")
    .update({ active: false })
    .eq("telegram_user_id", telegramUserId);
}
