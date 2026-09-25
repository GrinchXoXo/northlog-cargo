import { isPlatformOwner } from "@/lib/platform/isPlatformOwner";
import { listOrganizations } from "@/lib/organizations/list";
import type { OrganizationListItem } from "@/types/organization";

export interface OrgContext {
  id: string;
  name: string;
  slug: string;
}

/**
 * Resolves an organization for the platform-owner context view.
 *
 * Fail-closed on every path:
 *
 *   * A non-owner caller never gets here unnoticed — `list_organizations`
 *     (migration 0015) refuses to answer anyone who is not the platform
 *     operator, so the lookup below returns an empty list and therefore
 *     `null`. The explicit `isPlatformOwner()` check exists only to make
 *     the intent obvious and to avoid a confusing RPC error for the
 *     common case.
 *   * An id that does not match any organization returns `null`,
 *     whether it is malformed, nonexistent, or merely someone guessing.
 *
 * Callers must treat `null` as "not authorized / does not exist" and
 * redirect away. This never grants data access by itself — the data
 * readers in ./orgData.ts re-check the platform owner before touching
 * any rows.
 */
export async function resolveOrgContext(orgId: string): Promise<OrgContext | null> {
  if (!orgId || orgId.length > 64) {
    return null;
  }

  if (!(await isPlatformOwner())) {
    return null;
  }

  const { organizations, error } = await listOrganizations();
  if (error) {
    return null;
  }

  const match = organizations.find((o: OrganizationListItem) => o.id === orgId);
  if (!match) {
    return null;
  }

  return { id: match.id, name: match.name, slug: match.slug };
}
