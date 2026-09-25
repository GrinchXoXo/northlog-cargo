"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, Package, LayoutDashboard, PackagePlus, Settings, MessageCircle, Building2 } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SITE_SHORT_NAME } from "@/lib/constants";
import { SignOutButton } from "./SignOutButton";

const BASE_NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/shipments", label: "Shipments", icon: Package },
  { href: "/admin/shipments/new", label: "Create Shipment", icon: PackagePlus },
  { href: "/admin/support", label: "Support", icon: MessageCircle },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminHeader({
  userEmail,
  showOrganizations = false,
}: {
  userEmail: string;
  showOrganizations?: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const NAV = showOrganizations
    ? [...BASE_NAV, { href: "/admin/organizations", label: "Organizations", icon: Building2 }]
    : BASE_NAV;

  return (
    <header className="sticky top-0 z-50 border-b border-hairline bg-surface">
      <Container className="flex h-16 items-center justify-between">
        <Link
          href="/admin"
          className="flex items-center gap-2 font-display text-base font-semibold text-ink"
          onClick={() => setOpen(false)}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-cargo text-white">
            <Package size={16} strokeWidth={2.25} />
          </span>
          {SITE_SHORT_NAME} Admin
        </Link>

        <nav className="hidden md:flex items-center gap-1" aria-label="Admin">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-medium ${
                  active ? "bg-cargo-tint text-cargo" : "text-ink hover:bg-surface-sunken"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={15} strokeWidth={2} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <span className="text-xs text-slate">{userEmail}</span>
          <SignOutButton />
        </div>

        <button
          type="button"
          className="md:hidden inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] text-ink"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </Container>

      {open && (
        <div className="md:hidden border-t border-hairline bg-surface">
          <Container className="flex flex-col gap-1 py-4">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`inline-flex items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-3 text-base font-medium ${
                    active ? "bg-cargo-tint text-cargo" : "text-ink hover:bg-surface-sunken"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon size={17} strokeWidth={2} />
                  {item.label}
                </Link>
              );
            })}
            <div className="mt-2 flex items-center justify-between border-t border-hairline pt-4">
              <span className="text-xs text-slate">{userEmail}</span>
              <SignOutButton />
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
