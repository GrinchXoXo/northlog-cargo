import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { resolveOrgContext } from "@/lib/platform/orgContext";
import { getOrgConversation } from "@/lib/platform/orgData";
import { ConversationPanel } from "@/app/admin/(protected)/support/[id]/ConversationPanel";

export const metadata: Metadata = {
  title: "Conversation",
  robots: { index: false, follow: false },
};

export default async function OrgContextConversationPage({
  params,
}: PageProps<"/admin/organizations/[orgId]/support/[id]">) {
  const { orgId, id } = await params;
  const org = await resolveOrgContext(orgId);
  if (!org) notFound();

  const result = await getOrgConversation(org.id, id);
  if ("error" in result) {
    notFound();
  }

  return <ConversationPanel conversation={result.conversation} readOnly />;
}
