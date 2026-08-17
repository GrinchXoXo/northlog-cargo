import Link from "next/link";
import { Package } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { CONTACT, NAV_LINKS, SITE_NAME, SITE_SHORT_NAME } from "@/lib/constants";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-hairline bg-surface">
      <Container className="py-14 sm:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
              <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-cargo text-white">
                <Package size={17} strokeWidth={2.25} />
              </span>
              {SITE_SHORT_NAME}
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate">
              {SITE_NAME} moves freight between origin and destination with a
              clear, trackable record from pickup to delivery.
            </p>
          </div>

          <div>
            <h3 className="font-data text-xs uppercase tracking-[0.14em] text-slate-light mb-4">
              Navigate
            </h3>
            <ul className="space-y-3">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-ink hover:text-cargo">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-data text-xs uppercase tracking-[0.14em] text-slate-light mb-4">
              Contact
            </h3>
            <ul className="space-y-3 text-sm text-ink">
              <li>
                <a href={CONTACT.emailHref} className="hover:text-cargo">
                  {CONTACT.email}
                </a>
              </li>
              <li>
                <a
                  href={CONTACT.telegramHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-cargo"
                >
                  {CONTACT.telegramLabel}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col-reverse gap-4 border-t border-hairline pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate">
            &copy; {year} {SITE_NAME}. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="text-xs text-slate hover:text-cargo">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-xs text-slate hover:text-cargo">
              Terms
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
