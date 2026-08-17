import type { Metadata } from "next";
import { NewShipmentForm } from "./NewShipmentForm";

export const metadata: Metadata = {
  title: "Create Shipment",
  robots: { index: false, follow: false },
};

export default function NewShipmentPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl font-semibold text-ink">Create Shipment</h1>
      <p className="mt-2 text-sm text-slate">
        The tracking ID is generated automatically once the shipment is created.
      </p>

      <div className="mt-8 rounded-[var(--radius-lg)] border border-hairline bg-surface p-6 sm:p-8">
        <NewShipmentForm />
      </div>
    </div>
  );
}
