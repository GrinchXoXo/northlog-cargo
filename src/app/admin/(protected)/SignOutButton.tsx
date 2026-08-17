"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="inline-flex items-center justify-center rounded-[var(--radius-sm)] border border-hairline px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-surface-sunken"
    >
      Sign Out
    </button>
  );
}
