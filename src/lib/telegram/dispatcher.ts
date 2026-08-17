import { sendMessage, answerCallbackQuery } from "./api";
import { getSession, clearSession } from "./session";
import { resolveAdminForTelegramUser, redeemLinkToken, isLinkTokenValid } from "./linking";
import { startCreateFlow, handleCreateMessage, handleCreateCallback } from "./commands/create";
import { startTrackFlow, handleTrackMessage } from "./commands/track";
import { startUpdateFlow, handleUpdateMessage, handleUpdateCallback } from "./commands/update";
import { SITE_SHORT_NAME } from "@/lib/constants";
import type { TelegramUpdate } from "./types";

const HELP_TEXT = [
  "Available commands:",
  "",
  "/create: create a new shipment",
  "/track: look up a shipment by tracking ID",
  "/update: update an existing shipment",
  "/cancel: cancel whatever you're currently doing",
].join("\n");

const NOT_CONNECTED_TEXT =
  "Your Telegram account is not connected.\n\nPlease connect Telegram from your administrator dashboard (Settings > Telegram).";

export async function handleUpdate(update: TelegramUpdate): Promise<void> {
  if (update.callback_query) {
    await handleCallbackQuery(update);
    return;
  }
  if (update.message) {
    await handleMessage(update);
  }
}

async function handleMessage(update: TelegramUpdate) {
  const message = update.message!;
  const chatId = message.chat.id;
  const telegramUserId = message.from?.id;
  if (!telegramUserId) return;

  const text = message.text?.trim() ?? "";

  // /start [token]: either a plain greeting or an account-linking deep link.
  if (text.startsWith("/start")) {
    const parts = text.split(/\s+/);
    const token = parts[1];

    if (token) {
      const valid = await isLinkTokenValid(token);
      if (!valid) {
        await sendMessage(
          chatId,
          "This connection link has expired. Please generate a new one from the Admin Dashboard."
        );
        return;
      }
      await sendMessage(chatId, "Connect this Telegram account to your administrator dashboard?", {
        replyMarkup: [
          [
            { text: "Connect Account", callback_data: `link:confirm:${token}` },
            { text: "Cancel", callback_data: "link:cancel" },
          ],
        ],
      });
      return;
    }

    const adminId = await resolveAdminForTelegramUser(telegramUserId);
    if (!adminId) {
      await sendMessage(chatId, NOT_CONNECTED_TEXT);
      return;
    }
    await sendMessage(chatId, `Welcome to ${SITE_SHORT_NAME} Operations.\n\n` + HELP_TEXT);
    return;
  }

  const adminId = await resolveAdminForTelegramUser(telegramUserId);
  if (!adminId) {
    await sendMessage(chatId, NOT_CONNECTED_TEXT);
    return;
  }

  if (text === "/help") {
    await sendMessage(chatId, HELP_TEXT);
    return;
  }

  if (text === "/cancel") {
    await clearSession(telegramUserId);
    await sendMessage(chatId, "Cancelled.");
    return;
  }

  if (text === "/create") {
    await startCreateFlow(chatId, telegramUserId);
    return;
  }

  if (text === "/track") {
    await startTrackFlow(chatId, telegramUserId);
    return;
  }

  if (text === "/update") {
    await startUpdateFlow(chatId, telegramUserId);
    return;
  }

  // No command matched: route to whatever guided flow is active, if any.
  const session = await getSession(telegramUserId);
  if (!session) {
    await sendMessage(chatId, "Not sure what you mean. Try /help to see available commands.");
    return;
  }

  if (session.command === "create") {
    await handleCreateMessage(message, telegramUserId, session);
  } else if (session.command === "track") {
    await handleTrackMessage(message, telegramUserId);
  } else if (session.command === "update") {
    await handleUpdateMessage(message, telegramUserId, adminId, session);
  }
}

async function handleCallbackQuery(update: TelegramUpdate) {
  const query = update.callback_query!;
  const telegramUserId = query.from.id;
  const data = query.data ?? "";

  await answerCallbackQuery(query.id);

  if (data.startsWith("link:confirm:")) {
    const token = data.replace("link:confirm:", "");
    const adminId = await redeemLinkToken(token, telegramUserId, query.from.username);
    const chatId = query.message?.chat.id;
    if (!chatId) return;

    if (!adminId) {
      await sendMessage(
        chatId,
        "This connection link has expired. Please generate a new one from the Admin Dashboard."
      );
      return;
    }

    await sendMessage(chatId, "Telegram account linked.\n\n" + HELP_TEXT);
    return;
  }

  if (data === "link:cancel") {
    const chatId = query.message?.chat.id;
    if (chatId) await sendMessage(chatId, "Not connected.");
    return;
  }

  const adminId = await resolveAdminForTelegramUser(telegramUserId);
  if (!adminId) {
    const chatId = query.message?.chat.id;
    if (chatId) await sendMessage(chatId, NOT_CONNECTED_TEXT);
    return;
  }

  const session = await getSession(telegramUserId);
  if (!session) return;

  if (data.startsWith("create:")) {
    await handleCreateCallback(query, telegramUserId, adminId, session);
  } else if (data.startsWith("update:")) {
    await handleUpdateCallback(query, telegramUserId, adminId, session);
  }
}
