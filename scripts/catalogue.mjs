#!/usr/bin/env node
// Catalogue editing tool — export the products table to CSV, edit it in a
// spreadsheet, review a diff, then write it back.
//
// Replaces the pattern of writing a new one-off scripts/set-*.mjs for every
// data change: those hardcode their values, run once, and leave no record of
// what they changed or any way to reverse it.
//
// Nothing writes without --apply, and every --apply snapshots the affected
// rows to scripts/snapshots/ first.
//
//   node scripts/catalogue.mjs export fields --category Plywood -o ply.csv
//   node scripts/catalogue.mjs export rates --category Plywood -o rates.csv
//   node scripts/catalogue.mjs import fields ply.csv          # diff only
//   node scripts/catalogue.mjs import fields ply.csv --apply
//   node scripts/catalogue.mjs snapshots
//   node scripts/catalogue.mjs restore scripts/snapshots/<file>.json --apply

import { readFileSync, writeFileSync } from "fs";
import { parseArgs } from "util";
import { parse, stringify } from "./catalogue/csv.mjs";
import { client, fetchAll, applyPatches } from "./catalogue/db.mjs";
import { CONTEXT_FIELDS, EDITABLE_FIELDS, FIELD_NAMES, fromCell, sameValue, toCell } from "./catalogue/fields.mjs";
import { RATE_HEADERS, toRateRows, fromRateRows } from "./catalogue/rates.mjs";
import { printDiff } from "./catalogue/diff.mjs";
import { writeSnapshot, readSnapshot, listSnapshots, SNAPSHOT_DIR } from "./catalogue/snapshot.mjs";

const { values: flags, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    category: { type: "string" },
    brand: { type: "string" },
    fields: { type: "string" },
    out: { type: "string", short: "o" },
    apply: { type: "boolean", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
});

const USAGE = `
catalogue — edit the products table through CSV

  export fields [--category X] [--brand Y] [--fields a,b,c] -o file.csv
      Scalar and list columns, one row per product.

  export rates [--category X] [--brand Y] -o file.csv
      Per-thickness rate grid, one row per product/core/size/thickness.
      Products with no rates yet are seeded with blank cells to fill in.

  import fields file.csv [--apply]
  import rates  file.csv [--apply]
      Prints a diff. Writes only with --apply, after snapshotting.

  snapshots                       List saved snapshots.
  restore <snapshot.json> [--apply]   Roll back to a snapshot.

Editable columns: ${FIELD_NAMES.join(", ")}
Never writable: id, slug, created_at, updated_at (slug is the live URL).
`;

function fail(message) {
  console.error(`\n${message}\n`);
  process.exit(1);
}

function selection() {
  return { category: flags.category ?? null, brand: flags.brand ?? null };
}

function describeSelection(count) {
  const parts = [];
  if (flags.category) parts.push(`category "${flags.category}"`);
  if (flags.brand) parts.push(`brand "${flags.brand}"`);
  return `${count} products${parts.length ? ` (${parts.join(", ")})` : ""}`;
}

async function exportFields(sb) {
  const chosen = flags.fields ? flags.fields.split(",").map((f) => f.trim()).filter(Boolean) : FIELD_NAMES;
  const unknown = chosen.filter((f) => !EDITABLE_FIELDS[f]);
  if (unknown.length) fail(`Not editable columns: ${unknown.join(", ")}\nEditable: ${FIELD_NAMES.join(", ")}`);

  const products = await fetchAll(sb, selection());
  const headers = [...CONTEXT_FIELDS, ...chosen];
  const rows = products.map((p) => {
    const row = { slug: p.slug };
    for (const field of chosen) row[field] = toCell(field, p[field]);
    return row;
  });
  const path = flags.out ?? "catalogue-fields.csv";
  writeFileSync(path, stringify(headers, rows));
  console.log(`Wrote ${path} — ${describeSelection(rows.length)}, ${chosen.length} editable columns.`);
}

async function exportRates(sb) {
  const products = await fetchAll(sb, selection());
  const rows = toRateRows(products);
  if (rows.length === 0) fail("No products with thicknesses matched that selection.");
  const path = flags.out ?? "catalogue-rates.csv";
  writeFileSync(path, stringify(RATE_HEADERS, rows));
  const blank = rows.filter((r) => r.rate === "").length;
  console.log(`Wrote ${path} — ${rows.length} rate cells across ${new Set(rows.map((r) => r.slug)).size} products.`);
  console.log(`${blank} cells need a rate; ${rows.length - blank} already have one.`);
  console.log(`Fill the "rate" column (₹ per unit, excl. GST). Leave blank if unknown, "n/a" if that thickness is not stocked.`);
}

function readCsv(path) {
  let text;
  try {
    text = readFileSync(path, "utf8");
  } catch {
    fail(`Cannot read ${path}`);
  }
  try {
    return parse(text);
  } catch (error) {
    fail(`${path}: ${error.message}`);
  }
}

