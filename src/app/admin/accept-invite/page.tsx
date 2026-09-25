import type { Metadata } from "next";
import { AcceptInviteForm } from "./AcceptInviteForm";

export const metadata: Metadata = {
  title: "Accept Invitation",
  robots: { index: false, follow: false },
};

export default function AcceptInvitePage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm rounded-[var(--radius-lg)] border border-hairline bg-surface p-8">
        <h1 className="font-display text-xl font-semibold text-ink">Accept your invitation</h1>
        <p className="mt-1 text-sm text-slate">
          Choose a password to finish setting up your account.
        </p>
        <div className="mt-6">
          <AcceptInviteForm />
        </div>
      </div>
    </div>
  );
}
