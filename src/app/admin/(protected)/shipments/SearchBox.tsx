"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function SearchBox({ initialValue = "", basePath = "/admin/shipments" }: { initialValue?: string; basePath?: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    router.push(trimmed ? `${basePath}?q=${encodeURIComponent(trimmed)}` : basePath);
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-sm gap-2">
      <div className="relative flex-1">
        <Search
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-light"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search tracking ID or sender"
          className="w-full rounded-[var(--radius-sm)] border border-hairline bg-surface py-2 pl-9 pr-3 text-sm text-ink focus:border-cargo"
        />
      </div>
      <button
        type="submit"
        className="rounded-[var(--radius-sm)] border border-hairline px-4 py-2 text-sm font-medium text-ink hover:bg-surface-sunken"
      >
        Search
      </button>
    </form>
  );
}
