-- Admin hardening — run this BEFORE creating the first auth user.
--
-- Why this exists
-- ---------------
-- schema.sql currently grants write access like this:
--
--     create policy "products_admin_write"
--       on public.products for all
--       to authenticated
--       using (true) with check (true);
--
-- `authenticated` is not "admin" — it is *any* signed-in Supabase Auth user.
-- The same pattern guards `brands`, and `inquiries_admin_read` exposes
-- customer names, phone numbers, email addresses and uploaded BOQ files to
-- the same audience. With zero users on the project nothing is reachable
-- today, but the moment the admin area goes live, anyone who can create an
-- account on this project gets full catalogue write access and the enquiry
-- inbox.
--
-- This script replaces "any signed-in user" with an explicit allowlist.
--
-- Run order
-- ---------
--   1. Run this whole file in the Supabase SQL editor.
--   2. In Authentication > Providers, DISABLE public sign-ups
--      ("Allow new users to sign up"). The allowlist below is the
--      authorization check; disabling sign-up is what stops strangers
--      creating accounts at all. Do both, not one.
--   3. Create your admin user in Authentication > Users > Add user.
--   4. Insert them into admin_users (query at the bottom of this file).
--   5. Sign in at /admin/login.

-- ---------- who counts as an admin ----------

create table if not exists public.admin_users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  note text,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

-- An admin may see the roster. Nobody else can read it, and nothing grants
-- INSERT/UPDATE/DELETE to any role — membership is changed from the SQL
-- editor or with the service role key, never through the app. A compromised
-- admin session cannot add a second admin.
drop policy if exists "admin_users_self_read" on public.admin_users;
create policy "admin_users_self_read"
  on public.admin_users for select
  to authenticated
  using (exists (select 1 from public.admin_users a where a.id = auth.uid()));

-- SECURITY DEFINER so the function can read admin_users regardless of the
-- caller's own policies; without it, the policies below would recurse into
-- admin_users' own RLS. search_path is pinned so the function cannot be
-- redirected at a shadowing table in another schema.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (select 1 from public.admin_users where id = auth.uid());
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ---------- products ----------

-- Public read is unchanged: the whole site is a public catalogue.
drop policy if exists "products_admin_write" on public.products;
create policy "products_admin_write"
  on public.products for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------- brands ----------

drop policy if exists "brands_admin_write" on public.brands;
create policy "brands_admin_write"
  on public.brands for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------- inquiries ----------
-- These rows carry names, phone numbers, email addresses and links to
-- uploaded BOQ files. Public INSERT stays (that is the quote form); reading
-- them is admin-only.

drop policy if exists "inquiries_admin_read" on public.inquiries;
create policy "inquiries_admin_read"
  on public.inquiries for select
  to authenticated
  using (public.is_admin());

drop policy if exists "inquiries_admin_update" on public.inquiries;
create policy "inquiries_admin_update"
  on public.inquiries for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------- product comments ----------

drop policy if exists "product_comments_admin_update" on public.product_comments;
create policy "product_comments_admin_update"
  on public.product_comments for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------- audit log ----------
-- Every write from /admin records what changed, on which row, by whom. The
-- CLI has snapshots for the same purpose; this is the equivalent for edits
-- made through the browser.

create table if not exists public.admin_audit (
  id bigserial primary key,
  table_name text not null,
  row_slug text not null,
  -- { column: { from: <old>, to: <new> } }
  changes jsonb not null,
  actor_email text not null,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_row_idx on public.admin_audit (table_name, row_slug, created_at desc);
create index if not exists admin_audit_created_idx on public.admin_audit (created_at desc);

alter table public.admin_audit enable row level security;

drop policy if exists "admin_audit_admin_read" on public.admin_audit;
create policy "admin_audit_admin_read"
  on public.admin_audit for select
  to authenticated
  using (public.is_admin());

-- Insert-only for admins. No UPDATE or DELETE policy exists for any role, so
-- the log is append-only through the API — an admin cannot edit away a
-- record of their own change.
drop policy if exists "admin_audit_admin_insert" on public.admin_audit;
create policy "admin_audit_admin_insert"
  on public.admin_audit for insert
  to authenticated
  with check (public.is_admin());

-- ---------- step 4: enrol the admin ----------
-- After creating the user in Authentication > Users, run:
--
--   insert into public.admin_users (id, email, note)
--   select id, email, 'founder' from auth.users where email = 'you@example.com';
--
-- Verify:
--
--   select u.email, (a.id is not null) as is_admin
--   from auth.users u left join public.admin_users a on a.id = u.id;
