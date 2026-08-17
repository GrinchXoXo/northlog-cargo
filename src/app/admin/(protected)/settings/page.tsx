import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ConnectTelegramCard } from "./ConnectTelegramCard";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let connection: { username: string | null; linkedAt: string } | null = null;

  if (user) {
    const { data } = await supabase
      .from("telegram_accounts")
      .select("telegram_username, linked_at")
      .eq("admin_id", user.id)
      .eq("active", true)
      .maybeSingle();

    if (data) {
      connection = { username: data.telegram_username as string | null, linkedAt: data.linked_at as string };
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-semibold text-ink">Settings</h1>
      <ConnectTelegramCard initialConnection={connection} />
    </div>
  );
}
