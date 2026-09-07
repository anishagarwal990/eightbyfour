-- Enquiry OS — Slice 2: EightByFour commercial Rate Book + quotes with
-- versions and alternative options.
--
-- SAFETY CONTRACT
-- --------------
-- ADDITIVE ONLY. No table dropped or renamed, no column dropped/renamed/
-- retyped, no row deleted. Every statement idempotent — re-running is a no-op.
--
-- Touches existing objects only through new foreign keys, all non-destructive:
--   * quotes -> inquiries(id)                ON DELETE RESTRICT
--   * quotes.customer_id -> customers(id)    ON DELETE SET NULL
--   * quote_items.enquiry_item_id -> inquiry_items(id)  ON DELETE SET NULL
--   * quote_rates.product_id / quote_items.product_id -> products(id)  ON DELETE SET NULL
-- Nothing here writes to inquiries/inquiry_items/customers/products. The
-- enquiry status is only ever changed later, at runtime, by mark_quote_ready()
-- through the caller's own JWT (RLS still applies).
--
-- This slice deliberately has NO supplier / cost / margin / markup concept.
-- The Rate Book stores the rate EightByFour QUOTES AT. Procurement is a
-- separate later module.
--
-- Run order: after supabase/enquiry-os-slice1.sql (needs is_admin(),
-- set_updated_at()).
--
-- Reversal: commented DOWN block at the end.

-- ========================================================== quote_rates ==
-- The EightByFour commercial Rate Book. One row = one rate EightByFour is
-- willing to quote for a given brand / product / spec, on a given pricing
-- basis. `product_id` is an OPTIONAL link to the public catalogue: the
-- catalogue does not model every commercial variant (and its price_table is
-- only a min/max range), so a rate must be creatable without one.
--
-- `rate` is the ONE source number, stored exactly as the operator typed it;
-- `rate_input_mode` records whether that number was ex-GST or inclusive. The
-- ex/incl equivalents are always derived, never stored as independently
-- editable columns.

create table if not exists public.quote_rates (
  id uuid primary key default gen_random_uuid(),
  product_id integer references public.products (id) on delete set null,

  category text,
  brand text,
  product_name text,
  range_name text,
  thickness text,
  grade text,
  finish text,
  size text,

  pricing_basis text not null default 'PER_SQFT' check (pricing_basis in (
    'PER_SQFT', 'PER_SHEET', 'PER_UNIT', 'PER_PIECE', 'PER_PAIR', 'PER_SET',
    'PER_BOX', 'PER_RUNNING_FT', 'PER_RUNNING_M', 'PER_KG', 'PER_PACK', 'MANUAL'
  )),

  -- Sheet geometry for area-based pricing. Nullable: a hardware rate has no
  -- sheet. 8ft x 4ft / 32 sqft is the common board default, applied by the
  -- form, never forced by the schema.
  sheet_width_ft  numeric(10, 3) check (sheet_width_ft  is null or sheet_width_ft  > 0),
  sheet_length_ft numeric(10, 3) check (sheet_length_ft is null or sheet_length_ft > 0),
  sheet_area_sqft numeric(12, 4) check (sheet_area_sqft is null or sheet_area_sqft > 0),

  rate numeric(14, 4) not null check (rate >= 0),
  rate_input_mode text not null default 'EX_GST' check (rate_input_mode in ('EX_GST', 'INCL_GST')),
  gst_rate numeric(5, 2) not null default 18 check (gst_rate >= 0 and gst_rate <= 100),

  warranty_text text,
  notes text,

  effective_from date not null default current_date,
  effective_to date,
  active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null
);

create index if not exists quote_rates_brand_lower_idx   on public.quote_rates (lower(brand));
create index if not exists quote_rates_name_lower_idx    on public.quote_rates (lower(product_name));
create index if not exists quote_rates_range_lower_idx   on public.quote_rates (lower(range_name));
create index if not exists quote_rates_thickness_idx     on public.quote_rates (thickness);
create index if not exists quote_rates_category_idx      on public.quote_rates (category);
create index if not exists quote_rates_basis_idx         on public.quote_rates (pricing_basis);
create index if not exists quote_rates_active_idx        on public.quote_rates (active);
create index if not exists quote_rates_product_idx       on public.quote_rates (product_id) where product_id is not null;

drop trigger if exists quote_rates_set_updated_at on public.quote_rates;
create trigger quote_rates_set_updated_at before update on public.quote_rates
  for each row execute function public.set_updated_at();

