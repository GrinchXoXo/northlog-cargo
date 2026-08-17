import { createServiceRoleClient } from "@/lib/supabase/service";

const SESSION_TTL_MINUTES = 30;

/** Conversation state for a guided flow (/create, /update). */
export interface BotSession {
  command: "create" | "update" | "track";
  step: string;
  data: Record<string, unknown>;
}

/**
 * Durable per-Telegram-user conversation state (PRD section 22: "do not
 * rely solely on server memory for production state"). Postgres-backed
 * rather than adding Redis, consistent with keeping this project's
 * infrastructure minimal. Expires after 30 minutes of inactivity.
 */
export async function getSession(telegramUserId: number): Promise<BotSession | null> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("telegram_sessions")
    .select("state, updated_at")
    .eq("telegram_user_id", telegramUserId)
    .maybeSingle();

  if (error || !data) return null;

  const updatedAt = new Date(data.updated_at as string).getTime();
  const ageMinutes = (Date.now() - updatedAt) / 60000;
  if (ageMinutes > SESSION_TTL_MINUTES) {
    await clearSession(telegramUserId);
    return null;
  }

  const state = data.state as Record<string, unknown>;
  if (!state || typeof state.command !== "string" || typeof state.step !== "string") {
    return null;
  }

  return state as unknown as BotSession;
}

export async function setSession(telegramUserId: number, session: BotSession): Promise<void> {
  const supabase = createServiceRoleClient();

  await supabase.from("telegram_sessions").upsert({
    telegram_user_id: telegramUserId,
    state: session,
    updated_at: new Date().toISOString(),
  });
}

export async function clearSession(telegramUserId: number): Promise<void> {
  const supabase = createServiceRoleClient();
  await supabase.from("telegram_sessions").delete().eq("telegram_user_id", telegramUserId);
}
