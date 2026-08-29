import { sendMessage } from "../api";
import { setSession, clearSession, type BotSession } from "../session";
import { getShipmentForAdmin } from "@/lib/shipments/getShipmentForAdmin";
import { addTrackingEvent } from "@/lib/shipments/addTrackingEvent";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { formatShipmentSummary } from "../format";
import { parseEta } from "../parseEta";
import { STATUS_LABELS, type ShipmentStatus } from "@/types/shipment";
import type { TelegramMessage, TelegramCallbackQuery } from "../types";
import type { InlineKeyboard } from "../api";

const POST_CUSTOMS_STATUSES: ShipmentStatus[] = [
  "RECEIVED_LOCAL_FACILITY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "EXCEPTION",
];

const MENU: InlineKeyboard = [
  [
    { text: "Status", callback_data: "update:menu_status" },
    { text: "Location", callback_data: "update:menu_location" },
  ],
  [
    { text: "ETA", callback_data: "update:menu_eta" },
    { text: "Customs", callback_data: "update:menu_customs" },
  ],
  [
    { text: "Note", callback_data: "update:menu_note" },
    { text: "Done", callback_data: "update:menu_done" },
  ],
];

export async function startUpdateFlow(chatId: number, telegramUserId: number) {
  await setSession(telegramUserId, { command: "update", step: "tracking_id", data: {} });
  await sendMessage(chatId, "Enter the tracking ID to update.");
}

async function showMenu(chatId: number, session: BotSession) {
  const status = session.data.currentStatus as ShipmentStatus;
  await sendMessage(chatId, `Current status:\n${STATUS_LABELS[status]}\n\nWhat would you like to update?`, {
    replyMarkup: MENU,
  });
}

async function applyEvent(
  chatId: number,
  telegramUserId: number,
  adminId: string,
  session: BotSession,
  fields: {
    status?: ShipmentStatus;
    location?: string;
    note?: string | null;
    estimatedDeliveryAt?: string | null;
    clearEstimatedDelivery?: boolean;
    requiresAction?: boolean | null;
    actionMessage?: string | null;
  }
) {
  const supabase = createServiceRoleClient();
  const result = await addTrackingEvent(
    {
      shipmentId: session.data.shipmentId,
      status: fields.status ?? session.data.currentStatus,
      location: fields.location ?? session.data.currentLocation,
      note: fields.note ?? null,
      imagePath: null,
      estimatedDeliveryAt: fields.estimatedDeliveryAt ?? null,
      clearEstimatedDelivery: fields.clearEstimatedDelivery ?? false,
      requiresAction: fields.requiresAction ?? null,
      actionMessage: fields.actionMessage ?? null,
    },
    { client: supabase, actorId: adminId }
  );

  await clearSession(telegramUserId);

  if (!result.ok) {
    await sendMessage(chatId, `Unable to update this shipment. ${result.error}`);
    return;
  }

  await sendMessage(chatId, "Updated. Use /update again for further changes.");
}

export async function handleUpdateMessage(
  message: TelegramMessage,
  telegramUserId: number,
  adminId: string,
  session: BotSession
) {
  const chatId = message.chat.id;
  const text = message.text?.trim();
  const step = session.step;

  if (step === "tracking_id") {
    if (!text) {
      await sendMessage(chatId, "Please send a tracking ID.");
      return;
    }
    const supabase = createServiceRoleClient();
    const result = await getShipmentForAdmin(text, { client: supabase });

    if (result.state === "not_found") {
      await clearSession(telegramUserId);
      await sendMessage(chatId, "Shipment not found. Please check the tracking ID.");
      return;
    }
    if (result.state !== "success") {
      await clearSession(telegramUserId);
      await sendMessage(chatId, "We couldn't retrieve this shipment right now. Please try again.");
      return;
    }

    session.data.shipmentId = result.shipment.id;
    session.data.currentStatus = result.shipment.currentStatus;
    session.data.currentLocation = result.shipment.currentLocationLabel ?? result.shipment.destination;
    session.step = "menu";
    await setSession(telegramUserId, session);
    await sendMessage(chatId, formatShipmentSummary(result.shipment));
    await showMenu(chatId, session);
    return;
  }

  if (step === "location_input" && text) {
    await applyEvent(chatId, telegramUserId, adminId, session, { location: text });
    return;
  }

  if (step === "eta_input" && text) {
    const parsed = parseEta(text);
    if (!parsed) {
      await sendMessage(chatId, 'Could not read that date. Try "48 hours" or "14 Aug 2026 14:00".');
      return;
    }
    await applyEvent(chatId, telegramUserId, adminId, session, { estimatedDeliveryAt: parsed });
    return;
  }

  if (step === "customs_message" && text) {
    await applyEvent(chatId, telegramUserId, adminId, session, {
      status: "CUSTOMS_CLEARANCE",
      requiresAction: true,
      actionMessage: text,
    });
    return;
  }

  if (step === "note_input" && text) {
    await applyEvent(chatId, telegramUserId, adminId, session, { note: text });
    return;
  }

  await sendMessage(chatId, "Please send text, or use the buttons above.");
}

