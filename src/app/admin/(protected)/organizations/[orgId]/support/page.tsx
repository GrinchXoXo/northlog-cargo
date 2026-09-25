import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { resolveOrgContext } from "@/lib/platform/orgContext";
import { listOrgConversations } from "@/lib/platform/orgData";
import { SupportListView } from "@/components/admin/SupportListView";

export const metadata: Metadata = {
  title: "Support",
  robots: { index: false, follow: false },
};

export default async function OrgContextSupportPage({
  params,
}: PageProps<"/admin/organizations/[orgId]/support">) {
  const { orgId } = await params;
  const org = await resolveOrgContext(orgId);
  if (!org) notFound();

  const { conversations, error } = await listOrgConversations(org.id);

  return <SupportListView conversations={conversations} error={error} basePath={`/admin/organizations/${org.id}/support`} />;
}
