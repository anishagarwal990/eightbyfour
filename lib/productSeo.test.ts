/**
 * Product metadata rule tests — titles, headings, descriptions and image alt
 * text for every product page. One bad helper here renames ~3,100 URLs'
 * titles at once, so the rules are pinned case by case.
 *
 * Run: node --test lib/productSeo.test.ts
 */

import test from "node:test";
import assert from "node:assert/strict";
import {
  bestProductImage,
  buildProductDescription,
  buildProductHeading,
  buildProductTitle,
  hasTitleDefect,
  productFinishLabels,
  productIdentity,
  productImages,
  thicknessSummary,
} from "./productSeo.ts";

type Row = Parameters<typeof buildProductTitle>[0] & Parameters<typeof productImages>[0];

// "test-" slugs deliberately never match a real catalogue slug, so every
// fixture here resolves to the "discover" safety tier (lib/seoProtection.ts)
// regardless of what the live Search Console snapshot happens to contain —
// these tests pin the full new-template behaviour. Protect-tier behaviour
// (preserving a real high-performing page's title) is tested separately
// below using an actual slug from the committed snapshot.
function merino(over: Partial<Row> = {}): Row {
  return {
    slug: "test-merino-22153-saga-green",
    brand: "Merino",
    name: "Saga Green",
    category: "Laminates",
    sd_code: "22153",
    collection: "Laminates",
    finish: "Standard",
    finishes: ["Standard", "FT", "MR+"],
    price_table: { unit: "sheet", starting_price: 1300 },
    size: "8×4 ft (2440×1220mm)",
    thicknesses: ["1mm"],
    description: "Merino Saga Green is a decorative laminate finish from the Laminates range, suited for cabinetry, wardrobes and wall panelling.",
    applications: ["Residential Spaces"],
    app_img_url: null,
    main_img_url: "https://cdn.example/merino/laminates/22153-standard.png",
    edge_img_url: null,
    gallery_img_urls: [
      "https://cdn.example/merino/laminates/22153-standard.png",
      "https://cdn.example/merino/laminates/22153-ft.png",
      "https://cdn.example/merino/laminates/22153-mr.png",
    ],
    ...over,
  };
}

function virgo(over: Partial<Row> = {}): Row {
  return merino({
    slug: "test-virgo-1987-coined",
    brand: "Virgo",
    name: "Coined",
    sd_code: "1987",
    collection: "Superlative High Gloss",
    finish: "SHG",
    finishes: null,
    price_table: { unit: "sheet", starting_price: 1145 },
    thicknesses: ["1.00 mm"],
    main_img_url: "/brand-logos/virgo.jpg",
    gallery_img_urls: null,
    ...over,
  });
}

function century(over: Partial<Row> = {}): Row {
  return merino({
    slug: "test-century-laminates-3903-french-cambric",
    brand: "Century Laminates",
    name: "French Cambric",
    sd_code: "3903",
    collection: "Linen",
    finish: "LN",
    finishes: null,
    price_table: null,
    thicknesses: ["1.00 mm"],
    main_img_url: "/brand-logos/century-laminates.jpg",
    gallery_img_urls: null,
    ...over,
  });
}

function board(over: Partial<Row> = {}): Row {
  return merino({
    slug: "test-century-cenboil-plus",
    brand: "Century",
    name: "Cenboil Plus",
    category: "Boil Boards",
    sd_code: null,
    collection: null,
    finish: null,
    finishes: null,
    price_table: null,
    thicknesses: ["8mm", "12mm", "16.75mm", "18mm"],
    description:
      "Marine-grade BWP HDF for kitchens, bathrooms, and office interiors — 100% hardwood construction, termite resistant, fire retardant. Available one/both-side laminated or bare.",
    main_img_url: "https://cdn.example/products/1116-main.jpeg",
    gallery_img_urls: null,
    ...over,
  });
}

function assertSane(text: string) {
  assert.ok(!/undefined|null|NaN/.test(text), `leaked a missing value: ${text}`);
  assert.ok(!/\s{2,}/.test(text), `double space: ${text}`);
  assert.equal(text, text.trim());
}

// ---- complete product ----

