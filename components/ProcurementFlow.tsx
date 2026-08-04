import { Reveal } from "@/components/Reveal";

export const FLOW_STEPS = [
  {
    icon: "upload",
    title: "BOQ uploaded",
    detail: "Plywood, laminate, hardware & adhesive — one list, not five calls.",
  },
  {
    icon: "quotes",
    title: "Manufacturer quotes come back",
    detail: "Stock and pricing checked across our network, not just one supplier.",
  },
  {
    icon: "compare",
    title: "Compared side by side",
    detail: "Brand, spec, price and delivery on one screen — not a pile of PDFs.",
  },
  {
    icon: "check",
    title: "You choose, with the full picture",
    detail: "The best price-to-delivery match, not a guess.",
  },
] as const;

type IconName = (typeof FLOW_STEPS)[number]["icon"];

function StepIcon({ name }: { name: IconName }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };
  switch (name) {
    case "upload":
      return (
        <svg {...common}>
          <path d="M12 16V4" />
          <path d="M6.5 9.5 12 4l5.5 5.5" />
          <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
        </svg>
      );
    case "quotes":
      return (
        <svg {...common}>
          <path d="M6 3h9l3 3v15H6z" />
          <path d="M9 11h6M9 15h6" />
        </svg>
      );
    case "compare":
      return (
        <svg {...common}>
          <path d="M4 20V10M12 20V4M20 20v-7" />
        </svg>
      );
    case "check":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="m8.5 12.5 2.5 2.5 5-5" />
        </svg>
      );
  }
}

/** Compact vertical stepper used in the hero — shows the whole workflow at a glance. */
export function ProcurementFlowPreview() {
  return (
    <Reveal stagger className="mx-auto mt-10 flex max-w-sm flex-col text-left">
      {FLOW_STEPS.map((step, i) => (
        <div key={step.title} className="relative flex gap-3 pb-6 last:pb-0">
          {i < FLOW_STEPS.length - 1 ? (
            <span className="absolute top-8 bottom-0 left-[15px] w-px" style={{ background: "var(--line)" }} />
          ) : null}
          <span
            className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border"
            style={
              i === FLOW_STEPS.length - 1
                ? { borderColor: "var(--burgundy)", background: "var(--burgundy)", color: "#fff" }
                : { borderColor: "var(--line)", background: "var(--paper)", color: "var(--burgundy)" }
            }
          >
            <StepIcon name={step.icon} />
          </span>
          <div className="flex-1 rounded-sm border px-3.5 py-2.5" style={{ borderColor: "var(--line)", background: "var(--card)" }}>
            <p className="text-sm font-medium">{step.title}</p>
            <p className="mt-0.5 text-xs" style={{ color: "var(--line-strong)", lineHeight: "var(--lh-normal)" }}>
              {step.detail}
            </p>
          </div>
        </div>
      ))}
    </Reveal>
  );
}
