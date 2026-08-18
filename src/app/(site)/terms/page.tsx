import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";
import { SITE_NAME, CONTACT } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Terms",
  description: `Terms of use for the ${SITE_NAME} website and tracking service.`,
};

export default function TermsPage() {
  return (
    <Section containerClassName="max-w-2xl">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Terms</h1>
      <p className="mt-3 text-sm text-slate">Last updated August 2026.</p>

      <div className="mt-8 flex flex-col gap-6 text-sm leading-relaxed text-slate">
        <p>
          These terms cover your use of the {SITE_NAME} website and its
          shipment tracking service.
        </p>

        <div>
          <h2 className="font-display text-lg font-semibold text-ink mb-2">Using this site</h2>
          <p>
            This website provides company information and a shipment
            tracking lookup. Tracking results reflect the most recent
            status and location on record. Estimated delivery dates are
            estimates, not guaranteed delivery commitments.
          </p>
        </div>

        <div>
          <h2 className="font-display text-lg font-semibold text-ink mb-2">Accuracy</h2>
          <p>
            We aim to keep shipment information accurate and current, but
            operational delays can mean the tracking page does not yet
            reflect the very latest status. Contact us if something looks
            wrong.
          </p>
        </div>

        <div>
          <h2 className="font-display text-lg font-semibold text-ink mb-2">Contact</h2>
          <p>
            Questions about these terms can be sent to{" "}
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
