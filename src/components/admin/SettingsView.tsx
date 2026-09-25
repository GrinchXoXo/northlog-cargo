/**
 * The settings body, shared by the organization admin's settings page
 * and the platform owner's organization-context view. There are no
 * settings yet, so there is nothing tenant-specific to parameterize —
 * one component, both routes.
 */
export function SettingsView() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-semibold text-ink">Settings</h1>
      <div className="rounded-[var(--radius-lg)] border border-hairline bg-surface p-6 sm:p-8">
        <p className="text-sm text-slate">No settings are available yet.</p>
      </div>
    </div>
  );
}
