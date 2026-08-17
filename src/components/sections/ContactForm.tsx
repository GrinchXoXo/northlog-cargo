"use client";

import { useState, type FormEvent } from "react";
import { Info } from "lucide-react";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-hairline bg-cargo-tint p-6 text-sm text-cargo">
        Thanks: this form is a frontend preview and isn&apos;t connected to
        our inbox yet, so nothing was actually sent. Please reach us using
        the details on this page in the meantime.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex items-start gap-2 rounded-[var(--radius-sm)] border border-hairline bg-surface-sunken px-4 py-3 text-xs text-slate">
        <Info size={15} className="mt-0.5 shrink-0" />
        <p>
          This form is a preview and does not send messages yet. Please use
          the phone or email above for now.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-ink">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="w-full rounded-[var(--radius-sm)] border border-hairline bg-surface px-4 py-2.5 text-sm text-ink focus:border-cargo"
          />
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-[var(--radius-sm)] border border-hairline bg-surface px-4 py-2.5 text-sm text-ink focus:border-cargo"
          />
        </div>
      </div>

      <div>
        <label htmlFor="tracking-id-optional" className="mb-1.5 block text-sm font-medium text-ink">
          Tracking ID <span className="font-normal text-slate">(optional)</span>
        </label>
        <input
          id="tracking-id-optional"
          name="trackingId"
          type="text"
          placeholder="e.g. NMX-842731"
          className="w-full rounded-[var(--radius-sm)] border border-hairline bg-surface px-4 py-2.5 font-data text-sm text-ink placeholder:font-body focus:border-cargo"
        />
      </div>

      <div>
        <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-ink">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          className="w-full rounded-[var(--radius-sm)] border border-hairline bg-surface px-4 py-2.5 text-sm text-ink focus:border-cargo"
        />
      </div>

      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-[var(--radius-sm)] bg-signal px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-signal-hover"
      >
        Send Message
      </button>
    </form>
  );
}
