import type { PostgrestError } from "@supabase/supabase-js";
import { SITE_URL } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { ValidationError } from "@/lib/validation/error";
import { validateProvisioningInput } from "@/lib/validation/organization";
import type { ProvisionedOrganization } from "@/types/organization";

export type ProvisionOrganizationResult =
  | {
      ok: true;
      organization: ProvisionedOrganization;
      adminEmail: string;
      /**
       * True when a new Auth user was created and sent an invitation
       * email (they set their own password when accepting). False when
       * an existing Auth user was associated instead — no email is sent
       * and they sign in with their existing credentials.
       */
      invited: boolean;
    }
  | {
      ok: false;
      error: string;
      /** True when the Auth user was created but the organization was not. */
      partialAuthUserCreated?: boolean;
    };

/**
 * Where Supabase Auth sends the admin after they click the invitation
 * link. The accept page exchanges the session tokens from the URL and
 * prompts for a new password; never a token, password, or secret.
 */
function inviteRedirectUrl(): string {
  // SITE_URL already reads NEXT_PUBLIC_SITE_URL and falls back to the
  // production domain, so the invitation link always has a home — never
  // undefined, which would silently fall back to whatever Supabase Auth
  // has configured as its own Site URL.
  return `${SITE_URL.replace(/\/+$/, "")}/admin/accept-invite`;
}

/**
 * Our own functions raise with SQLSTATE P0001 and a message that was
 * written to be shown to an operator ("An organization with that slug
 * already exists."). Anything else — constraint violations, connection
 * trouble, a bug — is logged and replaced with something safe.
 */
function describeRpcError(error: PostgrestError): string {
  if (error.code === "P0001") {
    return error.message;
  }
  return "Could not create the organization.";
}

/**
 * Provisions a new organization together with its first admin.
 *
 * Order of operations is deliberate (see migration 0015): validate,
 * authorize, then invite the admin into Supabase Auth (invitation email
 * only — this code never sees or sets a password), and only then run the
 * single transaction that inserts the organization and its OWNER
 * membership. The Auth user cannot participate in that transaction, so
 * if the last step fails the result says exactly that — an Auth user
 * with no organization is inert and is reused on the next attempt,
 * whereas an organization with no admin would claim a slug and lie
 * about success.
 *
 * Runs only in server code. The service-role key is read here and
 * nowhere else; it is never returned to the browser.
 */
