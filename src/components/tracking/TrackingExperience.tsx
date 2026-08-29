"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { trackShipmentAction } from "@/app/(site)/tracking/actions";
import type { TrackingLookupResult } from "@/types/shipment";
import { TrackingForm } from "./TrackingForm";
import { LoadingState } from "./LoadingState";
import { NotFoundState, ServerErrorState } from "./ErrorState";
import { TrackingResult } from "./TrackingResult";

interface Resolved {
  trackingId: string;
  result: TrackingLookupResult;
}

export function TrackingExperience() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryId = searchParams.get("id") ?? "";

  const [resolved, setResolved] = useState<Resolved | null>(null);

  useEffect(() => {
    if (!queryId) return;

    let cancelled = false;

    trackShipmentAction(queryId)
      .then((result) => {
        if (!cancelled) {
          setResolved({ trackingId: queryId, result });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResolved({ trackingId: queryId, result: { state: "error" } });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [queryId]);

  const isLoading = Boolean(queryId) && resolved?.trackingId !== queryId;

  function handleSubmit(trackingId: string) {
    router.push(`/tracking?id=${encodeURIComponent(trackingId)}`);
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="rounded-[var(--radius-lg)] border border-hairline bg-surface p-6 sm:p-8">
        <TrackingForm onSubmit={handleSubmit} initialValue={queryId} size="lg" />
      </div>

      {isLoading && <LoadingState />}

      {!isLoading && resolved?.trackingId === queryId && resolved.result.state === "success" && (
        <TrackingResult shipment={resolved.result.shipment} />
      )}

      {!isLoading && resolved?.trackingId === queryId && resolved.result.state === "not_found" && (
        <NotFoundState trackingId={resolved.trackingId} />
      )}

      {!isLoading && resolved?.trackingId === queryId && resolved.result.state === "error" && (
        <ServerErrorState />
      )}
    </div>
  );
}
