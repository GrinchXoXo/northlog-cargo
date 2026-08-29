import type { Metadata } from "next";
import { Compass, HandHeart, Radar } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "About",
  description: `Learn about ${SITE_NAME}, our approach to logistics, and how we keep shipments visible from pickup to delivery.`,
};

const VALUES = [
  {
    icon: Compass,
    title: "Clear over clever",
    description:
      "A customer should always be able to answer 'where is my package?' without calling us. Every status update exists for that reason.",
  },
  {
    icon: Radar,
    title: "Honest visibility",
    description:
      "We show the last known location and status we actually have: not a simulated live position we can't back up.",
  },
  {
    icon: HandHeart,
    title: "A small team, directly reachable",
    description:
      "Questions about a shipment reach the people handling it, not an automated queue.",
  },
];

export default function AboutPage() {
  return (
    <>
      <Section className="pb-0 sm:pb-0 lg:pb-0">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHeading eyebrow="About Us" title={`Who ${SITE_NAME} is`} />
            <p className="mt-6 text-base leading-relaxed text-slate">
              {SITE_NAME} is a logistics company that moves shipments between
              origin and destination and gives each one a tracking ID,
              a status history, and a last known location: from the moment
              a package is received to the moment it&apos;s delivered.
            </p>
            <p className="mt-4 text-base leading-relaxed text-slate">
              [COMPANY BACKGROUND: add founding story, operational
              history, and coverage details once confirmed.]
            </p>
          </div>
          <div className="overflow-hidden rounded-[var(--radius-lg)] border border-hairline">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/about-cover.svg"
              alt="Illustration of a freight yard with cranes and stacked containers"
              className="w-full"
            />
          </div>
        </div>
      </Section>

      <Section>
        <SectionHeading
          eyebrow="How We Operate"
          title="What guides our day-to-day"
          align="center"
        />
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {VALUES.map((value) => {
            const Icon = value.icon;
            return (
              <div key={value.title} className="rounded-[var(--radius-lg)] border border-hairline bg-surface p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] bg-cargo-tint text-cargo">
                  <Icon size={18} strokeWidth={2} />
                </span>
                <h3 className="mt-4 font-display text-base font-semibold text-ink">{value.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate">{value.description}</p>
              </div>
            );
          })}
        </div>
      </Section>

      <Section className="bg-surface border-t border-hairline">
        <SectionHeading eyebrow="Where We Operate" title="Operational coverage" />
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate">
          [OPERATIONAL COVERAGE: list confirmed origin/destination regions
          and service areas once supplied by the company.]
        </p>
      </Section>
    </>
  );
}
