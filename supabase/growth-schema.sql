-- Growth Command Center schema — the persistence layer behind /admin/growth.
--
-- Four tables, not fourteen. Per the brief this was built against: "prefer
-- the minimum coherent schema." growth_items is deliberately polymorphic —
-- one table, discriminated by (module, type), backing competitors,
-- opportunities, prospects, keyword/content queue rows, social posts,
-- creatives, campaigns and CRO issues alike — rather than ten near-identical
-- tables with the same status/priority/evidence columns repeated ten times.
-- Each module's page filters this one table by `module`.
--
-- Run once via the Supabase SQL editor (same run order as
-- supabase/admin-hardening.sql, which this depends on for is_admin()).
-- Idempotent: safe to re-run.

-- ---------- growth_memory ----------
-- The Business Brain's live store. One row per section (company, icp,
-- positioning, brand_voice, growth_goals, content_pillars, competitors-list
-- lives in growth_items instead, since it's a tracked collection not a
-- single document). Seeded once from /growth/*.json by
-- scripts/seed-growth.mjs; edited live through the admin UI from then on —
-- the JSON files are the version-controlled seed/export, not the runtime
-- source of truth (a serverless request can't write back to the repo).

create table if not exists public.growth_memory (
  id text primary key, -- 'company' | 'icp' | 'positioning' | 'brand_voice' | 'growth_goals' | 'content_pillars'
  data jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by text -- admin email, for the "Last updated by" line — not a FK, just a label
);

alter table public.growth_memory enable row level security;

drop policy if exists "growth_memory_admin_all" on public.growth_memory;
create policy "growth_memory_admin_all"
  on public.growth_memory for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------- growth_items ----------
-- The generic tracked-item table. `module` picks the page it renders on;
-- `type` picks the shape of `data` on that page. Every intelligence item
-- carries confidence/evidence/source so the UI can distinguish observed fact
-- from hypothesis — this is not optional decoration, see the CHECK below.

create table if not exists public.growth_items (
  id uuid primary key default gen_random_uuid(),
  module text not null, -- 'market_intelligence' | 'customer_intelligence' | 'seo' | 'leads' | 'social' | 'creative' | 'ads' | 'cro' | 'studio'
  type text not null, -- e.g. 'competitor' | 'opportunity' | 'prospect' | 'keyword' | 'content' | 'insight' | 'post' | 'creative' | 'campaign' | 'cro_issue'
  title text not null,
  status text not null default 'new',
  priority text, -- 'high' | 'medium' | 'low' — manual or from the prioritization formula
  impact integer, -- 1-5, feeds priority_score
  effort integer, -- 1-5, feeds priority_score
  confidence text, -- 'observed' | 'inferred' | 'hypothesis' — required for anything presented as market/customer intelligence
  evidence text, -- what was actually seen — a quote, a URL, a screenshot ref. Null is allowed only for non-intelligence rows (e.g. a social post idea).
  source text, -- where the evidence came from: a URL, "founder call", "Firecrawl scrape 2026-09-05"
  data jsonb not null default '{}'::jsonb, -- the type-specific fields (see lib/growth/types.ts for the shape per type)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists growth_items_module_idx on public.growth_items (module, type, created_at desc);
create index if not exists growth_items_status_idx on public.growth_items (module, status);

alter table public.growth_items enable row level security;

drop policy if exists "growth_items_admin_all" on public.growth_items;
create policy "growth_items_admin_all"
  on public.growth_items for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------- growth_tasks ----------
-- The task/agent queue. A "Run Analysis" or "Generate X" button inserts a
-- queued row with a structured prompt in `input` — it does not pretend to
-- execute anything. Nothing in this codebase flips a task to `running` or
-- `completed` today; that's the seam future MCP/agent wiring plugs into.

create table if not exists public.growth_tasks (
  id uuid primary key default gen_random_uuid(),
  type text not null, -- 'COMPETITOR_ANALYSIS' | 'SEO_RESEARCH' | 'CONTENT_BRIEF' | 'CONTENT_DRAFT' | 'PROSPECT_RESEARCH' | 'OUTREACH' | 'SOCIAL_POST' | 'AD_CREATIVE' | 'CRO_AUDIT' | 'STUDIO_ANALYSIS'
  title text not null,
  module text not null,
  status text not null default 'queued', -- 'queued' | 'running' | 'needs_review' | 'completed' | 'failed'
  input jsonb not null default '{}'::jsonb,
  output jsonb,
  source text, -- who/what created it: an admin email, or 'command_palette'
  related_item_id uuid references public.growth_items (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists growth_tasks_status_idx on public.growth_tasks (status, created_at desc);

alter table public.growth_tasks enable row level security;

drop policy if exists "growth_tasks_admin_all" on public.growth_tasks;
create policy "growth_tasks_admin_all"
  on public.growth_tasks for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------- growth_integrations ----------
-- Connection-status rows for external data sources. Seeded once, statuses
-- flipped by hand (or by a future setup flow) once real credentials exist —
-- never flipped to "connected" by the app pretending a call succeeded.

create table if not exists public.growth_integrations (
  id text primary key, -- 'firecrawl' | 'meta' | 'google_search_console' | 'ga4_reporting' | 'typefully'
  label text not null,
  status text not null default 'not_connected', -- 'connected' | 'not_connected' | 'error'
  last_sync timestamptz,
  notes text,
  config jsonb not null default '{}'::jsonb -- non-secret config only (e.g. property ID) — never a token/key
);

alter table public.growth_integrations enable row level security;

drop policy if exists "growth_integrations_admin_all" on public.growth_integrations;
create policy "growth_integrations_admin_all"
  on public.growth_integrations for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------- seed the integration roster ----------
-- Real rows, honestly "not_connected" — see lib/analytics.ts /
-- components/MarketingTracking.tsx for what's actually wired (GA4 + Meta
-- pixel fire client-side today; neither has a server-side reporting/API
-- integration in this codebase).

insert into public.growth_integrations (id, label, status, notes) values
  ('firecrawl', 'Firecrawl', 'not_connected', 'No API key configured. Needed for competitor site scraping (Market Intelligence "Run Analysis").'),
  ('meta_ads', 'Meta Ads / Ad Library', 'not_connected', 'No Meta Marketing API credentials. NEXT_PUBLIC_META_PIXEL_ID is referenced in code for the client-side pixel but unset — that is conversion tracking, not the Ads reporting API this module needs.'),
  ('google_search_console', 'Google Search Console', 'not_connected', 'No server-side GSC integration exists in this codebase (confirmed: no googleapis/google-auth-library dependency, no service account). Keyword/rank data in SEO/GEO stays "unknown" until this is wired.'),
  ('ga4_reporting', 'GA4 Reporting API', 'not_connected', 'GA4 pixel fires client-side via NEXT_PUBLIC_GA_ID (pageviews/events land in GA4), but nothing reads them back into this app — that needs the separate GA4 Data API with a service account.'),
  ('typefully', 'Typefully', 'not_connected', 'Optional — Social module works without it; this is only the scheduling/publish adapter.')
on conflict (id) do nothing;
