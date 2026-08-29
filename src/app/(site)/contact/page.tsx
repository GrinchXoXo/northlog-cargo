import type { Metadata } from "next";
import { Mail, Send } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ContactForm } from "@/components/sections/ContactForm";
import { CONTACT, SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Contact",
  description: `Get in touch with ${SITE_NAME} by email, Telegram, or the contact form.`,
};

const DETAILS = [
  { icon: Mail, label: "Email", value: CONTACT.email, href: CONTACT.emailHref, external: false },
  {
    icon: Send,
    label: "Telegram",
    value: CONTACT.telegramLabel,
    href: CONTACT.telegramHref,
    external: true,
  },
];

export default function ContactPage() {
  return (
    <Section>
      <SectionHeading
        eyebrow="Contact"
        title="Get in touch"
        description="Need help with a shipment? Reach us by email or Telegram, or send a message below."
      />

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-5">
        <div className="lg:col-span-2 flex flex-col gap-4">
          {DETAILS.map((detail) => {
            const Icon = detail.icon;
            return (
              <a
                key={detail.label}
                href={detail.href}
                target={detail.external ? "_blank" : undefined}
                rel={detail.external ? "noopener noreferrer" : undefined}
                className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-hairline bg-surface p-5 hover:border-cargo"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-cargo-tint text-cargo">
                  <Icon size={16} strokeWidth={2.25} />
                </span>
                <div>
                  <p className="font-data text-xs uppercase tracking-[0.1em] text-slate-light">
                    {detail.label}
                  </p>
                  <p className="mt-1 text-sm text-ink">{detail.value}</p>
                </div>
              </a>
            );
          })}
        </div>

        <div className="lg:col-span-3 rounded-[var(--radius-lg)] border border-hairline bg-surface p-6 sm:p-8">
          <h2 className="font-display text-lg font-semibold text-ink mb-6">Send us a message</h2>
          <ContactForm />
        </div>
      </div>
    </Section>
  );
}
