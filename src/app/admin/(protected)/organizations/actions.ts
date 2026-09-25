"use server";

import { revalidatePath } from "next/cache";
import {
  provisionOrganization,
  type ProvisionOrganizationResult,
} from "@/lib/organizations/provision";

/**
 * Platform-operator only. provisionOrganization() enforces that
 * server-side against the database (is_platform_owner()), and
 * create_organization_with_admin() in migration 0015 enforces it a
 * second time inside the transaction — a customer admin cannot get
 * anywhere near this by calling the action directly.
 */
export async function createOrganizationAction(
  input: unknown
): Promise<ProvisionOrganizationResult> {
  const result = await provisionOrganization(input);
  if (result.ok) {
    revalidatePath("/admin/organizations");
  }
  return result;
}
