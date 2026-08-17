"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { CheckCircle2, Copy } from "lucide-react";
import { createShipmentAction } from "../actions";
import { uploadShipmentImage } from "@/lib/shipments/uploadShipmentImage";

export function NewShipmentForm() {
  const [productDescription, setProductDescription] = useState("");
  const [senderName, setSenderName] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [estimatedDeliveryAt, setEstimatedDeliveryAt] = useState("");
  const [initialLocation, setInitialLocation] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ trackingId: string } | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      let productImagePath: string | null = null;

      if (imageFile) {
        const uploadResult = await uploadShipmentImage(imageFile);
        if (!uploadResult.ok) {
          setError(uploadResult.error);
          setSubmitting(false);
          return;
        }
        productImagePath = uploadResult.path;
      }

      const result = await createShipmentAction({
        productDescription,
        senderName,
        origin,
        destination,
        estimatedDeliveryAt: estimatedDeliveryAt || null,
        initialLocation: initialLocation || null,
        productImagePath,
      });

      if (!result.ok) {
        setError(result.error);
        setSubmitting(false);
        return;
      }

      setCreated({ trackingId: result.trackingId });
    } finally {
      setSubmitting(false);
    }
  }

  if (created) {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-cargo-tint text-cargo">
          <CheckCircle2 size={22} />
        </span>
        <div>
          <p className="font-display text-lg font-semibold text-ink">Shipment created successfully.</p>
          <p className="mt-3 font-data text-xs uppercase tracking-[0.1em] text-slate-light">
            Tracking ID
          </p>
          <p className="mt-1 font-data text-2xl font-semibold text-ink">{created.trackingId}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(created.trackingId)}
            className="inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-sm)] border border-hairline px-4 py-3 text-sm font-medium text-ink hover:bg-surface-sunken"
          >
            <Copy size={14} />
            Copy Tracking ID
          </button>
          <Link
            href={`/admin/shipments/${created.trackingId}`}
            className="inline-flex items-center justify-center rounded-[var(--radius-sm)] bg-signal px-4 py-3 text-sm font-medium text-white hover:bg-signal-hover"
          >
            View Shipment
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <label htmlFor="senderName" className="mb-1.5 block text-sm font-medium text-ink">
          Sender name
        </label>
        <input
          id="senderName"
          required
          value={senderName}
          onChange={(e) => setSenderName(e.target.value)}
          className="w-full rounded-[var(--radius-sm)] border border-hairline bg-surface px-4 py-2.5 text-sm text-ink focus:border-cargo"
        />
      </div>

      <div>
        <label htmlFor="productDescription" className="mb-1.5 block text-sm font-medium text-ink">
          Product description
        </label>
        <input
          id="productDescription"
          required
          value={productDescription}
          onChange={(e) => setProductDescription(e.target.value)}
          className="w-full rounded-[var(--radius-sm)] border border-hairline bg-surface px-4 py-2.5 text-sm text-ink focus:border-cargo"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="origin" className="mb-1.5 block text-sm font-medium text-ink">
            Origin
          </label>
          <input
            id="origin"
            required
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            className="w-full rounded-[var(--radius-sm)] border border-hairline bg-surface px-4 py-2.5 text-sm text-ink focus:border-cargo"
          />
        </div>
        <div>
          <label htmlFor="destination" className="mb-1.5 block text-sm font-medium text-ink">
            Destination
          </label>
          <input
            id="destination"
            required
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full rounded-[var(--radius-sm)] border border-hairline bg-surface px-4 py-2.5 text-sm text-ink focus:border-cargo"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="initialLocation" className="mb-1.5 block text-sm font-medium text-ink">
            Initial location <span className="font-normal text-slate">(optional)</span>
          </label>
          <input
            id="initialLocation"
            value={initialLocation}
            onChange={(e) => setInitialLocation(e.target.value)}
            placeholder="Defaults to origin"
            className="w-full rounded-[var(--radius-sm)] border border-hairline bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-slate-light focus:border-cargo"
          />
        </div>
        <div>
          <label htmlFor="estimatedDeliveryAt" className="mb-1.5 block text-sm font-medium text-ink">
            Estimated delivery <span className="font-normal text-slate">(optional)</span>
          </label>
          <input
            id="estimatedDeliveryAt"
            type="datetime-local"
            value={estimatedDeliveryAt}
            onChange={(e) => setEstimatedDeliveryAt(e.target.value)}
            className="w-full rounded-[var(--radius-sm)] border border-hairline bg-surface px-4 py-2.5 text-sm text-ink focus:border-cargo"
          />
        </div>
      </div>

      <div>
        <label htmlFor="image" className="mb-1.5 block text-sm font-medium text-ink">
          Product image <span className="font-normal text-slate">(optional)</span>
        </label>
        <input
          id="image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
          className="w-full text-sm text-ink file:mr-3 file:rounded-[var(--radius-sm)] file:border-0 file:bg-surface-sunken file:px-3 file:py-2 file:text-sm file:font-medium file:text-ink"
        />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="mt-1 inline-flex items-center justify-center rounded-[var(--radius-sm)] bg-signal px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-signal-hover disabled:opacity-50"
      >
        {submitting ? "Creating…" : "Create Shipment"}
      </button>
    </form>
  );
}
