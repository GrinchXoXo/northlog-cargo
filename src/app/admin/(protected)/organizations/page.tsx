import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, Users } from "lucide-react";
import { isPlatformOwner } from "@/lib/platform/isPlatformOwner";
import { listOrganizations } from "@/lib/organizations/list";
import { CreateOrganizationForm } from "./CreateOrganizationForm";

export const metadata: Metadata = {
  title: "Organizations",
  robots: { index: false, follow: false },
};

export default async function OrganizationsPage() {
  // Convenience redirect only: the RPCs behind this page refuse to
  // serve anyone who is not the platform operator regardless.
  if (!(await isPlatformOwner())) {
    redirect("/admin");
  }

  const { organizations, error } = await listOrganizations();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Organizations</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate">
          Each organization is a separate logistics company with its own admins and its own
          data. Creating one also provisions its first admin, who can then sign in at{" "}
          <span className="font-data text-ink">/admin</span>.
        </p>
      </div>

      <section className="overflow-hidden rounded-[var(--radius-lg)] border border-hairline bg-surface">
        <div className="border-b border-hairline px-5 py-4">
          <h2 className="font-display text-base font-semibold text-ink">All organizations</h2>
        </div>

        {error ? (
          <p className="px-5 py-6 text-sm text-danger">{error}</p>
        ) : organizations.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate">No organizations yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-hairline font-data text-xs uppercase tracking-[0.1em] text-slate-light">
                  <th className="px-5 py-3 font-medium">Company</th>
                  <th className="px-5 py-3 font-medium">Slug</th>
                  <th className="px-5 py-3 font-medium">Created</th>
                  <th className="px-5 py-3 text-right font-medium">Members</th>
                  <th className="px-5 py-3 text-right font-medium">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {organizations.map((org) => (
                  <tr key={org.id} className="border-b border-hairline last:border-0">
                    <td className="px-5 py-3.5">
                      <span className="flex items-center gap-2 font-medium text-ink">
                        <Building2 size={15} className="text-slate-light" strokeWidth={2} />
                        {org.name}
                        {org.isDefault && (
                          <span className="rounded-[var(--radius-sm)] bg-cargo-tint px-1.5 py-0.5 font-data text-[10px] uppercase tracking-[0.1em] text-cargo">
                            Public site
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-data text-xs text-slate">{org.slug}</td>
                    <td className="px-5 py-3.5 text-slate">
                      {new Date(org.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="inline-flex items-center gap-1.5 text-slate">
                        <Users size={14} className="text-slate-light" strokeWidth={2} />
                        {org.memberCount}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/admin/organizations/${org.id}`}
                        className="text-sm font-medium text-cargo hover:text-cargo-hover"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-[var(--radius-lg)] border border-hairline bg-surface p-6 sm:p-8">
        <h2 className="font-display text-base font-semibold text-ink">Create organization</h2>
        <p className="mt-1 text-sm text-slate">
          Creates the company, then its first admin account in Supabase Auth.
        </p>
        <div className="mt-5">
          <CreateOrganizationForm />
        </div>
      </section>

      <p className="text-xs text-slate-light">
        Organization management is limited to the platform operator.{" "}
        <Link href="/admin" className="font-medium text-cargo hover:text-cargo-hover">
          Back to dashboard
        </Link>
      </p>
    </div>
  );
}
