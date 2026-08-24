"use client";

import type { CSSProperties, ReactNode } from "react";
import { trackEvent } from "@/lib/analytics";
import { PHONE_TEL } from "@/lib/contact";

// Client wrapper for `tel:` links in server components — mirrors
// WhatsAppTrackedLink, fires phone_click on click.
export function TrackedTelLink({
  source,
  className,
  style,
  children,
}: {
  source: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <a href={`tel:${PHONE_TEL}`} className={className} style={style} onClick={() => trackEvent("phone_click", { source })}>
      {children}
    </a>
  );
}
