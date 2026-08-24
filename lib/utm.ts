"use client";

// Session-scoped UTM attribution: captured once off the landing URL, kept in
// sessionStorage (survives in-app navigation, dies with the tab — this is a
// single-visit ad-click-to-enquiry funnel, not cross-session tracking), then
// read back when an inquiry is logged so the lead carries its campaign back.

const STORAGE_KEY = "e8x4_utm";

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;
type UtmKey = (typeof UTM_KEYS)[number];

export type UtmParams = Partial<Record<UtmKey, string>> & { landing_path?: string };

export function captureUtmFromLocation(): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);

  const found: UtmParams = {};
  let any = false;
  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (value) {
      found[key] = value;
      any = true;
    }
  }
  if (!any) return;

  found.landing_path = window.location.pathname;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(found));
  } catch {
    // Storage unavailable (private mode, quota) — attribution is best-effort.
  }
}

export function getStoredUtm(): UtmParams {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UtmParams) : {};
  } catch {
    return {};
  }
}
