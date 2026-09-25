import type { Metadata } from "next";
import { SettingsView } from "@/components/admin/SettingsView";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

export default function OrgContextSettingsPage() {
  return <SettingsView />;
}
