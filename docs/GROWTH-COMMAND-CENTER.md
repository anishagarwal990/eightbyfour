# Growth Command Center

`/admin/growth` — the internal operating interface for competitor intelligence, customer intelligence, SEO/GEO, lead generation, social, creative, Meta Ads, website CRO, Studio EightByFour and growth analytics, all reading from one persistent business-context layer.

Sits inside the existing `/admin` area and its auth — no new authentication mechanism. See [ADMIN.md](ADMIN.md) for the auth setup (`admin_users` allowlist, `is_admin()`); do that first if `/admin/growth` shows "No access".

---

## The business memory

`/growth/*.md` and `/growth/*.json` in the repo root are the version-controlled **seed** — human-readable, AI-readable, the one place that says who EightByFour is, what it sells, who buys it, and how it should sound. Read `growth/memory.md` first.

They are not the live source of truth. A Vercel deployment can't write back to its own repo at runtime, so the admin UI (Business Brain) reads and edits the `growth_memory` table instead, seeded once from these files:

```bash
node scripts/seed-growth.mjs
```

Safe to re-run — it upserts `growth_memory` sections and skips any `growth_items` row (competitors, campaign ideas, Studio services) that already exists by title, so hand-edited data in the DB is never clobbered by a re-seed.

If you edit the JSON files and want that pushed live, re-run the seed script. If you edit the Business Brain UI, the DB is now ahead of the files — export back into `/growth/*.json` by hand if you want the repo copy to match (no automatic sync either direction, deliberately, to keep the write path simple).

## Schema

One additive file, `supabase/growth-schema.sql`, applied once via the Supabase SQL editor (same run order as `admin-hardening.sql`, which it depends on for `is_admin()`). Four tables:

- **`growth_memory`** — one row per Business Brain section.
- **`growth_items`** — polymorphic, discriminated by `(module, type)`. Backs competitors, opportunities, prospects, keyword/content-queue rows, social posts, creative briefs, campaigns, campaign ideas, CRO issues, Studio services and Studio content ideas — one table instead of ten near-identical ones. Every intelligence-flavoured row carries `confidence` (`observed` / `inferred` / `hypothesis`), `evidence` and `source`, so a guess is never shown as a fact.
- **`growth_tasks`** — the `GrowthTask` queue. A module's "Run Analysis" button or a command-palette action inserts a `queued` row with a structured prompt in `input`. Nothing in this codebase flips a task to `running`/`completed` — that's the seam a future agent/MCP wiring plugs into.
- **`growth_integrations`** — connection-status rows for Firecrawl, Meta Ads, Google Search Console, GA4 Reporting, Typefully. Seeded `not_connected`, with a note on exactly what's missing. Flip to `connected` by hand once real credentials exist — never by the app pretending a call succeeded.

RLS on all four: `is_admin()`-gated, same pattern as `products`/`brands`. See `lib/growth/queries.ts` for the typed data-access layer and `app/admin/growth/actions.ts` for the Server Actions (both re-check `requireAdmin()` per the layered-guard model in ADMIN.md).

## What's real vs. what's a queued task

Every number on Overview and Growth Analytics is either a real query (inquiry counts and UTM channel split come straight from `public.inquiries`; the SEO page-gap table is computed live from `lib/categories.ts` × `lib/pricePages.ts`) or an explicit "Not connected" block — never a placeholder number standing in for one that isn't wired yet.

"Run Analysis" / "Generate…" buttons and the command palette (⌘K) create a `growth_tasks` row and stop there. They do not call Firecrawl, an LLM, or Meta — none of those are connected (see Integrations). This is the intended v1 shape per the brief this was built against: the task/agent architecture exists so a human or a future agent has a concrete, evidence-anchored starting point, without the app claiming to have already done the work.

## Adding a new item type to an existing module

1. Add the shape to `lib/growth/types.ts` (a `*Data` interface) — documentation and a compile-time contract, not DB-enforced.
2. Render it in the relevant module page (`app/admin/growth/<module>/page.tsx`), reading `item.data as Partial<YourData>`.
3. Give it a `QuickAddForm` with the fields worth capturing on creation; anything else gets added by extending the item after creation (no per-type edit form exists yet beyond `updateItemAction`).

## Adding a new integration

1. Insert a row into `growth_integrations` (id, label, `not_connected`, a note on what's missing).
2. It shows up automatically in Overview and Growth Analytics — no UI change needed for the status card.
3. When real credentials exist, write the adapter (a `lib/growth/integrations/<name>.ts` file is the natural home — none exist yet) and flip the row to `connected` once it's actually calling the API, not before.

## Known limitation (inherited from `/admin` generally)

`/admin/growth` still renders inside the public site's header/footer/ticker — `app/layout.tsx` is the only root layout, and there's no `app/(admin)` route group yet. Already flagged in ADMIN.md as "not built yet"; not re-fixed here.
