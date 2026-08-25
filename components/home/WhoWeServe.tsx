import Link from "next/link";
import { Reveal } from "@/components/Reveal";

/**
 * Persona self-identification, kept from the previous homepage but restyled to
 * the token system and moved below the proof and the process — a visitor picks
 * a persona door far more readily once they already know what the company is
 * and what it holds. It stays a list of links, not a card triptych: each row's
 * real job is to route into the matching Hyderabad landing page.
 */
const WHO_WE_SERVE = [
  {
    title: "Homeowners",
    body: "Building or renovating your own home — source real materials without chasing ten different shops.",
    href: "/hyderabad/homeowner-materials",
    icon: "house",
  },
  {
    title: "Interior Designers",
    body: "One point of contact across plywood, laminates, veneers, hardware and solid surfaces — for every client project.",
    href: "/hyderabad/architect-material-sourcing",
    icon: "pencil",
  },
  {
    title: "Architects",
    body: "Spec real, in-stock materials against real shade and edge-band codes — not a catalogue that may or may not be available on site.",
    href: "/hyderabad/architect-material-sourcing",
    icon: "compass",
  },
  {
    title: "Contractors",
    body: "A single supplier for every category on the BOQ, with trade pricing and delivery scheduled against your site timeline.",
    href: "/hyderabad/contractor-procurement",
    icon: "hardhat",
  },
  {
    title: "Builders & Procurement Teams",
    body: "Procurement across multiple sites and projects, consolidated through one relationship instead of a dozen vendor accounts.",
    href: "/hyderabad/contractor-procurement",
    icon: "stack",
  },
] as const;

type WhoIconName = (typeof WHO_WE_SERVE)[number]["icon"];

function WhoIcon({ name }: { name: WhoIconName }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };
  switch (name) {
    case "house":
      return (
        <svg {...common}>
          <path d="M3 11.5 12 4l9 7.5" />
          <path d="M5.5 10v10h13V10" />
          <path d="M10 20v-6h4v6" />
        </svg>
      );
    case "pencil":
      return (
        <svg {...common}>
          <path d="M4 20l.8-3.5L15.5 6l3.5 3.5L8.3 20.3z" />
          <path d="M13.5 8 16 10.5" />
        </svg>
      );
    case "compass":
      return (
        <svg {...common}>
          <circle cx="12" cy="6" r="1.6" />
          <path d="M12 7.6 7 20M12 7.6l5 12.4M7.5 20h9" />
        </svg>
      );
    case "hardhat":
      return (
        <svg {...common}>
          <path d="M4 16a8 8 0 0 1 16 0" />
          <path d="M2.5 16h19" />
          <path d="M12 5v3" />
        </svg>
      );
    case "stack":
      return (
        <svg {...common}>
          <rect x="5" y="10" width="6" height="10" />
          <rect x="13" y="5" width="6" height="15" />
        </svg>
      );
  }
}

export function WhoWeServe() {
  return (
    <Reveal as="section" className="px-7 py-16 md:py-20" style={{ background: "var(--surface-secondary)" }}>
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-x-16 gap-y-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <h2 className="max-w-sm" style={{ fontSize: "var(--fs-h1)", lineHeight: "var(--lh-snug)" }}>
            Whoever is doing the building
          </h2>
          <p
            className="mt-4 max-w-xs"
            style={{ fontSize: "var(--fs-body)", lineHeight: "var(--lh-normal)", color: "var(--text-secondary)" }}
          >
            One home or a dozen sites — the same single point of contact, and the same one consolidated quote.
          </p>
        </div>
        <Reveal stagger className="flex flex-col">
          {WHO_WE_SERVE.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="group flex items-center justify-between gap-6 border-b py-5 first:border-t"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <span className="flex min-w-0 items-center gap-4">
                <span className="shrink-0" style={{ color: "var(--brand-primary)" }}>
                  <WhoIcon name={item.icon} />
                </span>
                <span className="min-w-0">
                  <span className="font-display block text-[18px] font-semibold leading-snug transition-colors group-hover:text-[var(--brand-primary)]">
                    {item.title}
                  </span>
                  <span
                    className="mt-1 block"
                    style={{ fontSize: "var(--fs-body-sm)", lineHeight: "var(--lh-normal)", color: "var(--text-secondary)" }}
                  >
                    {item.body}
                  </span>
                </span>
              </span>
              <span
                className="shrink-0 text-lg transition-transform duration-300 [transition-timing-function:var(--ease-out-soft)] group-hover:translate-x-1"
                style={{ color: "var(--brand-primary)" }}
                aria-hidden="true"
              >
                →
              </span>
            </Link>
          ))}
        </Reveal>
      </div>
    </Reveal>
  );
}
