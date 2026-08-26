"use client";

// Single dispatcher for both GA4 (gtag) and Meta Pixel (fbq) — every tracked
// interaction in the app calls trackEvent() exactly once here, rather than
// each component reaching for window.gtag/window.fbq directly. That's what
// keeps the two systems from ever firing duplicate or diverging events.

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

export type AnalyticsEventName =
  | "page_view"
  | "product_view"
  | "category_view"
  | "price_page_view"
  | "product_search"
  | "product_filter"
  | "laminate_code_search"
  | "laminate_finish_selection"
  | "product_image_view"
  | "whatsapp_click"
  | "quote_modal_open"
  | "boq_file_attached"
  | "quote_request"
  | "contact_submit"
  | "phone_click";

type EventParams = Record<string, string | number | boolean | null | undefined>;

// Only genuine-conversion-shaped events map to a Meta standard event; the
// engagement-only ones (search, filter, image view, category view) stay
// GA-only so Lead/Contact aren't inflated by browsing behavior.
const META_EVENT_MAP: Partial<Record<AnalyticsEventName, string>> = {
  page_view: "PageView",
  product_view: "ViewContent",
  product_search: "Search",
  laminate_code_search: "Search",
  whatsapp_click: "Contact",
  // quote_modal_open and boq_file_attached stay GA-only: they are intent
  // signals partway through the funnel, and mapping them to Lead would
  // inflate Meta's conversion count with people who never submitted.
  quote_request: "Lead",
  contact_submit: "Lead",
};

export function trackEvent(name: AnalyticsEventName, params: EventParams = {}): void {
  if (typeof window === "undefined") return;

  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null));

  window.gtag?.("event", name, clean);

  const metaEvent = META_EVENT_MAP[name];
  if (metaEvent) window.fbq?.("track", metaEvent, clean);
}