async function importFields(sb, path) {
  const { headers, records } = readCsv(path);
  if (!headers.includes("slug")) fail(`${path} has no "slug" column — that is how rows are matched to products.`);

  const editable = headers.filter((h) => EDITABLE_FIELDS[h]);
  const ignored = headers.filter((h) => h !== "slug" && !EDITABLE_FIELDS[h]);
  if (editable.length === 0) fail(`${path} has no editable columns. Editable: ${FIELD_NAMES.join(", ")}`);

  const slugs = [...new Set(records.map((r) => r.slug?.trim()).filter(Boolean))];
  const products = await fetchAll(sb, { slugs });
  const bySlug = new Map(products.map((p) => [p.slug, p]));

  const patches = [];
  const problems = [];
  records.forEach((record, index) => {
    const slug = record.slug?.trim();
    if (!slug) return;
    const product = bySlug.get(slug);
    if (!product) {
      problems.push(`Line ${index + 2}: no product with slug "${slug}".`);
      return;
    }
    const patch = {};
    for (const field of editable) {
      const next = fromCell(field, record[field]);
      if (!sameValue(product[field], next)) patch[field] = next;
    }
    if (Object.keys(patch).length > 0) patches.push({ slug, patch });
  });

  if (ignored.length) console.log(`Ignoring non-editable columns: ${ignored.join(", ")}`);
  await review(sb, patches, bySlug, problems, "fields", {
    warnFields: Object.fromEntries(Object.entries(EDITABLE_FIELDS).filter(([, spec]) => spec.warn).map(([name, spec]) => [name, spec.warn])),
  });
}

async function importRates(sb, path) {
  const { headers, records } = readCsv(path);
  for (const required of ["slug", "thickness", "rate"]) {
    if (!headers.includes(required)) fail(`${path} has no "${required}" column.`);
  }
  const slugs = [...new Set(records.map((r) => r.slug?.trim()).filter(Boolean))];
  const products = await fetchAll(sb, { slugs });
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const { patches, problems } = fromRateRows(records, bySlug);
  await review(sb, patches, bySlug, problems, "rates");
}

async function review(sb, patches, bySlug, problems, label, diffOptions = {}) {
  if (problems.length) {
    console.log(`\n${problems.length} problem${problems.length === 1 ? "" : "s"} — these rows are skipped:`);
    for (const problem of problems.slice(0, 20)) console.log(`  ${problem}`);
    if (problems.length > 20) console.log(`  … and ${problems.length - 20} more`);
  }

  if (patches.length === 0) {
    console.log("\nNo changes. The file matches what is in the database.");
    return;
  }

  const summary = printDiff(patches, bySlug, diffOptions);
  console.log(`\n${summary.fieldChanges} column change${summary.fieldChanges === 1 ? "" : "s"} across ${summary.products} product${summary.products === 1 ? "" : "s"}.`);

  if (!flags.apply) {
    console.log("\nDry run — nothing written. Re-run with --apply to write these changes.");
    return;
  }

  const affected = patches.map(({ slug }) => bySlug.get(slug)).filter(Boolean);
  const snapshotPath = writeSnapshot(affected, label);
  console.log(`\nSnapshot of the ${affected.length} affected rows: ${snapshotPath}`);

  const results = await applyPatches(sb, patches, {
    onProgress: (done, total) => {
      if (done % 25 === 0 || done === total) process.stdout.write(`\rWriting ${done}/${total}`);
    },
  });
  process.stdout.write("\n");
  console.log(`Updated ${results.updated} product${results.updated === 1 ? "" : "s"}.`);
  if (results.failed.length) {
    console.log(`${results.failed.length} failed:`);
    for (const failure of results.failed.slice(0, 10)) console.log(`  ${failure.slug}: ${failure.message}`);
  }
  console.log(`Roll back with: node scripts/catalogue.mjs restore ${snapshotPath} --apply`);
}

async function restore(sb, path) {
  const snapshot = readSnapshot(path);
  const slugs = snapshot.rows.map((r) => r.slug);
  const current = await fetchAll(sb, { slugs });
  const bySlug = new Map(current.map((p) => [p.slug, p]));

  const patches = [];
  for (const saved of snapshot.rows) {
    const now = bySlug.get(saved.slug);
    if (!now) continue;
    const patch = {};
    for (const [field, value] of Object.entries(saved)) {
      if (["id", "slug", "created_at", "updated_at"].includes(field)) continue;
      if (JSON.stringify(now[field] ?? null) !== JSON.stringify(value ?? null)) patch[field] = value ?? null;
    }
    if (Object.keys(patch).length > 0) patches.push({ slug: saved.slug, patch });
  }

  console.log(`Snapshot taken ${snapshot.takenAt} (${snapshot.label}), ${snapshot.rows.length} rows.`);
  await review(sb, patches, bySlug, [], "pre-restore");
}

async function main() {
  const [command, sub, file] = positionals;
  if (flags.help || !command) {
    console.log(USAGE);
    return;
  }

  if (command === "snapshots") {
    const files = listSnapshots();
    if (files.length === 0) console.log("No snapshots yet — one is written on every --apply.");
    else for (const name of files) console.log(`${SNAPSHOT_DIR}/${name}`);
    return;
  }

  const sb = client();

  if (command === "export") {
    if (sub === "fields") return exportFields(sb);
    if (sub === "rates") return exportRates(sb);
    fail(`Unknown export type "${sub ?? ""}". Use "fields" or "rates".`);
  }
  if (command === "import") {
    if (!file) fail("Give the CSV to import.");
    if (sub === "fields") return importFields(sb, file);
    if (sub === "rates") return importRates(sb, file);
    fail(`Unknown import type "${sub ?? ""}". Use "fields" or "rates".`);
  }
  if (command === "restore") {
    if (!sub) fail("Give the snapshot file to restore.");
    return restore(sb, sub);
  }
  fail(`Unknown command "${command}".${USAGE}`);
}

main().catch((error) => fail(error.stack || error.message));