-- ============================================================== quotes ==

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique,
  -- RESTRICT: a quote must never be silently orphaned from its enquiry — the
  -- enquiry is the operational spine and carries the quote's timeline.
  inquiry_id uuid not null references public.inquiries (id) on delete restrict,
  customer_id uuid references public.customers (id) on delete set null,
  status text not null default 'DRAFT' check (status in ('DRAFT', 'READY')),
  current_version integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null
);

create index if not exists quotes_inquiry_idx   on public.quotes (inquiry_id);
create index if not exists quotes_ref_lower_idx on public.quotes (lower(ref));
create index if not exists quotes_status_idx    on public.quotes (status);

drop trigger if exists quotes_set_updated_at on public.quotes;
create trigger quotes_set_updated_at before update on public.quotes
  for each row execute function public.set_updated_at();

-- ======================================================= quote_versions ==
-- One row per Q-XXXX-Vn. `frozen_at` is the immutability switch: null = live
-- draft, non-null = locked, and the DB rejects further edits to it or its
-- options / items (triggers below). Freezing is one-way. Action-layer
-- invariant: at most one non-frozen version per quote, always the highest
-- version_no.
--
-- `pricing_display` controls CUSTOMER PRESENTATION ONLY (rates shown ex-GST or
-- inclusive). It never changes a stored amount.

create table if not exists public.quote_versions (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes (id) on delete cascade,
  version_no integer not null check (version_no >= 1),
  status text not null default 'DRAFT' check (status in ('DRAFT', 'READY')),
  label text,
  pricing_display text not null default 'EX_GST' check (pricing_display in ('EX_GST', 'INCL_GST')),
  customer_snapshot jsonb not null default '{}'::jsonb,
  terms jsonb not null default '{}'::jsonb,
  tax_assumption text not null default 'GST as applicable',
  revision_reason text,
  frozen_at timestamptz,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  unique (quote_id, version_no)
);

create index if not exists quote_versions_quote_idx on public.quote_versions (quote_id, version_no desc);

-- ======================================================== quote_options ==
-- Alternatives the customer chooses BETWEEN — never summed. "Austin Gold" and
-- "Marine Blue" are two options on one version. Each carries its own
-- additional charges, each charge with its own taxable flag, plus a
-- totals_snapshot written at freeze.