test("complete multi-finish SKU: brand + code + shade + type, then Price & Finishes", () => {
  const p = merino();
  assert.equal(productIdentity(p), "Merino 22153 Saga Green");
  assert.equal(buildProductHeading(p), "Merino 22153 Saga Green Laminate");
  assert.equal(buildProductTitle(p), "Merino 22153 Saga Green Laminate — Price & Finishes");
});

test("complete SKU description: identity, finishes by name, price, specs, commercial close", () => {
  const d = buildProductDescription(merino());
  assertSane(d);
  assert.ok(d.length <= 155, `${d.length}: ${d}`);
  assert.ok(d.startsWith("Merino 22153 Saga Green laminate"), d);
  assert.ok(d.includes("Feather Touch (FT)"), d);
  assert.ok(d.includes("₹1300/sheet"), d);
  assert.ok(d.includes("1mm") && d.includes("8×4 ft"), d);
  assert.ok(d.includes("Hyderabad"), d);
  assert.ok(d.endsWith("."), d);
  // Merino's "Laminates" collection is a placeholder, not a range worth naming.
  assert.ok(!d.includes("From the Laminates range"), d);
});

test("single per-SKU finish, priced by the sheet: finish code in the title, finish name in the description", () => {
  const p = virgo();
  assert.equal(buildProductTitle(p), "Virgo 1987 Coined SHG Laminate — Sheet Price");
  const d = buildProductDescription(p);
  assertSane(d);
  assert.ok(d.includes("Superlative High Gloss (SHG)"), d);
  assert.ok(d.includes("₹1145/sheet"), d);
  // Virgo collections are its finish names — not repeated as a "range".
  assert.ok(!d.includes("From the Superlative High Gloss range"), d);
  assert.ok(d.length <= 155);
});

test("brand name that already says the product type is not followed by it again", () => {
  const p = century();
  assert.equal(buildProductHeading(p), "Century Laminates 3903 French Cambric LN");
  assert.equal(buildProductTitle(p), "Century Laminates 3903 French Cambric LN");
  assert.ok(!/Laminates?\b.*\bLaminate\b/.test(buildProductTitle(p).replace("Century Laminates", "")));
});

// ---- no price ----

test("no rate on file: title stays identity-only — no 'Price on Request' spam — description still explains pricing is on request", () => {
  const p = century();
  assert.equal(buildProductTitle(p), buildProductHeading(p));
  assert.ok(!buildProductTitle(p).includes("Price"), buildProductTitle(p));
  const d = buildProductDescription(p);
  assertSane(d);
  assert.ok(d.includes("Price on request"), d);
  assert.ok(!d.includes("₹"), d);
  assert.ok(d.includes("From the Linen range"), d);
  assert.ok(d.length <= 155, `${d.length}: ${d}`);
});

// ---- missing fields ----

test("missing finish: no finish token, no empty finish clause", () => {
  const p = merino({ finish: null, finishes: null });
  assert.equal(buildProductTitle(p), "Merino 22153 Saga Green Laminate — Sheet Price");
  const d = buildProductDescription(p);
  assertSane(d);
  assert.ok(!d.includes("finish"), d);
  assert.deepEqual(productFinishLabels(p), []);
});

test("missing shade name: brand + code still make a usable identity", () => {
  const p = merino({ name: "" });
  assert.equal(productIdentity(p), "Merino 22153");
  assert.equal(buildProductTitle(p), "Merino 22153 Laminate — Price & Finishes");
  assertSane(buildProductDescription(p));
});

test("no brand: no leading space, the code leads", () => {
  const p = merino({ brand: "" });
  assert.equal(productIdentity(p), "22153 Saga Green");
  assert.ok(buildProductTitle(p).startsWith("22153 Saga Green Laminate"));
  assertSane(buildProductTitle(p));
  assertSane(buildProductDescription(p));
});

test("missing size and thickness: description drops the spec list instead of printing blanks", () => {
  const d = buildProductDescription(merino({ size: null, thicknesses: null }));
  assertSane(d);
  assert.ok(d.includes("₹1300/sheet"), d);
});

// ---- lengths ----

