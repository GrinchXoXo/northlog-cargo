import { sendMessage } from "../api";
import { setSession, clearSession } from "../session";
import { getShipmentForAdmin } from "@/lib/shipments/getShipmentForAdmin";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { formatShipmentSummary } from "../format";
import type { TelegramMessage } from "../types";

export async function startTrackFlow(chatId: number, telegramUserId: number) {
  await setSession(telegramUserId, { command: "track", step: "tracking_id", data: {} });
  await sendMessage(chatId, "Enter the tracking ID to look up.");
}

export async function handleTrackMessage(message: TelegramMessage, telegramUserId: number) {
  const chatId = message.chat.id;
  const trackingId = message.text?.trim();

  await clearSession(telegramUserId);

  if (!trackingId) {
    await sendMessage(chatId, "Please send a tracking ID.");
    return;
  }

  const supabase = createServiceRoleClient();
  const result = await getShipmentForAdmin(trackingId, { client: supabase });

  if (result.state === "not_found") {
    await sendMessage(chatId, "Shipment not found. Please check the tracking ID.");
    return;
  }

  if (result.state !== "success") {
    await sendMessage(chatId, "We couldn't retrieve this shipment right now. Please try again.");
    return;
  }

  await sendMessage(chatId, formatShipmentSummary(result.shipment));
}
