import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ClipboardCheck, MapPinned, History, ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { ServiceCard } from "@/components/sections/ServiceCard";
import { HomeTrackingEntry } from "@/components/sections/HomeTrackingEntry";
import { SERVICES } from "@/data/services";
import { SITE_TAGLINE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Home",
  description:
    "A logistics company offering freight forwarding and shipment tracking, with a tracking ID and live status for every shipment.",
};

const HIGHLIGHTS = [
  {
    icon: ClipboardCheck,
    title: "A tracking ID for every shipment",
    description: "Every shipment we handle gets a unique ID the moment it's created.",
  },
  {
    icon: History,
    title: "A clear status history",
    description: "Every status change is logged and kept: nothing is overwritten.",
  },
  {
    icon: MapPinned,
    title: "Last known location, plainly stated",
    description: "We show what we actually know, and when it was last updated.",
  },
  {
    icon: ShieldCheck,
    title: "A support team you can reach",
    description: "Questions about a shipment go to a real person, not a queue.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-hairline bg-canvas">
        <Container className="grid grid-cols-1 items-center gap-12 py-16 sm:py-20 lg:grid-cols-2 lg:py-28">
          <div>
            <p className="font-data text-xs uppercase tracking-[0.18em] text-cargo mb-4">
              Freight &amp; Shipment Tracking
            </p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.25rem] font-semibold tracking-tight text-ink text-balance leading-[1.08]">
              {SITE_TAGLINE}
            </h1>
            <p className="mt-6 max-w-lg text-base sm:text-lg leading-relaxed text-slate">
              We move freight from origin to destination and give every
              shipment a tracking ID, a status history, and a last known
              location you can check any time.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button href="/tracking" size="lg" icon={<ArrowRight size={18} />}>
                Track Your Shipment
              </Button>
              <Button href="/contact" variant="ghost" size="lg">
                Contact Support
              </Button>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="overflow-hidden rounded-[var(--radius-lg)] shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/hero-cargo.jfif"
                alt="Illustration of stacked shipping containers with a tracked shipment status card"
                className="w-full"
              />
            </div>
          </div>
        </Container>
      </section>

      {/* Tracking entry */}
      <HomeTrackingEntry />

      {/* Highlights */}
      <Section>
        <SectionHeading
          eyebrow="Why ship with us"
          title="Visibility, from pickup to delivery"
          description="We keep the process simple for our team so the experience stays clear for you."
        />
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {HIGHLIGHTS.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="rounded-[var(--radius-lg)] border border-hairline bg-surface p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] bg-cargo-tint text-cargo">
                  <Icon size={18} strokeWidth={2} />
                </span>
                <h3 className="mt-4 font-display text-base font-semibold text-ink">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate">{item.description}</p>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Services teaser */}
      <Section className="bg-surface border-y border-hairline">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading eyebrow="What we do" title="Our services" />
          <Link
            href="/services"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-cargo hover:text-cargo-hover"
          >
            View all services
            <ArrowRight size={15} />
          </Link>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((service) => (
            <ServiceCard key={service.title} service={service} />
          ))}
        </div>
      </Section>

      {/* Contact CTA */}
      <Section>
        <div className="flex flex-col items-start gap-6 rounded-[var(--radius-lg)] bg-cargo p-8 text-white sm:flex-row sm:items-center sm:justify-between sm:p-12">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-balance">
              Have a shipment to send, or a question about one?
            </h2>
            <p className="mt-3 max-w-lg text-sm sm:text-base text-white/80">
              Reach out and our team will get back to you, or check an
              existing shipment&apos;s status right now.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button href="/contact" variant="primary" size="lg">
              Contact Us
            </Button>
            <Button href="/tracking" variant="ghost" size="lg" className="!border-white/30 !text-white hover:!bg-white/10">
              Track Shipment
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
