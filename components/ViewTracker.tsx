"use client";

import { useEffect, useRef } from "react";
import { trackEvent, type AnalyticsEventName } from "@/lib/analytics";

type EventParams = Record<string, string | number | boolean | null | undefined>;

// Fires one analytics event on mount — for view-type events (product_view,
// category_view) that belong on server components, which can't call
// trackEvent themselves. Keyed on `dedupeKey` so client-side navigations
// between two pages using the same component instance still re-fire.
export function ViewTracker({ event, params, dedupeKey }: { event: AnalyticsEventName; params: EventParams; dedupeKey: string }) {
  const lastKey = useRef<string | null>(null);

  useEffect(() => {
    if (lastKey.current === dedupeKey) return;
    lastKey.current = dedupeKey;
    trackEvent(event, params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dedupeKey]);

  return null;
}
