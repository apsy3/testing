create extension if not exists "pgcrypto";

create type profile_role as enum ('owner', 'staff', 'artisan');
create type product_status as enum ('draft', 'active', 'inactive');

create table profiles (
  user_id uuid primary key,
  email text not null,
  role profile_role not null,
  artisan_id uuid,
  created_at timestamptz not null default now()
);

create table artisans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_email text,
  created_at timestamptz not null default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  shopify_id varchar(64) not null unique,
  artisan_id uuid references artisans(id) on delete set null,
  title text not null,
  slug text not null,
  description text not null,
  price_cents integer not null,
  currency varchar(3) not null,
  tags text[] not null default '{}',
  status product_status not null default 'draft',
  image_url text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  shopify_id varchar(64) not null unique,
  created_at timestamptz not null default now(),
  financial_status text not null,
  total_cents integer not null,
  currency varchar(3) not null,
  customer_email_hash varchar(128),
  source_name text
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  shopify_line_item_id varchar(64) not null,
  quantity integer not null,
  unit_price_cents integer not null,
  artisan_id uuid,
  created_at timestamptz not null default now()
);

create table processed_webhooks (
  id text primary key,
  topic text not null,
  received_at timestamptz not null default now(),
  payload jsonb not null
);

create index products_artisan_idx on products(artisan_id);
create index order_items_artisan_idx on order_items(artisan_id);
create index orders_created_idx on orders(created_at);
