export function LoadingState() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center gap-4 rounded-[var(--radius-lg)] border border-hairline bg-surface px-8 py-16 text-center"
    >
      <span className="relative flex h-10 w-10 items-center justify-center">
        <span className="absolute h-10 w-10 animate-ping rounded-full bg-cargo-tint" />
        <span className="relative h-3 w-3 rounded-full bg-cargo" />
      </span>
      <p className="font-data text-sm text-slate">Finding your shipment&hellip;</p>
    </div>
  );
}