export async function provisionOrganization(
  input: unknown
): Promise<ProvisionOrganizationResult> {
  let validated;
  try {
    validated = validateProvisioningInput(input);
  } catch (err) {
    if (err instanceof ValidationError) {
      return { ok: false, error: err.message };
    }
    throw err;
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Authentication required." };
  }

  // Server-side authorization before any side effect. The database
  // function checks this again — this check exists so we never create
  // an Auth user for a request that was going to be refused anyway.
  const { data: isOwner, error: ownerError } = await supabase.rpc("is_platform_owner");
  if (ownerError) {
    console.error("is_platform_owner failed:", ownerError.message);
    return { ok: false, error: "Could not verify your permissions." };
  }
  if (isOwner !== true) {
    return { ok: false, error: "Only the Northlog platform operator can create organizations." };
  }

  let service;
  try {
    service = createServiceRoleClient();
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : "The service-role key is not configured on this server.",
    };
  }

  // Fail fast on a taken slug, before creating anything at all.
  const { data: slugRow, error: slugError } = await service
    .from("organizations")
    .select("id")
    .eq("slug", validated.slug)
    .maybeSingle();

  if (slugError) {
    console.error("slug lookup failed:", slugError.message);
    return { ok: false, error: "Could not check whether that slug is already in use." };
  }
  if (slugRow) {
    return { ok: false, error: "An organization with that slug already exists." };
  }

  // Resolve the admin's Auth user, creating it if needed.
  const { data: existingUserId, error: lookupError } = await service.rpc(
    "find_auth_user_by_email",
    { p_email: validated.adminEmail }
  );

  if (lookupError) {
    console.error("find_auth_user_by_email failed:", lookupError.message);
    return { ok: false, error: "Could not look up that admin email." };
  }

  let adminUserId = existingUserId as string | null;
  let invited = false;
  let createdAuthUser = false;

  if (adminUserId) {
    // Attaching someone who already administers another organization
    // would silently put both companies behind one session, so refuse
    // before writing anything.
    const { data: memberships, error: membershipError } = await service
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", adminUserId);

    if (membershipError) {
      console.error("membership lookup failed:", membershipError.message);
      return { ok: false, error: "Could not check that admin's existing memberships." };
    }
    if (memberships && memberships.length > 0) {
      return {
        ok: false,
        error: "That email already belongs to an admin of another organization.",
      };
    }
  } else {
    // No plaintext password is ever generated here: Supabase Auth
    // creates the user in an invited state and emails them a link; the
    // admin chooses their own password on the accept page.
    const { data: invitedUser, error: inviteError } = await service.auth.admin.inviteUserByEmail(
      validated.adminEmail,
      { redirectTo: inviteRedirectUrl() }
    );

    if (inviteError || !invitedUser.user?.id) {
      console.error("auth.admin.inviteUserByEmail failed:", inviteError?.message ?? "no user returned");
      return {
        ok: false,
        error: "Could not invite the Supabase Auth user for that email. Nothing was created.",
      };
    }

    adminUserId = invitedUser.user.id;
    invited = true;
    createdAuthUser = true;
  }

  // One transaction: organization + OWNER membership, both or neither.
  const { data, error } = await supabase.rpc("create_organization_with_admin", {
    p_name: validated.name,
    p_slug: validated.slug,
    p_admin_user_id: adminUserId,
  });

  if (error) {
    console.error("create_organization_with_admin failed:", error.message);
    const base = describeRpcError(error);

    // A transport error can arrive *after* the transaction committed, so
    // ask the database what actually happened instead of guessing. The
    // service-role client reads the real state, unaffected by RLS.
    const { data: membership, error: stateError } = await service
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", adminUserId)
      .maybeSingle();

    if (stateError) {
      console.error("post-failure state check failed:", stateError.message);
      return {
        ok: false,
        partialAuthUserCreated: createdAuthUser,
        error: `${base} We could not confirm whether the organization was created — check the organization list before retrying.`,
      };
    }

    if (membership) {
      // The transaction did commit: report the organization that exists
      // rather than an error the operator would act on.
      const { data: organization, error: orgError } = await service
        .from("organizations")
        .select("id, name, slug")
        .eq("id", membership.organization_id)
        .maybeSingle();

      if (!orgError && organization) {
        return {
          ok: true,
          organization: {
            id: organization.id,
            name: organization.name,
            slug: organization.slug,
          },
          adminEmail: validated.adminEmail,
          invited,
        };
      }

      // Committed, but the read-back failed. Never clean up from here:
      // the organization exists and deleting its admin would strand it.
      return {
        ok: false,
        error:
          `${base} The organization was created (its membership exists) but could not be ` +
          `read back — check the organization list before doing anything else.`,
      };
    }

    // The transaction did not commit. If this attempt created the Auth
    // user, delete it again so the database is exactly as it was before
    // the attempt; an Auth user with no membership would otherwise be an
    // orphan that only ever shows up later as a confusing duplicate.
    if (createdAuthUser) {
      const { error: cleanupError } = await service.auth.admin.deleteUser(adminUserId);

      if (cleanupError) {
        console.error("auth.admin.deleteUser (cleanup) failed:", cleanupError.message);
        return {
          ok: false,
          partialAuthUserCreated: true,
          error:
            `${base} The Supabase Auth user for ${validated.adminEmail} was created but no ` +
            `organization was — run this again to retry; the same user will be reused.`,
        };
      }

      return { ok: false, error: `${base} Nothing was created.` };
    }

    return { ok: false, error: base };
  }

  const organization = data as {
    id: string;
    name: string;
    slug: string;
  };

  return {
    ok: true,
    organization: { id: organization.id, name: organization.name, slug: organization.slug },
    adminEmail: validated.adminEmail,
    invited,
  };
}
