-- Enable row level security on all tables
alter table profiles enable row level security;
alter table artisans enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table processed_webhooks enable row level security;

-- Profiles: users may read their own profile
create policy "Profiles are self-readable" on profiles
  for select using (auth.uid() = user_id);

-- Artisans: owner and staff read all, artisans read their artisan row
create policy "Artisan staff read" on artisans
  for select using (exists (
    select 1 from profiles p
    where p.user_id = auth.uid()
      and p.role in ('owner', 'staff')
  ));

create policy "Artisan self read" on artisans
  for select using (exists (
    select 1 from profiles p
    where p.user_id = auth.uid()
      and p.artisan_id = artisans.id
  ));

-- Products RLS
create policy "Products staff read" on products
  for select using (exists (
    select 1 from profiles p
    where p.user_id = auth.uid()
      and p.role in ('owner', 'staff')
  ));

create policy "Products artisan read" on products
  for select using (exists (
    select 1 from profiles p
    where p.user_id = auth.uid()
      and p.artisan_id = products.artisan_id
  ));

-- Orders RLS
create policy "Orders staff read" on orders
  for select using (exists (
    select 1 from profiles p
    where p.user_id = auth.uid()
      and p.role in ('owner', 'staff')
  ));

create policy "Orders artisan read" on orders
  for select using (exists (
    select 1 from profiles p
    join order_items oi on oi.order_id = orders.id
    where p.user_id = auth.uid()
      and p.artisan_id = oi.artisan_id
  ));

-- Order items RLS
create policy "Order items staff read" on order_items
  for select using (exists (
    select 1 from profiles p
    where p.user_id = auth.uid()
      and p.role in ('owner', 'staff')
  ));

create policy "Order items artisan read" on order_items
  for select using (exists (
    select 1 from profiles p
    where p.user_id = auth.uid()
      and p.artisan_id = order_items.artisan_id
  ));

-- Processed webhooks RLS
create policy "Processed webhooks staff read" on processed_webhooks
  for select using (exists (
    select 1 from profiles p
    where p.user_id = auth.uid()
      and p.role in ('owner', 'staff')
  ));
