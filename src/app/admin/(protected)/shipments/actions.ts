"use server";

import { revalidatePath } from "next/cache";
import { createShipment, type CreateShipmentResult } from "@/lib/shipments/createShipment";
import { addTrackingEvent, type AddTrackingEventResult } from "@/lib/shipments/addTrackingEvent";
import { updateShipment, type UpdateShipmentInput, type UpdateShipmentResult } from "@/lib/shipments/updateShipment";

export async function createShipmentAction(input: unknown): Promise<CreateShipmentResult> {
  const result = await createShipment(input);
  if (result.ok) {
    revalidatePath("/admin");
    revalidatePath("/admin/shipments");
  }
  return result;
}

export async function addTrackingEventAction(input: unknown): Promise<AddTrackingEventResult> {
  const result = await addTrackingEvent(input);
  if (result.ok) {
    revalidatePath("/admin");
    revalidatePath("/admin/shipments");
    revalidatePath("/tracking");
  }
  return result;
}

export async function updateShipmentAction(
  shipmentId: string,
  input: UpdateShipmentInput
): Promise<UpdateShipmentResult> {
  const result = await updateShipment(shipmentId, input);
  if (result.ok) {
    revalidatePath("/admin/shipments");
    revalidatePath("/tracking");
  }
  return result;
}
