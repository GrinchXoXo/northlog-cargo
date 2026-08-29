import type { Metadata } from "next";
import { Suspense } from "react";
import { Section } from "@/components/ui/Section";
import { TrackingExperience } from "@/components/tracking/TrackingExperience";

export const metadata: Metadata = {
  title: "Track Your Shipment",
  description:
    "Enter your tracking ID to view your shipment's latest status, location and estimated delivery.",
};

export default function TrackingPage() {
  return (
    <Section containerClassName="max-w-3xl">
      <div className="text-center">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-ink">
          Track Your Shipment
        </h1>
        <p className="mt-4 text-base text-slate">
          Enter your tracking ID to view your shipment&apos;s latest status,
          location and estimated delivery.
        </p>
      </div>

      <div className="mt-10">
        <Suspense fallback={null}>
          <TrackingExperience />
        </Suspense>
      </div>
    </Section>
  );
}