test("very long shade name: no qualifier past the snippet budget, title stays under the hard ceiling", () => {
  const p = merino({ name: "Extraordinarily Long Decorative Shade Name With Many Many Words Well Beyond Budget" });
  const title = buildProductTitle(p);
  assert.ok(!title.includes(" — Price"), title);
  assert.equal(title, buildProductHeading(p));
  const d = buildProductDescription(p);
  assert.ok(d.length <= 155 || d === buildProductDescription(p), d);
  assertSane(d);
});

test("every fixture: qualified titles fit 70 chars, descriptions fit 155", () => {
  for (const p of [merino(), virgo(), century(), board(), merino({ finishes: ["Standard", "FT", "MR+", "HGL", "SF"] })]) {
    const title = buildProductTitle(p);
    if (title.includes(" — ")) assert.ok(title.length <= 70, `${title.length}: ${title}`);
    assert.ok(title.length <= 78, title);
    const d = buildProductDescription(p);
    assert.ok(d.length <= 155, `${d.length}: ${d}`);
  }
});

test("five finishes: named when they fit, counted when they don't — never dropped", () => {
  const d = buildProductDescription(merino({ finishes: ["Standard", "FT", "MR+", "HGL", "SF"] }));
  assert.ok(d.includes("and 2 more finishes") || d.includes("in 5 finishes"), d);
  assert.ok(d.includes("₹1300/sheet"), d);
});

// ---- special characters / duplicates ----

test("special characters pass through untouched", () => {
  const p = merino({ brand: "Greenlam", name: `Crème Marquina & "Oak"`, sd_code: "5571", finishes: ["HDG"], finish: "HDG", price_table: null });
  assert.equal(buildProductTitle(p), `Greenlam 5571 Crème Marquina & "Oak" Laminate`);
  assertSane(buildProductDescription(p));
  assert.ok(buildProductDescription(p).includes("HD Gloss (HDG)"));
});

test("a name that repeats the code or the brand is not doubled", () => {
  assert.equal(productIdentity(merino({ name: "22153" })), "Merino 22153");
  assert.equal(productIdentity(merino({ name: "22153 Saga Green" })), "Merino 22153 Saga Green");
  assert.equal(productIdentity(merino({ name: "Merino Saga Green" })), "Merino 22153 Saga Green");
});

test("code-less SKUs are disambiguated by collection, without repeating it", () => {
  const veneer = merino({
    brand: "EightByFour",
    name: "Natural Veneer 11",
    category: "Veneers",
    sd_code: null,
    collection: "Natural Veneer",
    finish: null,
    finishes: null,
    price_table: null,
  });
  assert.equal(buildProductHeading(veneer), "EightByFour Natural Veneer 11");
  assert.equal(buildProductTitle(veneer), "EightByFour Natural Veneer 11");
});

test("catalogue labels become product words: solid surface, not 'Corian - Acrylic Solid Surface'", () => {
  const p = merino({ brand: "Durasein", name: "Hickory", category: "Corian - Acrylic Solid Surface", sd_code: "DM5031", finish: null, finishes: null, price_table: null, collection: null });
  assert.equal(buildProductTitle(p), "Durasein DM5031 Hickory Solid Surface");
});

// ---- boards ----

test("priced board keeps the legacy 'Price in Hyderabad' title exactly", () => {
  const p = board({ brand: "Century", name: "Sainik 710", category: "Plywood", price_table: { unit: "sqft", min_price: 90, max_price: 140 } });
  assert.equal(buildProductTitle(p), "Century Sainik 710 Plywood Price in Hyderabad");
});

test("unpriced board: description leads with the product name even when the stored sentence doesn't", () => {
  const p = board();
  assert.equal(buildProductTitle(p), "Century Cenboil Plus Boil Board");
  const d = buildProductDescription(p);
  assertSane(d);
  assert.ok(d.startsWith("Century Cenboil Plus"), d);
  assert.ok(d.includes("Price on request"), d);
  assert.ok(d.length <= 155, `${d.length}: ${d}`);
});

test("thickness ranges collapse to min–max only when every value is a plain mm figure", () => {
  assert.equal(thicknessSummary(["8mm", "12mm", "16.75mm", "18mm"]), "8–18mm");
  assert.equal(thicknessSummary(["1mm"]), "1mm");
  assert.equal(thicknessSummary(["0.72 - 0.82 mm", "1mm"]), "0.72 - 0.82 mm");
  assert.equal(thicknessSummary(null), null);
});

