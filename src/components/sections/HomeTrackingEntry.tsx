"use client";

import { useRouter } from "next/navigation";
import { Section } from "@/components/ui/Section";
import { TrackingForm } from "@/components/tracking/TrackingForm";

export function HomeTrackingEntry() {
  const router = useRouter();

  function handleSubmit(trackingId: string) {
    router.push(`/tracking?id=${encodeURIComponent(trackingId)}`);
  }

  return (
    <Section className="bg-surface border-b border-hairline" containerClassName="max-w-3xl">
      <div className="text-center">
        <h2 className="font-display text-2xl sm:text-3xl font-semibold text-ink">
          Track Your Shipment
        </h2>
        <p className="mt-3 text-sm sm:text-base text-slate">
          Enter your tracking number to view the latest shipment status and
          delivery information.
        </p>
      </div>
      <div className="mt-8">
        <TrackingForm onSubmit={handleSubmit} size="lg" />
      </div>
    </Section>
  );
}
