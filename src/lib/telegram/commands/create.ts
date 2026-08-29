import { sendMessage } from "../api";
import { setSession, clearSession, type BotSession } from "../session";
import { createShipment } from "@/lib/shipments/createShipment";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { uploadTelegramPhoto } from "../image";
import { parseEta } from "../parseEta";
import type { TelegramMessage, TelegramCallbackQuery } from "../types";

const STEPS = ["sender", "product", "origin", "destination", "image", "eta", "confirm"] as const;
type Step = (typeof STEPS)[number];

const PROMPTS: Record<Step, string> = {
  sender: "Sender name?",
  product: "Product description?",
  origin: "Origin?",
  destination: "Destination?",
  image: "Send a package photo, or tap Skip.",
  eta: 'Estimated delivery? (e.g. "48 hours" or "14 Aug 2026 14:00"), or tap Skip.',
  confirm: "",
};

export async function startCreateFlow(chatId: number, telegramUserId: number) {
  const session: BotSession = { command: "create", step: "sender", data: {} };
  await setSession(telegramUserId, session);
  await sendMessage(chatId, `Creating a shipment.\n\n${PROMPTS.sender}`);
}

function summary(data: Record<string, unknown>): string {
  return [
    "Please confirm:",
    "",
    `Sender: ${data.senderName}`,
    `Product: ${data.productDescription}`,
    `Origin: ${data.origin}`,
    `Destination: ${data.destination}`,
    `Image: ${data.productImagePath ? "Attached" : "None"}`,
    `ETA: ${data.estimatedDeliveryAt ? new Date(data.estimatedDeliveryAt as string).toLocaleString() : "Not set"}`,
    "",
    "Create shipment?",
  ].join("\n");
}

async function advance(chatId: number, telegramUserId: number, session: BotSession) {
  if (session.step === "confirm") {
    await sendMessage(chatId, summary(session.data), {
      replyMarkup: [
        [
          { text: "Confirm", callback_data: "create:confirm" },
          { text: "Cancel", callback_data: "create:cancel" },
        ],
      ],
    });
    return;
  }

  const step = session.step as Step;
  const buttons =
    step === "image" || step === "eta"
      ? [[{ text: "Skip", callback_data: `create:skip_${step}` }]]
      : undefined;

  await sendMessage(chatId, PROMPTS[step], buttons ? { replyMarkup: buttons } : undefined);
}

function nextStep(current: Step): Step {
  const idx = STEPS.indexOf(current);
  return STEPS[idx + 1];
}

export async function handleCreateMessage(
  message: TelegramMessage,
  telegramUserId: number,
  session: BotSession
) {
  const chatId = message.chat.id;
  const step = session.step as Step;

  if (step === "image" && message.photo && message.photo.length > 0) {
    await sendMessage(chatId, "Uploading image…");
    try {
      const largest = message.photo[message.photo.length - 1];
      const path = await uploadTelegramPhoto(largest.file_id);
      session.data.productImagePath = path;
    } catch {
      await sendMessage(chatId, "The image could not be uploaded. Please try again, or tap Skip.");
      return;
    }
    session.step = nextStep(step);
    await setSession(telegramUserId, session);
    await advance(chatId, telegramUserId, session);
    return;
  }

  const text = message.text?.trim();
  if (!text) {
    await sendMessage(chatId, "Please send text, or use the buttons above.");
    return;
  }

  if (step === "sender") session.data.senderName = text;
  else if (step === "product") session.data.productDescription = text;
  else if (step === "origin") session.data.origin = text;
  else if (step === "destination") session.data.destination = text;
  else if (step === "eta") {
    const parsed = parseEta(text);
    if (!parsed) {
      await sendMessage(chatId, 'Could not read that date. Try "48 hours" or "14 Aug 2026 14:00".');
      return;
    }
    session.data.estimatedDeliveryAt = parsed;
  } else if (step === "image") {
    await sendMessage(chatId, "Send a photo, or tap Skip.");
    return;
  }

  session.step = nextStep(step);
  await setSession(telegramUserId, session);
  await advance(chatId, telegramUserId, session);
}

export async function handleCreateCallback(
  query: TelegramCallbackQuery,
  telegramUserId: number,
  adminId: string,
  session: BotSession
) {
  const chatId = query.message?.chat.id;
  if (!chatId) return;

  const data = query.data ?? "";

  if (data === "create:skip_image") {
    session.step = nextStep("image");
    await setSession(telegramUserId, session);
    await advance(chatId, telegramUserId, session);
    return;
  }

  if (data === "create:skip_eta") {
    session.step = nextStep("eta");
    await setSession(telegramUserId, session);
    await advance(chatId, telegramUserId, session);
    return;
  }

  if (data === "create:cancel") {
    await clearSession(telegramUserId);
    await sendMessage(chatId, "Cancelled. No shipment was created.");
    return;
  }

  if (data === "create:confirm") {
    await clearSession(telegramUserId);
    const supabase = createServiceRoleClient();
    const result = await createShipment(session.data, { client: supabase, actorId: adminId });

    if (!result.ok) {
      await sendMessage(chatId, `Unable to create shipment. ${result.error}`);
      return;
    }

    await sendMessage(
      chatId,
      `Shipment created successfully.\n\nTracking ID:\n${result.trackingId}`
    );
  }
}
