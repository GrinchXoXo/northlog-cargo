"use client";

import { useState, type FormEvent } from "react";
import { Search } from "lucide-react";

export function TrackingForm({
  onSubmit,
  initialValue = "",
  size = "md",
}: {
  onSubmit: (trackingId: string) => void;
  initialValue?: string;
  size?: "md" | "lg";
}) {
  const [value, setValue] = useState(initialValue);
  const [touched, setTouched] = useState(false);

  const isEmpty = value.trim().length === 0;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (isEmpty) return;
    onSubmit(value.trim());
  }

  const inputPadding = size === "lg" ? "py-4 text-base" : "py-3 text-sm";

  return (
    <form onSubmit={handleSubmit} noValidate className="w-full">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label htmlFor="tracking-id" className="sr-only">
            Tracking ID
          </label>
          <input
            id="tracking-id"
            name="trackingId"
            type="text"
            inputMode="text"
            autoComplete="off"
            maxLength={64}
            placeholder="e.g. NMX-842731"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            aria-invalid={touched && isEmpty}
            aria-describedby={touched && isEmpty ? "tracking-id-error" : undefined}
            className={`w-full rounded-[var(--radius-sm)] border bg-surface px-4 font-data tracking-wide text-ink placeholder:text-slate-light placeholder:font-body placeholder:tracking-normal focus:border-cargo ${inputPadding} ${
              touched && isEmpty ? "border-danger" : "border-hairline"
            }`}
          />
          {touched && isEmpty && (
            <p id="tracking-id-error" className="mt-2 text-sm text-danger">
              Enter a tracking ID to continue.
            </p>
          )}
        </div>
        <button
          type="submit"
          className={`inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-signal font-medium text-white transition-colors hover:bg-signal-hover ${
            size === "lg" ? "px-7 py-4 text-base" : "px-6 py-3 text-sm"
          }`}
        >
          <Search size={17} strokeWidth={2.25} />
          Track Shipment
        </button>
      </div>
    </form>
  );
}
