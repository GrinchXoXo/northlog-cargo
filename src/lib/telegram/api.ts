/**
 * Minimal Telegram Bot API client. No third-party bot framework: this
 * project is webhook-only (no long-running process to poll from), so a
 * thin fetch wrapper over the handful of endpoints actually used is
 * simpler and has no unnecessary dependency surface.
 * https://core.telegram.org/bots/api
 */

export interface InlineKeyboardButton {
  text: string;
  callback_data?: string;
}

export type InlineKeyboard = InlineKeyboardButton[][];

function getBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error(
      "Missing TELEGRAM_BOT_TOKEN. Set it in .env.local (from @BotFather), then restart the server."
    );
  }
  return token;
}

async function callTelegramApi<T = unknown>(method: string, body: Record<string, unknown>): Promise<T> {
  const token = getBotToken();
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  if (!json.ok) {
    console.error(`Telegram API ${method} failed:`, json.description);
    throw new Error(`Telegram API ${method} failed: ${json.description ?? res.status}`);
  }
  return json.result as T;
}

export async function sendMessage(
  chatId: number,
  text: string,
  options?: { replyMarkup?: InlineKeyboard; parseMode?: "Markdown" | "HTML" }
) {
  return callTelegramApi("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: options?.parseMode,
    reply_markup: options?.replyMarkup ? { inline_keyboard: options.replyMarkup } : undefined,
  });
}

export async function sendPhoto(
  chatId: number,
  photoUrl: string,
  caption?: string,
  options?: { replyMarkup?: InlineKeyboard }
) {
  return callTelegramApi("sendPhoto", {
    chat_id: chatId,
    photo: photoUrl,
    caption,
    reply_markup: options?.replyMarkup ? { inline_keyboard: options.replyMarkup } : undefined,
  });
}

export async function editMessageText(
  chatId: number,
  messageId: number,
  text: string,
  options?: { replyMarkup?: InlineKeyboard }
) {
  return callTelegramApi("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
    reply_markup: options?.replyMarkup ? { inline_keyboard: options.replyMarkup } : undefined,
  });
}

export async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  return callTelegramApi("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text,
  });
}

interface TelegramFile {
  file_id: string;
  file_path?: string;
}

export async function getFile(fileId: string): Promise<TelegramFile> {
  return callTelegramApi<TelegramFile>("getFile", { file_id: fileId });
}

/** Downloads a Telegram-hosted file's raw bytes given its resolved file_path. */
export async function downloadFile(filePath: string): Promise<{ bytes: ArrayBuffer; contentType: string }> {
  const token = getBotToken();
  const res = await fetch(`https://api.telegram.org/file/bot${token}/${filePath}`);
  if (!res.ok) {
    throw new Error(`Failed to download Telegram file: ${res.status}`);
  }
  return {
    bytes: await res.arrayBuffer(),
    contentType: res.headers.get("content-type") ?? "application/octet-stream",
  };
}

export async function setWebhook(url: string, secretToken: string) {
  return callTelegramApi("setWebhook", { url, secret_token: secretToken });
}
