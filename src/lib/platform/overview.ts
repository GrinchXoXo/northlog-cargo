import { isPlatformOwner } from "@/lib/platform/isPlatformOwner";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { listOrganizations } from "@/lib/organizations/list";
import type { OrganizationListItem } from "@/types/organization";

export interface PlatformOverview {
  totalOrganizations: number;
  /** Organizations with at least one shipment — the honest, minimal definition of "active". */
  activeOrganizations: number;
  totalShipments: number;
  recentOrganizations: OrganizationListItem[];
  recentShipments: Array<{
    id: string;
    trackingId: string;
    organizationId: string;
    organizationName: string;
    status: string;
    updatedAt: string;
  }>;
}

const EMPTY: PlatformOverview = {
  totalOrganizations: 0,
  activeOrganizations: 0,
  totalShipments: 0,
  recentOrganizations: [],
  recentShipments: [],
};

/**
 * Platform-level numbers for the operator dashboard (Part A): totals
 * across all organizations, not a drill-down into any single tenant.
 * Deliberately minimal — counts and two short recents lists, no
 * analytics, billing, or audit surfaces.
 *
 * Fail-closed: any authorization or transport failure returns zeros.
 */
export async function getPlatformOverview(): Promise<PlatformOverview> {
  if ((await isPlatformOwner()) !== true) {
    return EMPTY;
  }

  const { organizations, error } = await listOrganizations();
  if (error) {
    console.error("getPlatformOverview (organizations) failed:", error);
    return EMPTY;
  }

  let service;
  try {
    service = createServiceRoleClient();
  } catch (err) {
    console.error("getPlatformOverview: service client unavailable:", err instanceof Error ? err.message : err);
    return { ...EMPTY, totalOrganizations: organizations.length, recentOrganizations: organizations.slice(0, 5) };
  }

  const [totalRes, activeRes, recentRes] = await Promise.all([
    service.from("shipments").select("id", { count: "exact", head: true }),
    service.from("shipments").select("organization_id"),
    service
      .from("shipments")
      .select("id, tracking_id, organization_id, current_status, updated_at")
      .order("updated_at", { ascending: false })
      .limit(5),
  ]);

  if (totalRes.error) {
    console.error("getPlatformOverview (total shipments) failed:", totalRes.error.message);
  }
  if (activeRes.error) {
    console.error("getPlatformOverview (active orgs) failed:", activeRes.error.message);
  }
  if (recentRes.error) {
    console.error("getPlatformOverview (recent shipments) failed:", recentRes.error.message);
  }

  const orgNames = new Map(organizations.map((o) => [o.id, o.name]));
  const activeOrgIds = new Set(
    (activeRes.data ?? []).map((row) => row.organization_id).filter((id): id is string => Boolean(id))
  );

  const byCreatedDesc = [...organizations].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return {
    totalOrganizations: organizations.length,
    activeOrganizations: organizations.filter((o) => activeOrgIds.has(o.id)).length,
    totalShipments: totalRes.count ?? 0,
    recentOrganizations: byCreatedDesc.slice(0, 5),
    recentShipments: (recentRes.data ?? []).map((row) => ({
      id: row.id,
      trackingId: row.tracking_id,
      organizationId: row.organization_id,
      organizationName: orgNames.get(row.organization_id) ?? "Unknown organization",
      status: row.current_status,
      updatedAt: row.updated_at,
    })),
  };
}
