import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BreadcrumbSchema } from "@/components/schema/BreadcrumbSchema";
import { Reveal } from "@/components/Reveal";
import { buttonClasses } from "@/components/ui/Button";
import { PHONE_DISPLAY, EMAIL } from "@/lib/contact";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { WhatsAppTrackedLink } from "@/components/WhatsAppTrackedLink";
import { TrackedTelLink } from "@/components/TrackedTelLink";

const ADDRESS_LINE_1 = "7-1-21/B 106 Sita Sarovar, Begumpet";
const ADDRESS_LINE_2 = "Hyderabad, Telangana 500016";
const DIRECTIONS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${ADDRESS_LINE_1}, ${ADDRESS_LINE_2}`)}`;

export const metadata: Metadata = buildMetadata({
  title: "Contact EightxFour — Hyderabad",
  description: "Reach EightxFour by phone, WhatsApp or email for material procurement in Hyderabad — plywood, laminates, veneers, hardware and more.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <main>
      <BreadcrumbSchema items={[{ name: "Home", path: "/" }, { name: "Contact", path: "/contact" }]} />
      <div className="mx-auto max-w-3xl">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Contact" }]} />

        <section className="px-7 py-8">
          <p className="tracked-caps text-xs" style={{ color: "var(--accent)" }}>
            Contact · Hyderabad
          </p>
          <h1 className="serif mt-2" style={{ fontSize: "var(--fs-h1)" }}>
            Get in Touch
          </h1>
          <p className="mt-2 text-base" style={{ color: "var(--line-strong)" }}>
            EightxFour operates as a procurement platform across Hyderabad — reach us directly, or send your BOQ and
            we&apos;ll respond in under 15 minutes during business hours.
          </p>
        </section>

        <Reveal as="section" className="px-7 pb-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
                Phone &amp; WhatsApp
              </h2>
              <p className="mt-2">
                <TrackedTelLink source="contact_page" className="hover:opacity-70" style={{ color: "var(--ink)" }}>
                  {PHONE_DISPLAY}
                </TrackedTelLink>
              </p>
              <WhatsAppTrackedLink
                href={buildWhatsAppUrl("Hi, I'd like to get in touch — found you via the Contact page on eightbyfour.com")}
                source="contact_page"
                className={`mt-3 inline-flex ${buttonClasses("primary")}`}
              >
                Message on WhatsApp
              </WhatsAppTrackedLink>
            </div>
            <div>
              <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
                Email
              </h2>
              <p className="mt-2">
                <a href={`mailto:${EMAIL}`} className="hover:opacity-70" style={{ color: "var(--ink)" }}>
                  {EMAIL}
                </a>
              </p>
            </div>
            <div>
              <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
                Business Hours
              </h2>
              <p className="mt-2" style={{ lineHeight: "var(--lh-normal)" }}>
                Monday – Saturday, 10:00 AM – 8:30 PM
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal as="section" className="px-7 pb-8">
          <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
            Office
          </h2>
          <p className="mt-2" style={{ lineHeight: "var(--lh-normal)" }}>
            {ADDRESS_LINE_1}
            <br />
            {ADDRESS_LINE_2}
            <br />
            India
          </p>
          <a
            href={DIRECTIONS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-3 inline-flex ${buttonClasses("secondary")}`}
          >
            Get Directions →
          </a>
        </Reveal>

        <Reveal as="section" className="px-7 pb-8">
          <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
            Service Area
          </h2>
          <p className="mt-2" style={{ lineHeight: "var(--lh-normal)" }}>
            EightxFour sources and delivers across Hyderabad and the surrounding metro area — see our{" "}
            <Link href="/hyderabad" className="underline hover:opacity-70">
              Hyderabad procurement pages
            </Link>{" "}
            for delivery and process details by project type.
          </p>
        </Reveal>
      </div>
    </main>
  );
}
