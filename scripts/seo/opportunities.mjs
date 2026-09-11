#!/usr/bin/env node
/**
 * Search opportunity snapshot.
 *
 * Scores a Search Console "Pages" export with lib/seoOpportunity.ts
 * (Opportunity = Impressions × Position Opportunity × CTR Gap) and writes
 * seo/opportunities/latest.json. The site reads that file to decide which
 * product pages get extra internal links — the "most searched" blocks on
 * brand and category hubs and the product grids on guides — so pages sitting
 * at positions 4–20 with real impressions get pushed, and the links move as
 * the data does.
 *
 * Usage:
 *   node scripts/seo/opportunities.mjs <export.csv|export.json> [--start YYYY-MM-DD --end YYYY-MM-DD]
 *                                      [--out seo/opportunities/latest.json] [--min 5] [--top 25]
 *
 * Accepts:
 *   - the CSV from Search Console → Performance → Pages → Export
 *     ("Top pages,Clicks,Impressions,CTR,Position"; CTR as "2.3%")
 *   - Search Analytics API JSON: an array of rows, `{ rows: [...] }`, rows keyed
 *     by `page` or `keys[0]`, or the same wrapped in an MCP `{ result: "..." }`
 *
 * Monthly routine: export the last 28 days of Pages, run this, review the
 * printed table, commit the new snapshot. See docs/SEO-SEARCH-GROWTH.md.
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { rankOpportunities } from "../../lib/seoOpportunity.ts";
import { CATEGORIES } from "../../lib/categories.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((f) => f !== "")) rows.push(row);
      row = [];
    } else field += ch;
  }
  if (field !== "" || row.length) {
    row.push(field);
    if (row.some((f) => f !== "")) rows.push(row);
  }
  return rows;
}

const toNumber = (value) => Number(String(value ?? "").replace(/,/g, "").trim());

function fromCsv(text) {
  const [header, ...body] = parseCsv(text.replace(/^﻿/, ""));
  const col = (re) => header.findIndex((h) => re.test(h));
  const page = col(/page|url|address/i);
  const clicks = col(/click/i);
  const impressions = col(/impression/i);
  const ctr = col(/ctr/i);
  const position = col(/position/i);
  if ([page, clicks, impressions, position].some((i) => i < 0)) {
    throw new Error(`Unrecognised CSV header: ${header.join(", ")}`);
  }
  return {
    rows: body.map((r) => {
      const c = toNumber(r[clicks]);
      const imp = toNumber(r[impressions]);
      const rawCtr = ctr >= 0 ? String(r[ctr]).trim() : "";
      const ctrValue = rawCtr.endsWith("%") ? toNumber(rawCtr.slice(0, -1)) / 100 : rawCtr ? toNumber(rawCtr) : imp ? c / imp : 0;
      return { page: r[page], clicks: c, impressions: imp, ctr: ctrValue, position: toNumber(r[position]) };
    }),
  };
}

function fromJson(text) {
  let data = JSON.parse(text);
  if (typeof data?.result === "string") data = JSON.parse(data.result);
  const rows = Array.isArray(data) ? data : (data.rows ?? []);
  return {
    start: data.start ?? data.date_range?.start,
    end: data.end ?? data.date_range?.end,
    rows: rows
      .map((r) => {
        const clicks = toNumber(r.clicks);
        const impressions = toNumber(r.impressions);
        return {
          page: r.page ?? r.keys?.[0],
          clicks,
          impressions,
          ctr: r.ctr !== undefined ? toNumber(r.ctr) : impressions ? clicks / impressions : 0,
          position: toNumber(r.position),
        };
      })
      .filter((r) => r.page),
  };
}

const CATEGORY_SLUGS = new Set(CATEGORIES.map((c) => c.slug));

function pageKind(path) {
  const [pathname, query] = path.split("?");
  if (query) return "filter";
  const seg = pathname.split("/").filter(Boolean);
  if (seg.length === 0) return "home";
  if (seg[0] === "products") {
    if (seg.length === 1) return "products-index";
    if (CATEGORY_SLUGS.has(seg[1])) return seg[2] === "collections" ? "collection" : "category";
    return seg.length === 2 ? "product" : "other";
  }
  if (seg[0] === "brands") return "brand";
  if (["guides", "comparisons", "applications"].includes(seg[0])) return "guide";
  if (seg[0] === "hyderabad") return "hyderabad";
  return "other";
}

const round = (value, places) => Math.round(value * 10 ** places) / 10 ** places;

const input = process.argv[2];
if (!input || input.startsWith("--")) {
  console.error("Usage: node scripts/seo/opportunities.mjs <export.csv|export.json> [--start YYYY-MM-DD --end YYYY-MM-DD] [--out path] [--min 5] [--top 25]");
  process.exit(1);
}

const text = readFileSync(input, "utf8");
const parsed = /\.csv$/i.test(input) ? fromCsv(text) : fromJson(text);
const minImpressions = Number(arg("min", "5"));
const ranked = rankOpportunities(parsed.rows, { minImpressions });

const rows = ranked.map((r) => ({
  path: r.path,
  kind: pageKind(r.path),
  clicks: r.clicks,
  impressions: r.impressions,
  ctr: round(r.ctr, 4),
  position: round(r.position, 1),
  score: round(r.score, 3),
  bucket: r.bucket,
}));

const buckets = rows.reduce((acc, r) => ({ ...acc, [r.bucket]: (acc[r.bucket] ?? 0) + 1 }), {});
const snapshot = {
  generatedAt: new Date().toISOString().slice(0, 10),
  source: basename(input),
  window: { start: arg("start", parsed.start ?? null), end: arg("end", parsed.end ?? null) },
  minImpressions,
  totals: {
    pages: parsed.rows.length,
    impressions: parsed.rows.reduce((s, r) => s + r.impressions, 0),
    clicks: parsed.rows.reduce((s, r) => s + r.clicks, 0),
  },
  buckets,
};

// One row per line keeps monthly snapshot diffs reviewable.
const head = JSON.stringify(snapshot, null, 2).replace(/\n}$/, "");
const body = rows.map((r) => `    ${JSON.stringify(r)}`).join(",\n");
const out = resolve(ROOT, arg("out", "seo/opportunities/latest.json"));
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, `${head},\n  "rows": [\n${body}\n  ]\n}\n`);

const top = Number(arg("top", "25"));
console.log(`Scored ${rows.length} pages (≥${minImpressions} impressions) from ${parsed.rows.length} rows → ${out}`);
console.log("Buckets:", buckets);
console.log(`\nTop ${top} opportunities:`);
for (const r of rows.slice(0, top)) {
  console.log(
    `${r.score.toFixed(2).padStart(7)}  ${r.bucket.padEnd(17)} pos ${String(r.position).padStart(5)}  impr ${String(r.impressions).padStart(5)}  ctr ${(r.ctr * 100).toFixed(1).padStart(5)}%  ${r.path}`
  );
}
