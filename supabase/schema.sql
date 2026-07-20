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
