"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { createOrganizationAction } from "./actions";

interface Created {
  id: string;
  name: string;
  slug: string;
  adminEmail: string;
  invited: boolean;
}

export function CreateOrganizationForm() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [adminEmail, setAdminEmail] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Created | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const result = await createOrganizationAction({ name, slug, adminEmail });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setCreated({
        id: result.organization.id,
        name: result.organization.name,
        slug: result.organization.slug,
        adminEmail: result.adminEmail,
        invited: result.invited,
      });
      setName("");
      setSlug("");
      setAdminEmail("");
    } catch {
      setError(
        "Could not reach the server. Refresh the page and try again — if it keeps failing, check the organization list before retrying."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (created) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cargo-tint text-cargo">
            <CheckCircle2 size={18} />
          </span>
          <div>
            <p className="font-display text-base font-semibold text-ink">
              {created.name} created.
            </p>
            <p className="mt-1 text-sm text-slate">
              {created.invited ? (
                <>
                  An invitation email was sent to{" "}
                  <span className="font-data text-xs text-ink">{created.adminEmail}</span>. They
                  choose their own password from the link, then sign in at /admin.
                </>
              ) : (
                <>
                  Existing account{" "}
                  <span className="font-data text-xs text-ink">{created.adminEmail}</span> was
                  associated as owner — they can sign in at /admin with their current
                  credentials. No invitation email was sent.
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href={`/admin/organizations/${created.id}`}
            className="inline-flex items-center justify-center rounded-[var(--radius-sm)] bg-signal px-4 py-3 text-sm font-medium text-white hover:bg-signal-hover"
          >
            Open organization
          </Link>
          <button
            type="button"
            onClick={() => setCreated(null)}
            className="inline-flex items-center justify-center rounded-[var(--radius-sm)] border border-hairline px-4 py-3 text-sm font-medium text-ink hover:bg-surface-sunken"
          >
            Create another organization
          </button>
          <Link
            href="/admin"
            className="inline-flex items-center justify-center rounded-[var(--radius-sm)] border border-hairline px-4 py-3 text-sm font-medium text-ink hover:bg-surface-sunken"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="orgName" className="mb-1.5 block text-sm font-medium text-ink">
            Company name
          </label>
          <input
            id="orgName"
            required
            maxLength={120}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Acme Freight Ltd"
            className="w-full rounded-[var(--radius-sm)] border border-hairline bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-slate-light focus:border-cargo"
          />
        </div>

        <div>
          <label htmlFor="orgSlug" className="mb-1.5 block text-sm font-medium text-ink">
            Slug <span className="font-normal text-slate">(optional)</span>
          </label>
          <input
            id="orgSlug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            maxLength={64}
            placeholder="acme-freight"
            className="w-full rounded-[var(--radius-sm)] border border-hairline bg-surface px-4 py-2.5 font-data text-sm text-ink placeholder:text-slate-light focus:border-cargo"
          />
          <p className="mt-1.5 text-xs text-slate-light">
            Lowercase letters, digits and hyphens. Generated from the name if left blank.
          </p>
        </div>
      </div>

      <div>
        <label htmlFor="adminEmail" className="mb-1.5 block text-sm font-medium text-ink">
          First admin email
        </label>
        <input
          id="adminEmail"
          type="email"
          required
          maxLength={254}
          value={adminEmail}
          onChange={(e) => setAdminEmail(e.target.value)}
          placeholder="admin@acmefreight.com"
          className="w-full rounded-[var(--radius-sm)] border border-hairline bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-slate-light focus:border-cargo"
        />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="mt-1 inline-flex items-center justify-center rounded-[var(--radius-sm)] bg-signal px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-signal-hover disabled:opacity-50"
      >
        {submitting ? "Creating…" : "Create Organization"}
      </button>
    </form>
  );
}
