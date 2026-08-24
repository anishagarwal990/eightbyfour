"use client";

import type { CSSProperties, ReactNode } from "react";
import { trackEvent } from "@/lib/analytics";

type EventParams = Record<string, string | number | boolean | null | undefined>;

// Thin client wrapper so WhatsApp CTAs living in server components (brand
// pages, contact page, footer) can still fire whatsapp_click — a raw onClick
// can't be attached to a DOM element rendered from a Server Component.
export function WhatsAppTrackedLink({
  href,
  source,
  context,
  className,
  style,
  children,
}: {
  href: string;
  source: string;
  /** Extra metadata (product_id, product_name, brand, category…) merged into the event. */
  context?: EventParams;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      style={style}
      onClick={() => trackEvent("whatsapp_click", { source, ...context })}
    >
      {children}
    </a>
  );
}
