-- Enquiry OS — Slice 1: customers, requirement line items, attachments,
-- activity timeline, follow-ups.
--
-- SAFETY CONTRACT
-- ---------------
-- This migration is ADDITIVE ONLY.
--   * No table is dropped or renamed.
--   * No existing column is dropped, renamed or retyped.
--   * No existing row is deleted.
--   * Every statement is idempotent — re-running the file is a no-op.
-- The public website enquiry form (components/QuoteRequestForm.tsx) inserts
-- into `inquiries` with the anon key and keeps working untouched: every column
-- it writes is left exactly as it was, and every column added here is nullable
-- or defaulted.
--
-- Run order: after supabase/admin-hardening.sql (this file depends on the
-- public.is_admin() function that file installs).
--
-- Reversal: see the commented DOWN block at the end of this file.

-- ---------------------------------------------------------------- helpers --

-- Shared updated_at trigger. Every new table below carries updated_at and
-- attaches this, so "when did this row last change" is never a lie told by an
-- application that forgot to set it.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- India-first phone normalisation for duplicate DETECTION only. Strips
-- everything but digits and keeps the last 10, so "9703739918",
-- "+91 97037 39918" and "097037-39918" collapse to one comparable key.
--
-- Deliberately NOT backing a unique constraint. Production already contains a
-- counter-example: 9703739918 and +919703739918 are recorded against two
-- different names, which is a real operational case (a shared office or site
-- number). Uniqueness here would block a legitimate second customer; this is
-- a search key that surfaces likely duplicates to staff instead.
create or replace function public.normalize_phone(raw text)
returns text
language sql
immutable
strict
as $$
  select nullif(right(regexp_replace(raw, '[^0-9]', '', 'g'), 10), '');
$$;

-- ---------------------------------------------------------------- customers --

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text,
  phone text,
  -- Generated, so it can never drift from `phone`.
  phone_normalized text generated always as (public.normalize_phone(phone)) stored,
  whatsapp text,
  email text,
  gstin text,
  billing_address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null
);

create index if not exists customers_phone_normalized_idx on public.customers (phone_normalized);
create index if not exists customers_name_lower_idx on public.customers (lower(name));
create index if not exists customers_company_lower_idx on public.customers (lower(company));
create index if not exists customers_email_lower_idx on public.customers (lower(email));

drop trigger if exists customers_set_updated_at on public.customers;
create trigger customers_set_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();

-- ------------------------------------------------- inquiries: new columns --
-- The existing table becomes the canonical enquiry header. Everything below is
-- nullable or defaulted, so the anon-key insert from the website form — which
-- knows about none of these — continues to succeed unchanged.

alter table public.inquiries add column if not exists customer_id uuid references public.customers (id) on delete set null;
alter table public.inquiries add column if not exists source text;
alter table public.inquiries add column if not exists project_name text;
alter table public.inquiries add column if not exists delivery_location text;
alter table public.inquiries add column if not exists required_delivery_date date;
alter table public.inquiries add column if not exists assigned_to uuid references auth.users (id) on delete set null;
alter table public.inquiries add column if not exists priority text;
alter table public.inquiries add column if not exists next_followup_at timestamptz;
alter table public.inquiries add column if not exists requirement_verified_at timestamptz;
-- Brand the customer asked for across the whole requirement ("quote me Mikasa").
-- Per-line brand preferences live on inquiry_items.requested_brand.
alter table public.inquiries add column if not exists requested_brand text;
-- Staff-only. `message` stays the customer's own words (the website form writes it).
alter table public.inquiries add column if not exists internal_notes text;
alter table public.inquiries add column if not exists lost_reason text;
alter table public.inquiries add column if not exists created_by uuid references auth.users (id) on delete set null;
alter table public.inquiries add column if not exists updated_by uuid references auth.users (id) on delete set null;
alter table public.inquiries add column if not exists updated_at timestamptz not null default now();

drop trigger if exists inquiries_set_updated_at on public.inquiries;
create trigger inquiries_set_updated_at
  before update on public.inquiries
  for each row execute function public.set_updated_at();

-- Status pipeline. Existing production rows are all 'new' (verified before
-- writing this migration), so normalise those to 'NEW' FIRST and only then add
-- the constraint — adding it first would fail the very rows we must preserve.
update public.inquiries set status = 'NEW' where status = 'new';

