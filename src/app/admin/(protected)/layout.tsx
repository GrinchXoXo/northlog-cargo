import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isPlatformOwner } from "@/lib/platform/isPlatformOwner";
import { AdminHeader } from "./AdminHeader";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  // Only the platform operator sees the organization-management link.
  // Purely presentational: /admin/organizations and every RPC behind it
  // enforce the same check server-side.
  const showOrganizations = await isPlatformOwner();

  return (
    <div className="min-h-screen bg-canvas">
      <AdminHeader userEmail={user.email ?? ""} showOrganizations={showOrganizations} />
      <main className="mx-auto max-w-6xl px-5 py-8 sm:py-10">{children}</main>
    </div>
  );
}
