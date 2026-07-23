-- Eightbyfour backend schema
-- Applied via scripts/apply-schema.mjs (SUPABASE_DB_URL)

create extension if not exists pgcrypto;

-- ---------- products ----------
create table if not exists public.products (
  id integer primary key,
  category text not null,
  brand text not null,
  name text not null,
  collection text,
  grade text,
  size text,
  thicknesses text[],
  sd_code text,
  eb_code text,
  finish text,
  finishes text[],
  mood text,
  tone text,
  main_img_url text,
  edge_img_url text,
  app_img_url text,
  created_at timestamptz not null default now()
);

alter table public.products add column if not exists app_img_url text;
alter table public.products add column if not exists gallery_img_urls text[];
alter table public.products add column if not exists price_table jsonb;
alter table public.products add column if not exists description text;

create index if not exists products_category_idx on public.products (category);
create index if not exists products_brand_idx on public.products (brand);

alter table public.products enable row level security;

drop policy if exists "products_public_read" on public.products;
create policy "products_public_read"
  on public.products for select
  to anon, authenticated
  using (true);

drop policy if exists "products_admin_write" on public.products;
create policy "products_admin_write"
  on public.products for all
  to authenticated
  using (true)
  with check (true);

-- ---------- inquiries ----------
create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  ref text not null,
  type text not null check (type in ('single', 'list')),
  product_id integer references public.products (id) on delete set null,
  items jsonb,
  name text not null,
  phone text not null,
  email text,
  message text,
  thickness text,
  finish text,
  sample_requested boolean not null default false,
  uploaded_file_name text,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create index if not exists inquiries_created_at_idx on public.inquiries (created_at desc);
create index if not exists inquiries_status_idx on public.inquiries (status);

alter table public.inquiries enable row level security;

drop policy if exists "inquiries_public_insert" on public.inquiries;
create policy "inquiries_public_insert"
  on public.inquiries for insert
  to anon, authenticated
  with check (true);

drop policy if exists "inquiries_admin_read" on public.inquiries;
create policy "inquiries_admin_read"
  on public.inquiries for select
  to authenticated
  using (true);

drop policy if exists "inquiries_admin_update" on public.inquiries;
create policy "inquiries_admin_update"
  on public.inquiries for update
  to authenticated
  using (true)
  with check (true);

-- ---------- product_likes ----------
create table if not exists public.product_likes (
  id bigint generated always as identity primary key,
  product_id integer not null references public.products (id) on delete cascade,
  name text not null,
  phone text not null,
  created_at timestamptz not null default now(),
  unique (product_id, phone)
);

create index if not exists product_likes_product_idx on public.product_likes (product_id);

alter table public.product_likes enable row level security;
-- No direct anon/authenticated policies: all access goes through the
-- SECURITY DEFINER functions below, so raw name/phone are never exposed
-- via the public API — only aggregate counts.

-- ---------- product_comments ----------
create table if not exists public.product_comments (
  id bigint generated always as identity primary key,
  product_id integer not null references public.products (id) on delete cascade,
  name text not null,
  phone text not null,
  comment text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

create index if not exists product_comments_product_idx on public.product_comments (product_id);
create index if not exists product_comments_status_idx on public.product_comments (status);

alter table public.product_comments enable row level security;

drop policy if exists "product_comments_public_insert" on public.product_comments;
create policy "product_comments_public_insert"
  on public.product_comments for insert
  to anon, authenticated
  with check (
    status = 'pending'
    and length(trim(name)) > 0
    and length(trim(phone)) >= 7
    and length(trim(comment)) > 0
  );

drop policy if exists "product_comments_public_read_approved" on public.product_comments;
create policy "product_comments_public_read_approved"
  on public.product_comments for select
  to anon, authenticated
  using (status = 'approved');

drop policy if exists "product_comments_admin_update" on public.product_comments;
create policy "product_comments_admin_update"
  on public.product_comments for update
  to authenticated
  using (true)
  with check (true);

-- ---------- like functions (expose only aggregate counts, never name/phone) ----------
create or replace function public.get_like_counts()
returns table(product_id integer, like_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select product_id, count(*)::bigint as like_count
  from public.product_likes
  group by product_id;
$$;

grant execute on function public.get_like_counts() to anon, authenticated;

create or replace function public.submit_like(p_product_id integer, p_name text, p_phone text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := trim(p_name);
  v_phone text := trim(p_phone);
  v_inserted_id bigint;
  v_count bigint;
begin
  if length(v_name) = 0 then
    raise exception 'Name is required';
  end if;
  if length(v_phone) < 7 then
    raise exception 'A valid phone number is required';
  end if;
  if not exists (select 1 from public.products where id = p_product_id) then
    raise exception 'Unknown product';
  end if;

  insert into public.product_likes (product_id, name, phone)
  values (p_product_id, v_name, v_phone)
  on conflict (product_id, phone) do nothing
  returning id into v_inserted_id;

  select count(*) into v_count from public.product_likes where product_id = p_product_id;

  return jsonb_build_object(
    'newly_liked', v_inserted_id is not null,
    'like_count', v_count
  );
end;
$$;

grant execute on function public.submit_like(integer, text, text) to anon, authenticated;

-- ---------- storage ----------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "product_images_public_read" on storage.objects;
create policy "product_images_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'product-images');

drop policy if exists "product_images_admin_write" on storage.objects;
create policy "product_images_admin_write"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images');