test("titles are deterministic", () => {
  assert.equal(buildProductTitle(merino()), buildProductTitle(merino()));
  assert.equal(buildProductDescription(century()), buildProductDescription(century()));
});

// ---- images ----

test("brand-logo stand-ins are labelled as logos and never preferred over a real photo", () => {
  const onlyLogo = productImages(virgo());
  assert.equal(onlyLogo[0].isPlaceholder, true);
  assert.equal(onlyLogo[0].alt, "Virgo logo");
  const mixed = virgo({ gallery_img_urls: ["https://cdn.example/virgo/1987.jpg"] });
  assert.equal(bestProductImage(mixed)?.src, "https://cdn.example/virgo/1987.jpg");
});

test("finish-variant gallery images say which finish they show", () => {
  const alts = productImages(merino()).map((i) => i.alt);
  assert.ok(alts.includes("Merino 22153 Saga Green Laminate in Standard finish"), alts.join(" | "));
  assert.ok(alts.includes("Merino 22153 Saga Green Laminate in Feather Touch (FT) finish"), alts.join(" | "));
  assert.ok(alts.includes("Merino 22153 Saga Green Laminate in MR+ finish"), alts.join(" | "));
});

// ---- safety tiers (lib/seoProtection.ts) ----

test("protect tier: a real top-3, high-CTR page keeps its pre-session title verbatim", () => {
  // virgo-6540-sf-charcoal is bucket "protect" in the committed snapshot
  // (position 3.0, 55.6% CTR) — tier lookup is keyed only on slug, so the
  // rest of the row can be any well-formed product.
  const p = merino({
    slug: "virgo-6540-sf-charcoal",
    brand: "Virgo",
    name: "Charcoal",
    sd_code: "6540",
    collection: "Suede Finish",
    finish: "SF",
    finishes: null,
    price_table: { unit: "sheet", starting_price: 1000 },
  });
  // The pre-session algorithm: brand + code + shade + finish + category,
  // never a price qualifier outside PRICE_INTENT_CATEGORIES.
  assert.equal(buildProductTitle(p), "Virgo 6540 Charcoal SF Laminate");
  assert.ok(!buildProductTitle(p).includes("—"), buildProductTitle(p));
});

test("protect tier: a genuine legacy-title defect still gets bug-fixed, not left broken", () => {
  const p = merino({
    slug: "virgo-6540-sf-charcoal", // same real protect-tier slug
    brand: "Durasein",
    name: "Hickory",
    sd_code: "DM5031",
    category: "Corian - Acrylic Solid Surface",
    finish: null,
    finishes: null,
    collection: null,
    price_table: null,
  });
  // Legacy title would be "Durasein DM5031 Hickory Corian - Acrylic Solid
  // Surface" — the raw dbCategory label leaking through with its " - ".
  assert.equal(buildProductTitle(p), buildProductHeading(p));
  assert.equal(buildProductTitle(p), "Durasein DM5031 Hickory Solid Surface");
});

test("hasTitleDefect: catches a repeated word (any plural form) and a raw category label, nothing else", () => {
  assert.equal(hasTitleDefect("Century Laminates 3903 French Cambric LN Laminate"), true, "Laminates...Laminate");
  assert.equal(hasTitleDefect("EightByFour Natural Veneer 11 Natural Veneer Veneer"), true);
  assert.equal(hasTitleDefect("Durasein DM5031 Hickory Corian - Acrylic Solid Surface"), true);
  assert.equal(hasTitleDefect("Merino 22153 Saga Green Laminate"), false);
  assert.equal(hasTitleDefect("Century Sainik 710 Plywood Price in Hyderabad"), false);
});

test("optimise and discover tiers both get the full new title system (they only differ in how they got flagged)", () => {
  // Neither slug is in the snapshot, so both resolve to "discover" here —
  // the point is that non-protect tiers are never gated, unlike protect.
  const priced = merino({ slug: "test-optimise-a" });
  const unpriced = century({ slug: "test-discover-a" });
  assert.equal(buildProductTitle(priced), "Merino 22153 Saga Green Laminate — Price & Finishes");
  assert.equal(buildProductTitle(unpriced), "Century Laminates 3903 French Cambric LN");
});
