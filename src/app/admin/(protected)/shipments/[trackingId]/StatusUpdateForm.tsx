"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { addTrackingEventAction } from "../actions";
import { uploadShipmentImage } from "@/lib/shipments/uploadShipmentImage";
import { STATUS_LABELS, type ShipmentStatus } from "@/types/shipment";

const STATUS_OPTIONS = Object.entries(STATUS_LABELS) as [ShipmentStatus, string][];

export function StatusUpdateForm({
  shipmentId,
  currentStatus,
  currentLocation,
  requiresAction: initialRequiresAction,
  actionMessage: initialActionMessage,
}: {
  shipmentId: string;
  currentStatus: ShipmentStatus;
  currentLocation: string;
  requiresAction: boolean;
  actionMessage: string;
}) {
  const router = useRouter();

  const [status, setStatus] = useState<ShipmentStatus>(currentStatus);
  const [location, setLocation] = useState(currentLocation);
  const [note, setNote] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [estimatedDeliveryAt, setEstimatedDeliveryAt] = useState("");
  const [clearEstimatedDelivery, setClearEstimatedDelivery] = useState(false);
  const [requiresAction, setRequiresAction] = useState(initialRequiresAction);
  const [actionMessage, setActionMessage] = useState(initialActionMessage);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSubmitting(true);

    try {
      let imagePath: string | null = null;
      if (imageFile) {
        const uploadResult = await uploadShipmentImage(imageFile);
        if (!uploadResult.ok) {
          setError(uploadResult.error);
          setSubmitting(false);
          return;
        }
        imagePath = uploadResult.path;
      }

      const result = await addTrackingEventAction({
        shipmentId,
        status,
        location,
        note: note || null,
        imagePath,
        estimatedDeliveryAt: estimatedDeliveryAt || null,
        clearEstimatedDelivery,
        requiresAction,
        actionMessage: requiresAction ? actionMessage : null,
      });

      if (!result.ok) {
        setError(result.error);
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      setNote("");
      setImageFile(null);
      setEstimatedDeliveryAt("");
      setClearEstimatedDelivery(false);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <label htmlFor="status" className="mb-1.5 block text-sm font-medium text-ink">
          Status
        </label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as ShipmentStatus)}
          className="w-full rounded-[var(--radius-sm)] border border-hairline bg-surface px-4 py-2.5 text-sm text-ink focus:border-cargo"
        >
          {STATUS_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="location" className="mb-1.5 block text-sm font-medium text-ink">
          Location
        </label>
        <input
          id="location"
          required
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full rounded-[var(--radius-sm)] border border-hairline bg-surface px-4 py-2.5 text-sm text-ink focus:border-cargo"
        />
      </div>

      <div>
        <label htmlFor="note" className="mb-1.5 block text-sm font-medium text-ink">
          Note <span className="font-normal text-slate">(optional)</span>
        </label>
        <textarea
          id="note"
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full rounded-[var(--radius-sm)] border border-hairline bg-surface px-4 py-2.5 text-sm text-ink focus:border-cargo"
        />
      </div>

      <div>
        <label htmlFor="eventImage" className="mb-1.5 block text-sm font-medium text-ink">
          Image <span className="font-normal text-slate">(optional)</span>
        </label>
        <input
          id="eventImage"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
          className="w-full text-sm text-ink file:mr-3 file:rounded-[var(--radius-sm)] file:border-0 file:bg-surface-sunken file:px-3 file:py-2 file:text-sm file:font-medium file:text-ink"
        />
      </div>

      <div className="rounded-[var(--radius-md)] border border-hairline p-4">
        <label htmlFor="eta" className="mb-1.5 block text-sm font-medium text-ink">
          Estimated delivery <span className="font-normal text-slate">(optional)</span>
        </label>
        <input
          id="eta"
          type="datetime-local"
          value={estimatedDeliveryAt}
          disabled={clearEstimatedDelivery}
          onChange={(e) => setEstimatedDeliveryAt(e.target.value)}
          className="w-full rounded-[var(--radius-sm)] border border-hairline bg-surface px-4 py-2.5 text-sm text-ink focus:border-cargo disabled:opacity-50"
        />
        <label className="mt-3 flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={clearEstimatedDelivery}
            onChange={(e) => setClearEstimatedDelivery(e.target.checked)}
          />
          Pause / clear the delivery estimate
        </label>
      </div>

      <div className="rounded-[var(--radius-md)] border border-hairline p-4">
        <label className="flex items-center gap-2 text-sm font-medium text-ink">
          <input
            type="checkbox"
            checked={requiresAction}
            onChange={(e) => setRequiresAction(e.target.checked)}
          />
          Requires customer action
        </label>
        {requiresAction && (
          <textarea
            rows={3}
            required
            value={actionMessage}
            onChange={(e) => setActionMessage(e.target.value)}
            placeholder="Message shown to the customer on the tracking page"
            className="mt-3 w-full rounded-[var(--radius-sm)] border border-hairline bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-slate-light focus:border-cargo"
          />
        )}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      {success && <p className="text-sm text-cargo">Update saved.</p>}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center justify-center rounded-[var(--radius-sm)] bg-signal px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-signal-hover disabled:opacity-50"
      >
        {submitting ? "Saving…" : "Save Update"}
      </button>
    </form>
  );
}
