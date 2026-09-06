/**
 * Design guardrails.
 *
 * These are the rules a kitchen designer applies without thinking, written down
 * so the tool can apply them too. They warn; they do not block. A customer who
 * wants a 700 mm walkway is allowed to have one — they are not allowed to have
 * one without being told.
 */

import { getCabinetType } from "./cabinets";
import { variantOf } from "./appliances";
import { placements } from "./geometry";
import { freeSpans } from "./layout";
import { K, type KitchenProject } from "./types";

export type IssueLevel = "warning" | "note";

export interface DesignIssue {
  id: string;
  level: IssueLevel;
  title: string;
  detail: string;
  /** Cabinet to highlight, where the issue is about one unit. */
  cabinetId?: string;
}

/** Straight-line distance between two placements, mm. */
function dist(a: [number, number, number], b: [number, number, number]): number {
  return Math.hypot(a[0] - b[0], a[2] - b[2]);
}

export function validateKitchen(project: KitchenProject): DesignIssue[] {
  const issues: DesignIssue[] = [];
  const places = placements(project);
  const byRole = (role: string) => places.filter((p) => getCabinetType(p.cabinet.typeId).role === role);

  const sink = byRole("sink")[0];
  const hob = byRole("hob")[0];
  const fridge = byRole("fridge")[0];

  // --- work triangle -------------------------------------------------------
  if (sink && hob && fridge) {
    const legs = [dist(sink.center, hob.center), dist(hob.center, fridge.center), dist(fridge.center, sink.center)];
    const perimeter = legs.reduce((a, b) => a + b, 0);
    if (perimeter > 8000) {
      issues.push({
        id: "triangle-long",
        level: "warning",
        title: "The work triangle is long",
        detail: `Sink, hob and fridge total ${(perimeter / 1000).toFixed(1)} m apart. Above about 8 m you walk noticeably more during every meal.`,
      });
    } else if (perimeter < 3600) {
      issues.push({
        id: "triangle-tight",
        level: "note",
        title: "The work triangle is tight",
        detail: `${(perimeter / 1000).toFixed(1)} m total. Efficient for one cook, cramped for two.`,
      });
    }
  }

  // --- sink and hob need prep counter between them ------------------------
  if (sink && hob) {
    const gap = dist(sink.center, hob.center) - (sink.size[0] + hob.size[0]) / 2;
    if (gap < 600) {
      issues.push({
        id: "sink-hob",
        level: "warning",
        title: "Not enough counter between sink and hob",
        detail: `About ${Math.round(Math.max(0, gap))} mm of worktop between them. 600 mm is the practical minimum for chopping between washing and cooking.`,
        cabinetId: hob.cabinet.id,
      });
    }
  }

  // --- hob hard against a tall unit ---------------------------------------
  if (hob) {
    for (const p of places.filter((x) => x.tier === "tall")) {
      const gap = dist(hob.center, p.center) - (hob.size[0] + p.size[0]) / 2;
      if (gap >= 0 && gap < 300) {
        issues.push({
          id: "hob-tall",
          level: "warning",
          title: "Hob is too close to a tall unit",
          detail: `${Math.round(gap)} mm to the ${getCabinetType(p.cabinet.typeId).label}. A pan handle needs landing space beside the burner, and a tall side panel next to a flame is a heat problem.`,
          cabinetId: hob.cabinet.id,
        });
      }
    }
  }

  // --- fridge door clearance ----------------------------------------------
  if (fridge) {
    const v = variantOf("fridge", project.appliances.find((a) => a.kind === "fridge")?.variantId ?? "double");
    if (v.id === "side-by-side" || v.id === "french") {
      const room = Math.min(project.room.widthMm, project.room.depthMm);
      if (room - K.baseDepthMm < 1100) {
        issues.push({
          id: "fridge-swing",
          level: "warning",
          title: "Tight for a side-by-side fridge",
          detail: "Both doors need to open past 90° to pull the shelves out. This room leaves under 1100 mm in front of the run.",
          cabinetId: fridge.cabinet.id,
        });
      }
    }
  }

  // --- walkway between facing runs ----------------------------------------
  const walls = new Set(project.runs.filter((r) => r.tier === "base").map((r) => r.wall));
  const facingPairs: [string, string][] = [
    ["N", "S"],
    ["E", "W"],
  ];
  for (const [a, b] of facingPairs) {
    if (walls.has(a as never) && walls.has(b as never)) {
      const across = a === "N" ? project.room.depthMm : project.room.widthMm;
      const gap = across - K.baseDepthMm * 2;
      if (gap < K.minWalkwayMm) {
        issues.push({
          id: `walkway-${a}`,
          level: "warning",
          title: "Walkway is below the workable minimum",
          detail: `${Math.round(gap)} mm between the two runs. Under ${K.minWalkwayMm} mm an open dishwasher or oven door blocks the kitchen completely.`,
        });
      } else if (gap < K.goodWalkwayMm) {
        issues.push({
          id: `walkway-tight-${a}`,
          level: "note",
          title: "Walkway is workable but tight",
          detail: `${Math.round(gap)} mm between the runs. Fine for one cook; two people will be turning around each other.`,
        });
      }
    }
  }

  // --- wall cabinets over a window ----------------------------------------
  for (const run of project.runs.filter((r) => r.tier === "wall")) {
    const spans = freeSpans(project.room, run.wall, "wall");
    const total = run.cabinets.reduce((s, c) => s + c.widthMm, 0);
    const available = spans.reduce((s, x) => s + (x.end - x.start), 0);
    if (total > available + 50) {
      issues.push({
        id: `wall-window-${run.id}`,
        level: "warning",
        title: "Wall cabinets overrun a window",
        detail: "The wall run is longer than the clear wall available. Something here would end up across the glass.",
      });
    }
  }

  // --- chimney narrower than the hob --------------------------------------
  const chimney = project.appliances.find((a) => a.kind === "chimney");
  const hobApp = project.appliances.find((a) => a.kind === "hob");
  if (chimney && chimney.variantId !== "none" && hobApp) {
    const cw = variantOf("chimney", chimney.variantId).widthMm;
    const hw = variantOf("hob", hobApp.variantId).widthMm;
    if (cw < hw) {
      issues.push({
        id: "chimney-narrow",
        level: "warning",
        title: "Chimney is narrower than the hob",
        detail: `A ${cw} mm hood over a ${hw} mm hob leaves the outer burners unextracted. Match or exceed the hob width.`,
      });
    }
  }

  // --- corner units without a filler --------------------------------------
  for (const run of project.runs.filter((r) => r.tier === "base")) {
    const hasCorner = run.cabinets.some((c) => getCabinetType(c.typeId).role === "corner");
    const hasFiller = run.cabinets.some((c) => getCabinetType(c.typeId).role === "filler");
    if (hasCorner && !hasFiller) {
      issues.push({
        id: `corner-filler-${run.id}`,
        level: "note",
        title: "Corner may need a filler",
        detail: "Without a 50–100 mm filler, the drawer beside a corner unit can catch on the return wall as it opens.",
      });
    }
  }

  // --- dishwasher away from the sink --------------------------------------
  const dw = byRole("dishwasher")[0];
  if (dw && sink) {
    const gap = dist(dw.center, sink.center);
    if (gap > 1500) {
      issues.push({
        id: "dw-far",
        level: "warning",
        title: "Dishwasher is far from the sink",
        detail: `${Math.round(gap)} mm away. It shares the sink's supply and waste, so distance here means running plumbing across the kitchen.`,
        cabinetId: dw.cabinet.id,
      });
    }
  }

  return issues;
}