export async function handleUpdateCallback(
  query: TelegramCallbackQuery,
  telegramUserId: number,
  adminId: string,
  session: BotSession
) {
  const chatId = query.message?.chat.id;
  if (!chatId) return;
  const data = query.data ?? "";

  if (data === "update:menu_done") {
    await clearSession(telegramUserId);
    await sendMessage(chatId, "Okay: no further changes.");
    return;
  }

  if (data === "update:menu_status") {
    const buttons: InlineKeyboard = Object.entries(STATUS_LABELS).map(([value, label]) => [
      { text: label, callback_data: `update:status:${value}` },
    ]);
    session.step = "status_select";
    await setSession(telegramUserId, session);
    await sendMessage(chatId, "Select new status:", { replyMarkup: buttons });
    return;
  }

  if (data.startsWith("update:status:")) {
    const status = data.replace("update:status:", "") as ShipmentStatus;
    const current = session.data.currentStatus as ShipmentStatus;
    session.data.pendingStatus = status;
    session.step = "status_confirm";
    await setSession(telegramUserId, session);
    await sendMessage(chatId, `Change status?\n\n${STATUS_LABELS[current]}\n↓\n${STATUS_LABELS[status]}`, {
      replyMarkup: [
        [
          { text: "Confirm", callback_data: "update:status_confirm" },
          { text: "Cancel", callback_data: "update:status_cancel" },
        ],
      ],
    });
    return;
  }

  if (data === "update:status_cancel") {
    session.step = "menu";
    await setSession(telegramUserId, session);
    await showMenu(chatId, session);
    return;
  }

  if (data === "update:status_confirm") {
    const status = session.data.pendingStatus as ShipmentStatus;
    await applyEvent(chatId, telegramUserId, adminId, session, { status });
    return;
  }

  if (data === "update:menu_location") {
    session.step = "location_input";
    await setSession(telegramUserId, session);
    await sendMessage(chatId, "Enter current shipment location.");
    return;
  }

  if (data === "update:menu_eta") {
    session.step = "eta_input";
    await setSession(telegramUserId, session);
    await sendMessage(chatId, 'Enter new estimated delivery (e.g. "48 hours" or "14 Aug 2026 14:00").', {
      replyMarkup: [[{ text: "Clear ETA", callback_data: "update:eta_clear" }]],
    });
    return;
  }

  if (data === "update:eta_clear") {
    await applyEvent(chatId, telegramUserId, adminId, session, { clearEstimatedDelivery: true });
    return;
  }

  if (data === "update:menu_note") {
    session.step = "note_input";
    await setSession(telegramUserId, session);
    await sendMessage(chatId, "Enter the note to add.");
    return;
  }

  if (data === "update:menu_customs") {
    session.step = "customs_menu";
    await setSession(telegramUserId, session);
    await sendMessage(chatId, "Customs status:", {
      replyMarkup: [
        [
          { text: "Awaiting Clearance", callback_data: "update:customs_awaiting" },
          { text: "Cleared", callback_data: "update:customs_cleared" },
        ],
      ],
    });
    return;
  }

  if (data === "update:customs_awaiting") {
    session.step = "customs_message";
    await setSession(telegramUserId, session);
    await sendMessage(chatId, "Enter the message the customer should see (e.g. why clearance is needed).");
    return;
  }

  if (data === "update:customs_cleared") {
    const buttons: InlineKeyboard = POST_CUSTOMS_STATUSES.map((status) => [
      { text: STATUS_LABELS[status], callback_data: `update:cleared_status:${status}` },
    ]);
    session.step = "customs_cleared_status";
    await setSession(telegramUserId, session);
    await sendMessage(chatId, "Clearance completed. Select the next status:", { replyMarkup: buttons });
    return;
  }

  if (data.startsWith("update:cleared_status:")) {
    const status = data.replace("update:cleared_status:", "") as ShipmentStatus;
    await applyEvent(chatId, telegramUserId, adminId, session, {
      status,
      requiresAction: false,
    });
    return;
  }
}
