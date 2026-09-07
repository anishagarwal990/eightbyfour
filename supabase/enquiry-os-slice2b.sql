-- Enquiry OS — Slice 2B: customer-facing quotation output (preview + PDF) and
-- the SENT workflow.
--
-- SAFETY CONTRACT
-- --------------
-- ADDITIVE ONLY. No table/column dropped or retyped, no row deleted. The one
-- CHECK constraint touched (quotes_status_check) is widened, never narrowed:
-- every value it allowed before is still allowed.
--
-- Nothing here recalculates or rewrites a frozen quote. The PDF/preview read
-- the quote_items snapshot; this migration only adds where a quote was sent,
-- when, and by whom, plus the customer-facing commercial terms.
--
-- Run order: after supabase/enquiry-os-slice2.sql.
-- Reversal: commented DOWN block at the end.

-- ----------------------------------------------------------------- quotes --

alter table public.quotes drop constraint if exists quotes_status_check;
alter table public.quotes add constraint quotes_status_check
  check (status in ('DRAFT', 'READY', 'SENT'));

alter table public.quotes add column if not exists sent_at timestamptz;
alter table public.quotes add column if not exists sent_by uuid references auth.users (id) on delete set null;

-- -------------------------------------------------------- quote_versions --
-- Per-version send tracking: V1 can be "previously sent" while V2 is a live
-- draft. `valid_until` and `quote_date` are the header dates the PDF prints;
-- `terms` (already present, jsonb, default '{}') carries the customer-facing
-- commercial terms — see lib/quote-terms.ts for the shape and defaults.

alter table public.quote_versions add column if not exists sent_at timestamptz;
alter table public.quote_versions add column if not exists sent_by uuid references auth.users (id) on delete set null;
alter table public.quote_versions add column if not exists quote_date date;
alter table public.quote_versions add column if not exists valid_until date;

-- The frozen-version guard (slice 2) blocks UPDATEs to a frozen row. Marking a
-- version SENT has to stamp sent_at/sent_by on a row that is already frozen,
-- so the guard is refined to allow exactly that one transition and nothing
-- else once frozen.
create or replace function public.reject_frozen_quote_version_write()
returns trigger language plpgsql as $fn$
begin
  if tg_op = 'DELETE' then
    raise exception 'quote versions are append-only and cannot be deleted' using errcode = 'check_violation';
  end if;
  if old.frozen_at is not null then
    -- Permit only the send stamp (and idempotent no-ops); everything else that
    -- defines the commercial position stays locked.
    if row(new.version_no, new.status, new.label, new.pricing_display, new.customer_snapshot,
            new.terms, new.tax_assumption, new.revision_reason, new.frozen_at, new.quote_date, new.valid_until)
       is distinct from
       row(old.version_no, old.status, old.label, old.pricing_display, old.customer_snapshot,
            old.terms, old.tax_assumption, old.revision_reason, old.frozen_at, old.quote_date, old.valid_until)
    then
      raise exception 'quote version % is frozen', old.id using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$fn$;

-- ------------------------------------------------- mark_quote_sent(uuid) --
-- One transaction: quote -> SENT (+ sent_at/sent_by), stamp the current
-- version's sent_at/sent_by, enquiry -> QUOTE_SENT, log the timeline event.
-- SECURITY INVOKER — RLS still governs every write.

create or replace function public.mark_quote_sent(p_quote_id uuid)
returns void language plpgsql as $fn$
declare
  v_quote public.quotes;
  v_version public.quote_versions;
  v_actor_email text;
  v_now timestamptz := now();
begin
  select * into v_quote from public.quotes where id = p_quote_id for update;
  if v_quote.id is null then raise exception 'quote % not found', p_quote_id; end if;
  if v_quote.status <> 'READY' then
    raise exception 'quote % is % — only a READY quote can be marked sent', p_quote_id, v_quote.status;
  end if;

  select * into v_version from public.quote_versions
    where quote_id = p_quote_id order by version_no desc limit 1 for update;
  if v_version.id is null then raise exception 'quote % has no version', p_quote_id; end if;

  update public.quote_versions set sent_at = v_now, sent_by = auth.uid() where id = v_version.id;
  update public.quotes set status = 'SENT', sent_at = v_now, sent_by = auth.uid(), updated_by = auth.uid()
   where id = p_quote_id;
  update public.inquiries set status = 'QUOTE_SENT', updated_by = auth.uid() where id = v_quote.inquiry_id;

  begin
    v_actor_email := nullif(current_setting('request.jwt.claims', true)::json ->> 'email', '');
  exception when others then
    v_actor_email := null;
  end;

  insert into public.inquiry_activity (inquiry_id, kind, summary, detail, entity_type, entity_id, actor_email, actor_id)
  values (
    v_quote.inquiry_id, 'QUOTE_SENT',
    'Quote ' || v_quote.ref || ' V' || v_version.version_no || ' marked sent to customer.',
    jsonb_build_object('quote_ref', v_quote.ref, 'version', v_version.version_no, 'sent_at', v_now),
    'quote', p_quote_id::text, coalesce(v_actor_email, 'system@eightbyfour.com'), auth.uid()
  );
end;
$fn$;

-- ---------------------------------------------------------------- DOWN ----
-- drop function if exists public.mark_quote_sent(uuid);
-- alter table public.quote_versions drop column if exists valid_until,
--   drop column if exists quote_date, drop column if exists sent_by, drop column if exists sent_at;
-- alter table public.quotes drop column if exists sent_by, drop column if exists sent_at;
-- alter table public.quotes drop constraint if exists quotes_status_check;
-- alter table public.quotes add constraint quotes_status_check check (status in ('DRAFT','READY'));
-- (restore reject_frozen_quote_version_write from slice 2)