// ------------------------------------------------------- service points ----

export type ServiceKind = "power" | "plumbing" | "drain" | "gas";

export interface ServicePoint {
  id: string;
  kind: ServiceKind;
  label: string;
  /** Room-space position, mm. */
  at: [number, number, number];
  note: string;
}

/**
 * Electrical, plumbing and gas points implied by what has been configured.
 *
 * Advisory only: an electrician sets the real positions against the site. What
 * this does is make sure nobody discovers at installation that there is no
 * socket behind the fridge.
 */
export function servicePoints(project: KitchenProject): ServicePoint[] {
  const out: ServicePoint[] = [];
  const places = placements(project);
  let n = 0;
  const add = (kind: ServiceKind, label: string, at: [number, number, number], note: string) =>
    out.push({ id: `sp-${(n += 1)}`, kind, label, at, note });

  for (const p of places) {
    const type = getCabinetType(p.cabinet.typeId);
    const [x, , z] = p.center;
    switch (type.role) {
      case "sink":
        add("plumbing", "Sink supply", [x, 450, z], "Hot and cold stop cocks inside the cabinet, off the bowl centreline.");
        add("drain", "Sink waste", [x, 350, z], "Trap and waste outlet. Keep clear of the bin pull-out.");
        if (project.appliances.some((a) => a.kind === "ro" && a.variantId === "under")) {
          add("power", "RO point", [x + 200, 500, z], "5 A socket inside the sink cabinet for the purifier.");
        }
        break;
      case "hob":
        add("gas", "Gas point", [x, 500, z], "Pipeline or cylinder connection below the hob, with an accessible isolation valve.");
        break;
      case "dishwasher":
        add("plumbing", "Dishwasher supply", [x, 450, z], "Dedicated inlet, teed off the sink supply.");
        add("drain", "Dishwasher waste", [x, 400, z], "Standpipe or a spigot on the sink trap.");
        add("power", "Dishwasher socket", [x, 300, z], "16 A socket, not behind the machine itself.");
        break;
      case "fridge":
        add("power", "Refrigerator socket", [x, 1800, z], "16 A above the fridge loft, so it is reachable without moving the unit.");
        break;
      case "chimney":
        add("power", "Chimney socket", [x, 2050, z], "Inside the chimney bay, above the hood body.");
        break;
      case "oven":
      case "appliance-tower":
        add("power", "Oven point", [x, 600, z], "20 A dedicated circuit — an oven should not share with the counter sockets.");
        break;
      case "microwave":
        add("power", "Microwave socket", [x, K.wallSillMm + 200, z], "Inside the housing, on the side wall.");
        break;
      default:
        break;
    }
  }

  // Counter sockets, spaced along the base runs.
  for (const run of project.runs.filter((r) => r.tier === "base")) {
    const len = run.cabinets.reduce((s, c) => s + c.widthMm, 0);
    const count = Math.max(1, Math.round(len / 1200));
    for (let i = 0; i < count; i += 1) {
      const p = places.find((x) => x.run.id === run.id);
      if (!p) continue;
      const frac = (i + 0.5) / count;
      add(
        "power",
        "Counter socket",
        [p.center[0] + (p.wall === "N" || p.wall === "S" ? (frac - 0.5) * len : 0), K.counterTopMm + 200, p.center[2] + (p.wall === "E" || p.wall === "W" ? (frac - 0.5) * len : 0)],
        "6 A twin socket 200 mm above the counter, for the mixer, kettle and toaster.",
      );
    }
  }

  if (project.lighting.length > 0) {
    const p = places.find((x) => x.tier === "wall");
    if (p) add("power", "Cabinet lighting driver", [p.center[0], K.wallSillMm + K.wallHeightMm, p.center[2]], "Low-voltage driver above the wall run, switched separately.");
  }

  return out;
}
