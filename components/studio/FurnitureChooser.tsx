import Link from "next/link";

/**
 * What are you building, and what happens when you pick it.
 *
 * The old page listed furniture types and left the visitor to discover, by
 * clicking, that a wardrobe has two experiences and a kitchen has a different
 * one entirely. That is the application's routing showing through. Each card
 * now states its own doors up front.
 */

interface Entry {
  label: string;
  blurb: string;
  actions: { label: string; href: string; primary?: boolean }[];
}

const PRIMARY: Entry[] = [
  {
    label: "Wardrobe",
    blurb: "Hinged or sliding, with or without a loft.",
    actions: [
      { label: "Design it", href: "/studio/custom-furniture/wardrobe/design", primary: true },
      { label: "Quick estimate", href: "/studio/custom-furniture/wardrobe" },
    ],
  },
  {
    label: "Kitchen",
    blurb: "Planned from the room — walls, sink, hob and fridge first.",
    actions: [{ label: "Plan my kitchen", href: "/studio/kitchen", primary: true }],
  },
  {
    label: "Storage",
    blurb: "Utility and general storage, shutters throughout.",
    actions: [{ label: "Configure", href: "/studio/custom-furniture/storage", primary: true }],
  },
  {
    label: "TV Unit",
    blurb: "Console, panelling and open display in one elevation.",
    actions: [{ label: "Configure", href: "/studio/custom-furniture/tv-unit", primary: true }],
  },
  {
    label: "Study / Workstation",
    blurb: "Desk, overhead storage and cable management.",
    actions: [{ label: "Configure", href: "/studio/custom-furniture/study", primary: true }],
  },
  {
    label: "Vanity",
    blurb: "Bathroom storage — the case for boil-proof board.",
    actions: [{ label: "Configure", href: "/studio/custom-furniture/vanity", primary: true }],
  },
];

const SECONDARY: { label: string; href: string }[] = [
  { label: "Crockery unit", href: "/studio/custom-furniture/crockery" },
  { label: "Office cabinetry", href: "/studio/custom-furniture/office" },
  { label: "Retail fixtures", href: "/studio/custom-furniture/retail" },
  { label: "All custom furniture", href: "/studio/custom-furniture" },
];

export function FurnitureChooser() {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PRIMARY.map((e) => (
          <article
            key={e.label}
            className="flex h-full flex-col rounded-[3px] border p-5"
            style={{ borderColor: "var(--studio-line)", background: "var(--paper)" }}
          >
            <h3 className="serif text-[21px] leading-tight">{e.label}</h3>
            <p className="mt-1.5 text-[13px] leading-snug" style={{ color: "var(--ink-soft)" }}>
              {e.blurb}
            </p>
            <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-4">
              {e.actions.map((a) => (
                <Link
                  key={a.href}
                  href={a.href}
                  className="inline-flex min-h-11 items-center text-[13.5px] transition-colors"
                  style={{
                    color: a.primary ? "var(--burgundy)" : "var(--ink-soft)",
                    fontWeight: a.primary ? 600 : 400,
                  }}
                >
                  {a.label} <span aria-hidden="true">&nbsp;→</span>
                </Link>
              ))}
            </div>
          </article>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
        <span className="tracked-caps text-[10px]" style={{ color: "var(--ink-faint)" }}>
          Also
        </span>
        {SECONDARY.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="inline-flex min-h-11 items-center text-[13px] transition-colors hover:text-[var(--burgundy)]"
            style={{ color: "var(--ink-soft)" }}
          >
            {s.label}
          </Link>
        ))}
      </div>
    </>
  );
}
