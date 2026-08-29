import type { Service } from "@/data/services";

export function ServiceCard({ service }: { service: Service }) {
  const Icon = service.icon;
  return (
    <div className="rounded-[var(--radius-lg)] border border-hairline bg-surface p-6 sm:p-7">
      <span className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] bg-cargo-tint text-cargo">
        <Icon size={20} strokeWidth={2} />
      </span>
      <h3 className="mt-5 font-display text-lg font-semibold text-ink">{service.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate">{service.description}</p>
      <p className="mt-4 font-data text-xs uppercase tracking-[0.1em] text-slate-light">
        {service.coverage}
      </p>
    </div>
  );
}