alter table public.inquiries alter column status set default 'NEW';

-- 'new' stays in the allowed list on purpose: a browser holding a cached copy
-- of the old form bundle could still post it, and a 500 on a real customer
-- enquiry is a worse outcome than one lowercase value in the column.
alter table public.inquiries drop constraint if exists inquiries_status_check;
alter table public.inquiries add constraint inquiries_status_check check (
  status in (
    'NEW', 'REQUIREMENT_VERIFIED', 'PRICING', 'QUOTE_READY', 'QUOTE_SENT',
    'NEGOTIATION', 'AWAITING_CUSTOMER', 'AWAITING_SUPPLIER',
    'WON', 'LOST', 'ON_HOLD',
    'new'
  )
);

alter table public.inquiries drop constraint if exists inquiries_source_check;
alter table public.inquiries add constraint inquiries_source_check check (
  source is null or source in ('WHATSAPP', 'WEBSITE', 'PHONE', 'WALK_IN', 'REFERRAL', 'OTHER')
);

-- The only insert path that omits `source` is the public website form — the
-- admin action always sets it explicitly. Defaulting to WEBSITE keeps new
-- website enquiries labelled without the form needing to know the column
-- exists. (Caught in post-migration testing: the backfill labelled the seven
-- historical rows, but a fresh submission was landing with source = NULL.)
alter table public.inquiries alter column source set default 'WEBSITE';

alter table public.inquiries drop constraint if exists inquiries_priority_check;
alter table public.inquiries add constraint inquiries_priority_check check (
  priority is null or priority in ('LOW', 'NORMAL', 'HIGH', 'URGENT')
);

create index if not exists inquiries_customer_id_idx on public.inquiries (customer_id);
create index if not exists inquiries_status_idx on public.inquiries (status);
create index if not exists inquiries_assigned_to_idx on public.inquiries (assigned_to);
create index if not exists inquiries_next_followup_at_idx on public.inquiries (next_followup_at) where next_followup_at is not null;
create index if not exists inquiries_ref_lower_idx on public.inquiries (lower(ref));

-- ------------------------------------------------------------ inquiry_items --
-- Normalised requirement lines. Every specification column is nullable by
-- design: "Liner sheets x 50" is a real enquiry and must be storable exactly
-- as the customer said it. `specification_complete` is a staff judgement, not
-- a computed guess — the system never invents a missing spec.

