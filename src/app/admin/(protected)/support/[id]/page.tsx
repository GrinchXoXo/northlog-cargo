import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getConversationForAdmin } from "@/lib/chat/admin";
import { ConversationPanel } from "./ConversationPanel";

export const metadata: Metadata = {
  title: "Conversation",
  robots: { index: false, follow: false },
};

export default async function AdminConversationPage({
  params,
}: PageProps<"/admin/support/[id]">) {
  const { id } = await params;
  const result = await getConversationForAdmin(id);

  if ("error" in result) {
    notFound();
  }

  return <ConversationPanel conversation={result.conversation} />;
}
