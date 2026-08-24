"use client";

import { useEffect } from "react";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { captureUtmFromLocation } from "@/lib/utm";
import { trackEvent } from "@/lib/analytics";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

// Mounted once in the root layout. No-ops entirely if neither env var is
// set, so this is safe to ship before either account exists — set
// NEXT_PUBLIC_GA_ID / NEXT_PUBLIC_META_PIXEL_ID to switch each one on.
export function MarketingTracking() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    captureUtmFromLocation();
  }, [searchParams]);

  useEffect(() => {
    // GA4's config below is initialized with send_page_view: false, and the
    // Meta Pixel init snippet deliberately doesn't call `fbq('track',
    // 'PageView')` itself — this is the single place page_view/PageView
    // fires, so route changes can't double-count on either platform.
    trackEvent("page_view", {
      page_path: pathname,
      page_location: typeof window !== "undefined" ? window.location.href : undefined,
    });
  }, [pathname]);

  return (
    <>
      {GA_ID ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              gtag('config', '${GA_ID}', { send_page_view: false });
            `}
          </Script>
        </>
      ) : null}
      {META_PIXEL_ID ? (
        <Script id="meta-pixel-init" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
            n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
            document,'script','https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${META_PIXEL_ID}');
          `}
        </Script>
      ) : null}
    </>
  );
}