create table if not exists public.inquiry_items (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.inquiries (id) on delete cascade,
  category text,
  material text,
  requested_brand text,
  requested_product text,
  thickness text,
  size text,
  grade text,
  finish text,
  quantity numeric(12, 3),
  unit text,
  notes text,
  specification_complete boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists inquiry_items_inquiry_id_idx on public.inquiry_items (inquiry_id, sort_order);

drop trigger if exists inquiry_items_set_updated_at on public.inquiry_items;
create trigger inquiry_items_set_updated_at
  before update on public.inquiry_items
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------ inquiry_attachments --
-- Metadata only; bytes live in the private `enquiry-attachments` storage
-- bucket created at the bottom of this file. `storage_path` is the object key
-- within that bucket — never a public URL, because the bucket is not public
-- and the app serves these through short-lived signed URLs.

create table if not exists public.inquiry_attachments (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.inquiries (id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  size_bytes bigint,
  kind text not null default 'OTHER' check (kind in ('IMAGE', 'PDF', 'SPREADSHEET', 'DOCUMENT', 'OTHER')),
  caption text,
  -- Reserved for the later AI-extraction slice: the raw extraction payload is
  -- parked here for staff review and never auto-applied to inquiry_items.
  extraction_status text not null default 'NONE' check (extraction_status in ('NONE', 'PENDING', 'READY', 'APPLIED', 'FAILED')),
  extracted_payload jsonb,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null
);

create index if not exists inquiry_attachments_inquiry_id_idx on public.inquiry_attachments (inquiry_id, created_at desc);

-- -------------------------------------------------------- inquiry_activity --
-- Append-only timeline. Quote/order events in later slices write here too, so
-- `entity_type`/`entity_id` are generic rather than quote-specific columns
-- that would need adding later.

create table if not exists public.inquiry_activity (
  id bigint generated always as identity primary key,
  inquiry_id uuid not null references public.inquiries (id) on delete cascade,
  kind text not null,
  summary text not null,
  detail jsonb,
  entity_type text,
  entity_id text,
  actor_email text,
  actor_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists inquiry_activity_inquiry_id_idx on public.inquiry_activity (inquiry_id, created_at desc);

-- ---------------------------------------------------------------- followups --

create table if not exists public.followups (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.inquiries (id) on delete cascade,
  due_at timestamptz not null,
  note text,
  result text,
  outcome text check (outcome is null or outcome in ('NO_ANSWER', 'SPOKE', 'RESCHEDULED', 'CLOSED')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  completed_by uuid references auth.users (id) on delete set null
);

create index if not exists followups_inquiry_id_idx on public.followups (inquiry_id, due_at desc);
-- Partial index: the dashboard only ever asks for outstanding follow-ups.
create index if not exists followups_open_due_idx on public.followups (due_at) where completed_at is null;

drop trigger if exists followups_set_updated_at on public.followups;
create trigger followups_set_updated_at
  before update on public.followups
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------- RLS --
-- Every table here holds confidential commercial data (customer contact
-- details, requirement notes, internal notes). Admin-only for all four verbs,
-- via the same public.is_admin() allowlist the catalogue uses. No anon or
-- public grant of any kind — unlike `inquiries`, nothing outside the admin
-- area writes to these.

alter table public.customers enable row level security;
alter table public.inquiry_items enable row level security;
alter table public.inquiry_attachments enable row level security;
alter table public.inquiry_activity enable row level security;
alter table public.followups enable row level security;

drop policy if exists "customers_admin_all" on public.customers;
create policy "customers_admin_all" on public.customers for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "inquiry_items_admin_all" on public.inquiry_items;
create policy "inquiry_items_admin_all" on public.inquiry_items for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "inquiry_attachments_admin_all" on public.inquiry_attachments;
create policy "inquiry_attachments_admin_all" on public.inquiry_attachments for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- Activity is append-only: admins may read and insert, but there is
-- deliberately no UPDATE or DELETE policy, so a timeline cannot be rewritten
-- after the fact even by an admin session.
drop policy if exists "inquiry_activity_admin_read" on public.inquiry_activity;
create policy "inquiry_activity_admin_read" on public.inquiry_activity for select
  to authenticated using (public.is_admin());

drop policy if exists "inquiry_activity_admin_insert" on public.inquiry_activity;
create policy "inquiry_activity_admin_insert" on public.inquiry_activity for insert
  to authenticated with check (public.is_admin());

drop policy if exists "followups_admin_all" on public.followups;
create policy "followups_admin_all" on public.followups for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- `inquiries` gains an admin INSERT policy — staff now create enquiries by
-- hand, which the website-only policy set never allowed. Public INSERT (the
-- quote form) and admin SELECT/UPDATE are untouched by this file.
drop policy if exists "inquiries_admin_insert" on public.inquiries;
create policy "inquiries_admin_insert" on public.inquiries for insert
  to authenticated with check (public.is_admin());

-- --------------------------------------------------------- private storage --
-- The three existing buckets (product-images, inquiry-uploads, review-media)
-- are all PUBLIC. Enquiry attachments are WhatsApp screenshots and BOQs
-- containing customer contact details and commercial terms, so they get their
-- own private bucket. Left alone: `inquiry-uploads` stays public because the
-- live website form writes to it and changing that would break in-flight
-- uploads — migrating it is a separate, non-additive job.

insert into storage.buckets (id, name, public)
values ('enquiry-attachments', 'enquiry-attachments', false)
on conflict (id) do nothing;

drop policy if exists "enquiry_attachments_admin_read" on storage.objects;
create policy "enquiry_attachments_admin_read" on storage.objects for select
  to authenticated using (bucket_id = 'enquiry-attachments' and public.is_admin());

drop policy if exists "enquiry_attachments_admin_write" on storage.objects;
create policy "enquiry_attachments_admin_write" on storage.objects for insert
  to authenticated with check (bucket_id = 'enquiry-attachments' and public.is_admin());

drop policy if exists "enquiry_attachments_admin_delete" on storage.objects;
create policy "enquiry_attachments_admin_delete" on storage.objects for delete
  to authenticated using (bucket_id = 'enquiry-attachments' and public.is_admin());

-- ------------------------------------------------------------- backfill --
-- Preserves all existing rows. Never deletes, never overwrites a non-null
-- value, and never invents a specification.

-- 1. One customer per (normalised phone + lower(name)) pair found on existing
--    enquiries. Grouping on phone ALONE would merge 9703739918 /
--    +919703739918, which production records against two different names —
--    a wrong merge is unrecoverable, an over-split is a two-click fix later.
insert into public.customers (name, phone, email, notes)
select
  min(i.name) as name,
  min(i.phone) as phone,
  min(i.email) filter (where i.email is not null) as email,
  'Auto-created from website enquiry backfill.' as notes
from public.inquiries i
where i.customer_id is null
  and public.normalize_phone(i.phone) is not null
group by public.normalize_phone(i.phone), lower(trim(i.name))
on conflict do nothing;

-- 2. Link each enquiry to its customer. Only fills NULLs.
update public.inquiries i
set customer_id = c.id
from public.customers c
where i.customer_id is null
  and public.normalize_phone(i.phone) = c.phone_normalized
  and lower(trim(i.name)) = lower(trim(c.name));

-- 3. Everything already in the table arrived through the website form.
update public.inquiries set source = 'WEBSITE' where source is null;

-- 4. Derive requirement lines from the legacy `items` JSON.
--    `items` is [{qty, desc}] where desc is free text ("19mm bwp ply",
--    "Sainik MR"). Quantity is a number and moves across cleanly; desc is
--    copied VERBATIM into notes and nothing is parsed out of it into
--    thickness/grade/brand. Every derived line is specification_complete =
--    false, so the whole backfilled set surfaces as needing verification.
--    The original `items` JSON is left untouched on the row.
insert into public.inquiry_items (inquiry_id, quantity, unit, notes, specification_complete, sort_order)
select
  i.id,
  nullif(regexp_replace(coalesce(elem ->> 'qty', ''), '[^0-9.]', '', 'g'), '')::numeric,
  'nos',
  elem ->> 'desc',
  false,
  (ord - 1)::int
from public.inquiries i
cross join lateral jsonb_array_elements(i.items) with ordinality as t(elem, ord)
where jsonb_typeof(i.items) = 'array'
  and coalesce(elem ->> 'desc', '') <> ''
  and not exists (select 1 from public.inquiry_items x where x.inquiry_id = i.id);

-- 5. Seed the timeline so backfilled enquiries are not blank on open.
insert into public.inquiry_activity (inquiry_id, kind, summary, actor_email, created_at)
select i.id, 'ENQUIRY_CREATED', 'Enquiry received through the website form.', 'system@eightbyfour.com', i.created_at
from public.inquiries i
where not exists (select 1 from public.inquiry_activity a where a.inquiry_id = i.id);

-- ---------------------------------------------------------------- DOWN ------
-- Reversal. Drops only objects this file created; `inquiries` keeps its data.
-- The status normalisation ('new' -> 'NEW') is intentionally NOT reversed —
-- it is a value change, not a schema change, and the app reads both.
--
-- drop policy if exists "enquiry_attachments_admin_delete" on storage.objects;
-- drop policy if exists "enquiry_attachments_admin_write" on storage.objects;
-- drop policy if exists "enquiry_attachments_admin_read" on storage.objects;
-- drop policy if exists "inquiries_admin_insert" on public.inquiries;
-- drop table if exists public.followups;
-- drop table if exists public.inquiry_activity;
-- drop table if exists public.inquiry_attachments;
-- drop table if exists public.inquiry_items;
-- alter table public.inquiries drop constraint if exists inquiries_status_check;
-- alter table public.inquiries drop constraint if exists inquiries_source_check;
-- alter table public.inquiries drop constraint if exists inquiries_priority_check;
-- alter table public.inquiries
--   drop column if exists customer_id, drop column if exists source,
--   drop column if exists project_name, drop column if exists delivery_location,
--   drop column if exists required_delivery_date, drop column if exists assigned_to,
--   drop column if exists priority, drop column if exists next_followup_at,
--   drop column if exists requirement_verified_at, drop column if exists requested_brand,
--   drop column if exists internal_notes, drop column if exists lost_reason,
--   drop column if exists created_by, drop column if exists updated_by,
--   drop column if exists updated_at;
-- drop table if exists public.customers;
-- drop function if exists public.normalize_phone(text);
-- drop function if exists public.set_updated_at();
