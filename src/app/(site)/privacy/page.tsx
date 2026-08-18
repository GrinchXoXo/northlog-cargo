import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";
import { SITE_NAME, CONTACT } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${SITE_NAME} handles information submitted through this website.`,
};

export default function PrivacyPage() {
  return (
    <Section containerClassName="max-w-2xl">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
        Privacy Policy
      </h1>
      <p className="mt-3 text-sm text-slate">Last updated August 2026.</p>

      <div className="mt-8 flex flex-col gap-6 text-sm leading-relaxed text-slate">
        <p>
          This page explains, in plain terms, what information {SITE_NAME}
          collects through this website and how it is used.
        </p>

        <div>
          <h2 className="font-display text-lg font-semibold text-ink mb-2">
            Information we collect
          </h2>
          <p>
            When you use the tracking page, we look up the shipment
            associated with the tracking ID you enter. When you contact us,
            we receive whatever information you choose to include, such as
            your name, email address, and message.
          </p>
        </div>

        <div>
          <h2 className="font-display text-lg font-semibold text-ink mb-2">How we use it</h2>
          <p>
            Shipment information is used to answer tracking requests.
            Contact information is used to respond to your enquiry. We do
            not sell shipment or contact information to third parties.
          </p>
        </div>

        <div>
          <h2 className="font-display text-lg font-semibold text-ink mb-2">
            Shipment tracking data
          </h2>
          <p>
            The public tracking page only shows information that is
            intended to be publicly visible to anyone with the tracking ID,
            such as status, location, and estimated delivery. Internal
            operational details are not exposed publicly.
          </p>
        </div>

        <div>
          <h2 className="font-display text-lg font-semibold text-ink mb-2">Contact</h2>
          <p>
            Questions about this policy can be sent to{" "}
            <a href={CONTACT.emailHref} className="text-cargo hover:text-cargo-hover">
              {CONTACT.email}
            </a>
            .
          </p>
        </div>
      </div>
    </Section>
  );
}
