import type { Metadata } from "next";
import { listConversations } from "@/lib/chat/admin";
import { SupportListView } from "@/components/admin/SupportListView";

export const metadata: Metadata = {
  title: "Support",
  robots: { index: false, follow: false },
};

export default async function AdminSupportPage() {
  const { conversations, error } = await listConversations();

  return <SupportListView conversations={conversations} error={error} basePath="/admin/support" />;
}
