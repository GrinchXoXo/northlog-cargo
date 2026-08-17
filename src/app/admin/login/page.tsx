import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Admin Login",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm rounded-[var(--radius-lg)] border border-hairline bg-surface p-8">
        <h1 className="font-display text-xl font-semibold text-ink">Administrator Login</h1>
        <p className="mt-2 text-sm text-slate">
          Sign in to manage shipments.
        </p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
