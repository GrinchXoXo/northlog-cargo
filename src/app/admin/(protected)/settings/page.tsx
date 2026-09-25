import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-semibold text-ink">Settings</h1>
      <div className="rounded-[var(--radius-lg)] border border-hairline bg-surface p-6 sm:p-8">
        <p className="text-sm text-slate">No settings are available yet.</p>
      </div>
    </div>
  );
}
