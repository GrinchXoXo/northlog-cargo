import { NextResponse, type NextRequest } from "next/server";
import { handleUpdate } from "@/lib/telegram/dispatcher";
import { sendMessage } from "@/lib/telegram/api";
import type { TelegramUpdate } from "@/lib/telegram/types";

/**
 * Telegram calls this on every update. Authenticated via the secret
 * token Telegram echoes back in a header (set via setWebhook's
 * secret_token param): Telegram doesn't sign webhook payloads, so this
 * shared-secret header is the standard substitute. See PRD section 8.
 */
export async function POST(request: NextRequest) {
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const providedSecret = request.headers.get("x-telegram-bot-api-secret-token");

  if (!expectedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let update: TelegramUpdate;
  try {
    update = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    await handleUpdate(update);
  } catch (err) {
    // Telegram retries on non-2xx, which could double-send messages for
    // an error that's on our side: log and still return 200. Also try
    // to tell the user something broke, since a silent failure here
    // looks identical (a delivered checkmark, no reply) whether the bot
    // is misconfigured or just slow: a bare console.error is invisible
    // from inside Telegram itself.
    console.error("Telegram update handling failed:", err);

    const chatId = update.message?.chat.id ?? update.callback_query?.message?.chat.id;
    if (chatId) {
      try {
        await sendMessage(
          chatId,
          "Something went wrong handling that. Please try again, or check the server logs if this keeps happening."
        );
      } catch (notifyErr) {
        console.error("Also failed to notify the user in Telegram:", notifyErr);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
