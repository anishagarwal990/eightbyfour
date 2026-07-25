import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env") });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[×]/g, "x")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  const { data, error } = await supabase
    .from("products")
    .select("id,brand,name,collection,grade,slug")
    .order("id");
  if (error) throw error;

  const seen = new Map();
  const updates = [];

  for (const p of data) {
    if (p.slug) {
      seen.set(p.slug, (seen.get(p.slug) || 0) + 1);
      continue;
    }
    const base = slugify([p.brand, p.name, p.collection, p.grade].filter(Boolean).join(" "));
    let slug = base;
    let n = seen.get(base) || 0;
    if (n > 0) slug = `${base}-${p.id}`;
    seen.set(base, n + 1);
    updates.push({ id: p.id, slug });
  }

  console.log(`${updates.length} products need slugs (of ${data.length} total).`);

  let done = 0;
  for (const u of updates) {
    const { error: updErr } = await supabase.from("products").update({ slug: u.slug }).eq("id", u.id);
    if (updErr) {
      console.error(`Failed to set slug for product ${u.id}:`, updErr.message);
    } else {
      done++;
    }
  }
  console.log(`Backfilled ${done} slugs.`);
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exitCode = 1;
});