create table if not exists public.quote_options (
  id uuid primary key default gen_random_uuid(),
  quote_version_id uuid not null references public.quote_versions (id) on delete cascade,
  label text not null,
  brand text,
  range_name text,
  warranty_text text,
  customer_notes text,
  sort_order integer not null default 0,

  option_discount   numeric(14, 2) not null default 0 check (option_discount   >= 0),
  freight           numeric(14, 2) not null default 0 check (freight           >= 0),
  freight_taxable   boolean not null default true,
  loading_unloading numeric(14, 2) not null default 0 check (loading_unloading >= 0),
  loading_taxable   boolean not null default true,
  packing           numeric(14, 2) not null default 0 check (packing           >= 0),
  packing_taxable   boolean not null default true,
  other_charges     numeric(14, 2) not null default 0 check (other_charges     >= 0),
  other_taxable     boolean not null default true,
  charges_gst_rate  numeric(5, 2)  not null default 18 check (charges_gst_rate >= 0 and charges_gst_rate <= 100),
  -- null = auto-round the grand total to the nearest rupee; a value pins an
  -- explicit adjustment.
  round_off numeric(14, 2),

  totals_snapshot jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists quote_options_version_idx on public.quote_options (quote_version_id, sort_order);

drop trigger if exists quote_options_set_updated_at on public.quote_options;
create trigger quote_options_set_updated_at before update on public.quote_options
  for each row execute function public.set_updated_at();

-- ========================================================== quote_items ==
-- One row per (option x requirement line). `enquiry_item_id` is a SHARED
-- reference: the 19mm line under Austin Gold and the 19mm line under Marine
-- Blue both point at the same inquiry_items row. SET NULL so editing the
-- enquiry later cannot delete quote history.
--
-- Every column below the "snapshot" line is frozen the moment it is written:
-- a historical version reads these, never the live Rate Book / catalogue.

create table if not exists public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_option_id uuid not null references public.quote_options (id) on delete cascade,
  enquiry_item_id uuid references public.inquiry_items (id) on delete set null,
  sort_order integer not null default 0,

  rate_book_id uuid references public.quote_rates (id) on delete set null,
  product_id integer references public.products (id) on delete set null,
  match_state text not null default 'UNRESOLVED'
    check (match_state in ('RATE_BOOK', 'MANUAL', 'UNRESOLVED')),

  -- ---- description snapshot ----
  description text,
  category text,
  brand text,
  product_name text,
  range_name text,
  thickness text,
  grade text,
  finish text,
  size text,

  quantity numeric(14, 3) not null default 0 check (quantity >= 0),
  unit text not null default 'sheet',

  pricing_basis text not null default 'PER_SQFT' check (pricing_basis in (
    'PER_SQFT', 'PER_SHEET', 'PER_UNIT', 'PER_PIECE', 'PER_PAIR', 'PER_SET',
    'PER_BOX', 'PER_RUNNING_FT', 'PER_RUNNING_M', 'PER_KG', 'PER_PACK', 'MANUAL'
  )),
  sheet_width_ft  numeric(10, 3),
  sheet_length_ft numeric(10, 3),
  sheet_area_sqft numeric(12, 4),
  -- Derived and stored: sheets x area for PER_SQFT, else quantity.
  pricing_quantity numeric(18, 4) not null default 0 check (pricing_quantity >= 0),

  gst_rate numeric(5, 2) not null default 18 check (gst_rate >= 0 and gst_rate <= 100),
  rate_input_mode text not null default 'EX_GST' check (rate_input_mode in ('EX_GST', 'INCL_GST')),

  -- The number the operator typed for THIS quote line.
  entered_rate numeric(14, 4) check (entered_rate is null or entered_rate >= 0),
  -- What the Rate Book held when the rate was applied (for the override diff).
  rate_book_rate_snapshot numeric(14, 4),
  rate_book_mode_snapshot text,
  is_overridden boolean not null default false,

  -- Normalised equivalents, always derived from entered_rate + gst_rate.
  base_rate_ex_gst numeric(14, 4) check (base_rate_ex_gst is null or base_rate_ex_gst >= 0),
  rate_incl_gst    numeric(14, 4) check (rate_incl_gst is null or rate_incl_gst >= 0),

  line_discount numeric(14, 2) not null default 0 check (line_discount >= 0),
  -- For pricing_basis MANUAL: operator types the taxable amount directly.
  manual_amount numeric(16, 2) check (manual_amount is null or manual_amount >= 0),

  taxable_amount  numeric(16, 2) not null default 0,
  gst_amount      numeric(16, 2) not null default 0,
  amount_incl_gst numeric(16, 2) not null default 0,

  warranty_text text,
  customer_note text,
  internal_note text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists quote_items_option_idx      on public.quote_items (quote_option_id, sort_order);
create index if not exists quote_items_enquiry_item_idx on public.quote_items (enquiry_item_id);
create index if not exists quote_items_rate_book_idx    on public.quote_items (rate_book_id) where rate_book_id is not null;

drop trigger if exists quote_items_set_updated_at on public.quote_items;
create trigger quote_items_set_updated_at before update on public.quote_items
  for each row execute function public.set_updated_at();

-- =============================================== immutability enforcement ==
-- A frozen version's options and items cannot change. Backs the action-layer
-- rule so a stray query or a future bug still cannot rewrite a finalised quote.

create or replace function public.quote_version_is_frozen(p_version_id uuid)
returns boolean language sql stable as $fn$
  select frozen_at is not null from public.quote_versions where id = p_version_id;
$fn$;

create or replace function public.reject_frozen_quote_option_write()
returns trigger language plpgsql as $fn$
begin
  if public.quote_version_is_frozen(coalesce(new.quote_version_id, old.quote_version_id)) then
    raise exception 'quote option belongs to a frozen quote version and cannot be changed'
      using errcode = 'check_violation';
  end if;
  return coalesce(new, old);
end;
$fn$;

create or replace function public.reject_frozen_quote_item_write()
returns trigger language plpgsql as $fn$
declare
  v_version_id uuid;
begin
  select quote_version_id into v_version_id
  from public.quote_options where id = coalesce(new.quote_option_id, old.quote_option_id);
  if public.quote_version_is_frozen(v_version_id) then
    raise exception 'quote item belongs to a frozen quote version and cannot be changed'
      using errcode = 'check_violation';
  end if;
  return coalesce(new, old);
end;
$fn$;

create or replace function public.reject_frozen_quote_version_write()
returns trigger language plpgsql as $fn$
begin
  if tg_op = 'DELETE' then
    raise exception 'quote versions are append-only and cannot be deleted' using errcode = 'check_violation';
  end if;
  if old.frozen_at is not null then
    raise exception 'quote version % is frozen', old.id using errcode = 'check_violation';
  end if;
  return new;
end;
$fn$;

drop trigger if exists quote_options_frozen_guard on public.quote_options;
create trigger quote_options_frozen_guard before update or delete on public.quote_options
  for each row execute function public.reject_frozen_quote_option_write();

drop trigger if exists quote_items_frozen_guard on public.quote_items;
create trigger quote_items_frozen_guard before insert or update or delete on public.quote_items
  for each row execute function public.reject_frozen_quote_item_write();

drop trigger if exists quote_versions_frozen_guard on public.quote_versions;
create trigger quote_versions_frozen_guard before update or delete on public.quote_versions
  for each row execute function public.reject_frozen_quote_version_write();

-- ================================================= mark_quote_ready(...) ==
-- One transaction: snapshot per-option totals, freeze the current version,
-- flip both status rows, move the enquiry to QUOTE_READY, log the timeline
-- event. SECURITY INVOKER (default) so the caller's RLS still governs every
-- write — this is here for atomicity, not to escalate.

create or replace function public.mark_quote_ready(p_quote_id uuid, p_totals jsonb default '{}'::jsonb)
returns void language plpgsql as $fn$
declare
  v_quote public.quotes;
  v_version public.quote_versions;
  v_actor_email text;
begin
  select * into v_quote from public.quotes where id = p_quote_id for update;
  if v_quote.id is null then raise exception 'quote % not found', p_quote_id; end if;

  select * into v_version from public.quote_versions
    where quote_id = p_quote_id order by version_no desc limit 1 for update;
  if v_version.id is null then raise exception 'quote % has no version', p_quote_id; end if;

  update public.quote_options o
     set totals_snapshot = coalesce(p_totals -> (o.id::text), o.totals_snapshot)
   where o.quote_version_id = v_version.id;

  update public.quote_versions
     set status = 'READY', frozen_at = now()
   where id = v_version.id;

  update public.quotes
     set status = 'READY', current_version = v_version.version_no, updated_by = auth.uid()
   where id = p_quote_id;

  update public.inquiries
     set status = 'QUOTE_READY', updated_by = auth.uid()
   where id = v_quote.inquiry_id;

  -- The `authenticated` role cannot read auth.users; take the email from the
  -- request JWT claims, which the invoker always has.
  begin
    v_actor_email := nullif(current_setting('request.jwt.claims', true)::json ->> 'email', '');
  exception when others then
    v_actor_email := null;
  end;

  insert into public.inquiry_activity (inquiry_id, kind, summary, detail, entity_type, entity_id, actor_email, actor_id)
  values (
    v_quote.inquiry_id, 'QUOTE_READY',
    'Quote ' || v_quote.ref || ' V' || v_version.version_no || ' marked ready.',
    jsonb_build_object('quote_ref', v_quote.ref, 'version', v_version.version_no),
    'quote', p_quote_id::text, coalesce(v_actor_email, 'system@eightbyfour.com'), auth.uid()
  );
end;
$fn$;

-- ================================================================= RLS ==
-- Every table here is internal commercial data. Admin-only, all verbs, via
-- is_admin(). No anon grant.

alter table public.quote_rates    enable row level security;
alter table public.quotes         enable row level security;
alter table public.quote_versions enable row level security;
alter table public.quote_options  enable row level security;
alter table public.quote_items    enable row level security;

drop policy if exists "quote_rates_admin_all" on public.quote_rates;
create policy "quote_rates_admin_all" on public.quote_rates for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "quotes_admin_all" on public.quotes;
create policy "quotes_admin_all" on public.quotes for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "quote_versions_admin_all" on public.quote_versions;
create policy "quote_versions_admin_all" on public.quote_versions for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "quote_options_admin_all" on public.quote_options;
create policy "quote_options_admin_all" on public.quote_options for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "quote_items_admin_all" on public.quote_items;
create policy "quote_items_admin_all" on public.quote_items for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- ================================================================ DOWN ==
-- drop function if exists public.mark_quote_ready(uuid, jsonb);
-- drop trigger if exists quote_versions_frozen_guard on public.quote_versions;
-- drop trigger if exists quote_items_frozen_guard on public.quote_items;
-- drop trigger if exists quote_options_frozen_guard on public.quote_options;
-- drop function if exists public.reject_frozen_quote_version_write();
-- drop function if exists public.reject_frozen_quote_item_write();
-- drop function if exists public.reject_frozen_quote_option_write();
-- drop function if exists public.quote_version_is_frozen(uuid);
-- drop table if exists public.quote_items;
-- drop table if exists public.quote_options;
-- drop table if exists public.quote_versions;
-- drop table if exists public.quotes;
-- drop table if exists public.quote_rates;
