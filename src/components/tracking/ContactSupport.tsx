import { MessageCircleQuestion } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function ContactSupport({
  variant = "block",
}: {
  variant?: "block" | "inline";
}) {
  if (variant === "inline") {
    return (
      <Button href="/contact" variant="ghost" size="md" icon={<MessageCircleQuestion size={16} />}>
        Contact Support
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-start gap-3 rounded-[var(--radius-md)] border border-hairline bg-surface-sunken p-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-display text-base font-semibold text-ink">Need help with a shipment?</p>
        <p className="mt-1 text-sm text-slate">
          Our support team can look into a status, location, or delivery question.
        </p>
      </div>
      <Button href="/contact" variant="secondary" size="md" icon={<MessageCircleQuestion size={16} />}>
        Contact Support
      </Button>
    </div>
  );
}
