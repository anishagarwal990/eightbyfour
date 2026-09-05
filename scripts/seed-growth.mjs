#!/usr/bin/env node
// Seeds growth_memory and growth_items (competitors) from the /growth/*.json
// files. Run once after supabase/growth-schema.sql, and again any time the
// JSON files are hand-edited and need pushing back into the DB (the admin UI
// is the live source of truth after that — this is a one-way seed, not sync).
//
//   node scripts/seed-growth.mjs           # upserts growth_memory + inserts
//                                           # missing competitor rows only
//
// Same connection pattern as scripts/apply-schema.mjs: pg + SUPABASE_DB_URL,
// run by a human at a terminal, never from the deployed app.

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config } from "dotenv";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env") });

const growthDir = join(__dirname, "..", "growth");
const readJson = (name) => JSON.parse(readFileSync(join(growthDir, name), "utf8"));

const memorySections = {
  company: readJson("company.json"),
  icp: readJson("icp.json"),
  positioning: readJson("positioning.json"),
  brand_voice: readJson("brand-voice.json"),
  growth_goals: readJson("growth-goals.json"),
  content_pillars: readJson("content-pillars.json"),
};

const competitors = readJson("competitors.json");
const campaignIdeas = readJson("campaign-ideas.json");
const studioServices = readJson("studio-services.json");

const STUDIO_CONTENT_OPPORTUNITIES = [
  "Wardrobe cost calculator",
  "Kitchen cost calculator",
  "Carpenter vs modular comparison",
  "Plywood selector",
  "Shutter selector",
  "Laminate selector",
  "Accessories selector",
];

const client = new pg.Client({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();

  for (const [id, data] of Object.entries(memorySections)) {
    await client.query(
      `insert into public.growth_memory (id, data, updated_by)
       values ($1, $2, 'seed-script')
       on conflict (id) do update set data = excluded.data, updated_at = now(), updated_by = 'seed-script'`,
      [id, JSON.stringify(data)]
    );
    console.log(`  growth_memory: ${id}`);
  }

  for (const c of competitors) {
    const { rows } = await client.query(
      `select id from public.growth_items where module = 'market_intelligence' and type = 'competitor' and title = $1`,
      [c.name]
    );
    if (rows.length > 0) {
      console.log(`  skip (exists): ${c.name}`);
      continue;
    }
    await client.query(
      `insert into public.growth_items (module, type, title, status, data)
       values ('market_intelligence', 'competitor', $1, $2, $3)`,
      [c.name, c.status, JSON.stringify({ url: c.url ?? null, note: c.note ?? null })]
    );
    console.log(`  growth_items: seeded competitor "${c.name}" (${c.status})`);
  }

  async function seedItem(module, type, title, status, data) {
    const { rows } = await client.query(
      `select id from public.growth_items where module = $1 and type = $2 and title = $3`,
      [module, type, title]
    );
    if (rows.length > 0) {
      console.log(`  skip (exists): ${title}`);
      return;
    }
    await client.query(
      `insert into public.growth_items (module, type, title, status, data) values ($1, $2, $3, $4, $5)`,
      [module, type, title, status, JSON.stringify(data)]
    );
    console.log(`  growth_items: seeded ${type} "${title}"`);
  }

  for (const c of campaignIdeas) {
    await seedItem("ads", "campaign_idea", c.name, c.status, { hook: c.hook });
  }

  for (const s of studioServices) {
    await seedItem("studio", "service", s.name, "not_live", { landingPage: s.landingPage, topMaterials: [], croOpportunities: [] });
  }

  for (const title of STUDIO_CONTENT_OPPORTUNITIES) {
    await seedItem("studio", "opportunity", title, "idea", {});
  }

  console.log("Seed complete.");
} catch (err) {
  console.error("Seed failed:", err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
