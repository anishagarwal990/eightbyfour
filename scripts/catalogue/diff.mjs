// Rendering changes for review before anything is written. Every write path
// in this tool goes through a diff first — the default is to print it and
// stop, and --apply is the only way past it.

const MAX_VALUE_CHARS = 90;

function render(value) {
  if (value === null || value === undefined) return "(empty)";
  if (Array.isArray(value)) return value.join(" | ") || "(empty)";
  if (typeof value === "object") return JSON.stringify(value);
  const s = String(value);
  return s.length > MAX_VALUE_CHARS ? `${s.slice(0, MAX_VALUE_CHARS)}…` : s;
}

/** One line per changed column, grouped under the product it belongs to. */
export function printDiff(patches, productsBySlug, { warnFields = {} } = {}) {
  const warnings = new Set();
  let fieldChanges = 0;

  for (const { slug, patch } of patches) {
    const product = productsBySlug.get(slug);
    console.log(`\n${product ? `${product.brand} ${product.name}` : slug}  [${slug}]`);
    for (const [field, next] of Object.entries(patch)) {
      const before = product ? product[field] : undefined;
      console.log(`  ${field}`);
      console.log(`    - ${render(before)}`);
      console.log(`    + ${render(next)}`);
      fieldChanges++;
      if (warnFields[field]) warnings.add(`${field}: ${warnFields[field]}`);
    }
  }

  if (warnings.size > 0) {
    console.log("\nHeads up:");
    for (const warning of warnings) console.log(`  ! ${warning}`);
  }
  return { products: patches.length, fieldChanges };
}
