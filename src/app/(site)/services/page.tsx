import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ServiceCard } from "@/components/sections/ServiceCard";
import { ContactSupport } from "@/components/tracking/ContactSupport";
import { SERVICES } from "@/data/services";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Services",
  description: `Logistics and shipping services offered by ${SITE_NAME}, including freight forwarding, consolidated shipping and shipment tracking.`,
};

export default function ServicesPage() {
  return (
    <>
      <Section className="pb-0 sm:pb-0 lg:pb-0" containerClassName="max-w-2xl">
        <SectionHeading
          eyebrow="Services"
          title="Logistics services"
          description="An overview of what we handle for our customers, from pickup through to delivery. Coverage details are placeholders pending confirmation."
        />
      </Section>

      <Section>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {SERVICES.map((service) => (
            <ServiceCard key={service.title} service={service} />
          ))}
        </div>
      </Section>

      <Section className="bg-surface border-t border-hairline">
        <ContactSupport />
      </Section>
    </>
  );
}
