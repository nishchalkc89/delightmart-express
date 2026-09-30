------------------------------------------------------------------------
-- Two stores on one website: Tulsipur and Ghorahi.
--
--   * public.branches          one row per store (contact, hours, delivery fees, open/closed online)
--   * public.branch_inventory  stock per store (the old public.inventory stays in sync with Tulsipur)
--   * orders.branch_id         every order belongs to a store
--   * public.staff_branches    which store(s) a staff account works for
--   * row level security       store staff only see their own store's orders, payments,
--                              deliveries and stock; Super Admins see every store
--   * place_cod_order          takes the chosen store; ordering to an address in the other
--                              store's town adds that store's cross-store delivery fee
--   * store accounts           tulsipur@ / ghorahi@delightshoppingmart.com.np become store managers,
--                              info@delightshoppingmart.com.np becomes the Super Admin (roles are only
--                              given once the email address is confirmed)
--
-- Safe to run more than once. Existing data becomes Tulsipur's.
------------------------------------------------------------------------

-- 1. Stores ---------------------------------------------------------------
create table if not exists public.branches (
  id text primary key check (id ~ '^[a-z][a-z0-9-]{1,30}$'),
  name text not null,
  city text not null,
  address text not null default '',
  phone text,
  whatsapp text,
  email text,
  maps_url text,
  latitude numeric,
  longitude numeric,
  opening_time time,
  closing_time time,
  delivery_fee numeric not null default 0 check (delivery_fee >= 0),
  cross_branch_fee numeric not null default 100 check (cross_branch_fee >= 0),
  min_order numeric not null default 0 check (min_order >= 0),
  estimated_delivery_minutes int not null default 45 check (estimated_delivery_minutes between 5 and 1440),
  delivery_available boolean not null default true,
  accepting_orders boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.branches enable row level security;
grant select on public.branches to anon, authenticated;
grant update on public.branches to authenticated;
grant all on public.branches to service_role;

-- Tulsipur takes over the current store settings; Ghorahi waits until its details and stock are added.
insert into public.branches (id, name, city, address, phone, email, opening_time, closing_time, delivery_fee, min_order, estimated_delivery_minutes, delivery_available, accepting_orders, maps_url, latitude, longitude, sort_order)
select 'tulsipur', 'Delight Shopping Mart – Tulsipur', 'Tulsipur', s.address, s.phone, s.email, s.opening_time, s.closing_time,
       coalesce(s.delivery_fee, 0), coalesce(s.min_order, 0), coalesce(s.estimated_delivery_minutes, 45), s.delivery_available, true,
       'https://maps.app.goo.gl/22sJUGhs3PJ9ZUtr8', 28.1288489, 82.2961992, 1
from (select * from public.store_settings order by updated_at desc limit 1) s
on conflict (id) do nothing;
insert into public.branches (id, name, city, address, delivery_fee, min_order, estimated_delivery_minutes, accepting_orders, opening_time, closing_time, maps_url, latitude, longitude, sort_order)
values ('tulsipur', 'Delight Shopping Mart – Tulsipur', 'Tulsipur', 'Tulsipur, Dang, Lumbini Province, Nepal', 0, 0, 45, true, '07:00', '21:00', 'https://maps.app.goo.gl/22sJUGhs3PJ9ZUtr8', 28.1288489, 82.2961992, 1)
on conflict (id) do nothing;
insert into public.branches (id, name, city, address, delivery_fee, min_order, estimated_delivery_minutes, accepting_orders, opening_time, closing_time, sort_order)
select 'ghorahi', 'Delight Shopping Mart – Ghorahi', 'Ghorahi', 'Ghorahi, Dang, Lumbini Province, Nepal', t.delivery_fee, t.min_order, t.estimated_delivery_minutes, false, t.opening_time, t.closing_time, 2
from public.branches t where t.id = 'tulsipur'
on conflict (id) do nothing;

-- 2. Which store a staff account works for ---------------------------------
create table if not exists public.staff_branches (
  user_id uuid not null references auth.users (id) on delete cascade,
  branch_id text not null references public.branches (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, branch_id)
);
alter table public.staff_branches enable row level security;
grant select, insert, delete on public.staff_branches to authenticated;
grant all on public.staff_branches to service_role;

-- Super Admins see every store; other staff only the stores they are assigned to.
create or replace function private.can_access_branch(_user uuid, _branch text)
returns boolean language sql stable security definer set search_path = '' as $$
  select private.has_role(_user, 'SUPER_ADMIN')
      or (private.is_staff(_user) and exists (select 1 from public.staff_branches sb where sb.user_id = _user and sb.branch_id = _branch))
$$;
revoke all on function private.can_access_branch(uuid, text) from public, anon;
grant execute on function private.can_access_branch(uuid, text) to authenticated, service_role;

drop policy if exists "branches public read" on public.branches;
create policy "branches public read" on public.branches for select to anon, authenticated using (true);
drop policy if exists "branch managers update" on public.branches;
create policy "branch managers update" on public.branches for update to authenticated
  using (private.has_role(auth.uid(), 'SUPER_ADMIN') or (private.has_role(auth.uid(), 'MANAGER') and private.can_access_branch(auth.uid(), id)))
  with check (private.has_role(auth.uid(), 'SUPER_ADMIN') or (private.has_role(auth.uid(), 'MANAGER') and private.can_access_branch(auth.uid(), id)));

drop policy if exists "staff branches read" on public.staff_branches;
create policy "staff branches read" on public.staff_branches for select to authenticated
  using (user_id = auth.uid() or private.is_staff(auth.uid()));
drop policy if exists "super admin assigns branches" on public.staff_branches;
create policy "super admin assigns branches" on public.staff_branches for insert to authenticated
  with check (private.has_role(auth.uid(), 'SUPER_ADMIN'));
drop policy if exists "super admin removes branches" on public.staff_branches;
create policy "super admin removes branches" on public.staff_branches for delete to authenticated
  using (private.has_role(auth.uid(), 'SUPER_ADMIN'));

-- 3. Stock per store -------------------------------------------------------
create table if not exists public.branch_inventory (
  branch_id text not null references public.branches (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  current_stock int not null default 0 check (current_stock >= 0),
  reserved_stock int not null default 0 check (reserved_stock >= 0 and reserved_stock <= current_stock),
  low_stock_threshold int not null default 10 check (low_stock_threshold >= 0),
  last_updated timestamptz not null default now(),
  primary key (branch_id, product_id)
);
create index if not exists branch_inventory_product_idx on public.branch_inventory (product_id);
alter table public.branch_inventory enable row level security;
grant select on public.branch_inventory to anon, authenticated;
grant insert, update on public.branch_inventory to authenticated;
grant all on public.branch_inventory to service_role;
drop policy if exists "branch stock public read" on public.branch_inventory;
create policy "branch stock public read" on public.branch_inventory for select to anon, authenticated using (true);
drop policy if exists "branch staff write stock" on public.branch_inventory;
create policy "branch staff write stock" on public.branch_inventory for all to authenticated
  using (private.can_access_branch(auth.uid(), branch_id)) with check (private.can_access_branch(auth.uid(), branch_id));

-- Tulsipur starts with today's stock; every other store starts at 0.
insert into public.branch_inventory (branch_id, product_id, current_stock, reserved_stock, low_stock_threshold, last_updated)
select 'tulsipur', i.product_id, i.current_stock, i.reserved_stock, i.low_stock_threshold, i.last_updated from public.inventory i
on conflict do nothing;
insert into public.branch_inventory (branch_id, product_id)
select b.id, p.id from public.branches b cross join public.products p
on conflict do nothing;

-- New products and new stores get a stock row everywhere.
create or replace function private.branch_stock_for_new_product()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.branch_inventory (branch_id, product_id) select b.id, new.id from public.branches b on conflict do nothing;
  return new;
end $$;
drop trigger if exists products_branch_stock on public.products;
create trigger products_branch_stock after insert on public.products for each row execute function private.branch_stock_for_new_product();

create or replace function private.branch_stock_for_new_branch()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.branch_inventory (branch_id, product_id) select new.id, p.id from public.products p on conflict do nothing;
  return new;
end $$;
drop trigger if exists branches_stock on public.branches;
create trigger branches_stock after insert on public.branches for each row execute function private.branch_stock_for_new_branch();

-- Keep the old single-store table equal to Tulsipur, both ways (older app versions and the import script use it).
create or replace function private.sync_tulsipur_to_legacy()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.branch_id <> 'tulsipur' then return new; end if;
  -- Only update rows that exist, so tools that insert into the old table themselves keep working.
  update public.inventory set current_stock = new.current_stock, reserved_stock = new.reserved_stock,
    low_stock_threshold = new.low_stock_threshold, last_updated = new.last_updated
  where product_id = new.product_id
    and (current_stock, reserved_stock, low_stock_threshold) is distinct from (new.current_stock, new.reserved_stock, new.low_stock_threshold);
  return new;
end $$;
drop trigger if exists branch_inventory_legacy_sync on public.branch_inventory;
create trigger branch_inventory_legacy_sync after insert or update on public.branch_inventory
  for each row execute function private.sync_tulsipur_to_legacy();

create or replace function private.sync_legacy_to_tulsipur()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.branch_inventory (branch_id, product_id, current_stock, reserved_stock, low_stock_threshold, last_updated)
  values ('tulsipur', new.product_id, new.current_stock, new.reserved_stock, new.low_stock_threshold, new.last_updated)
  on conflict (branch_id, product_id) do update set current_stock = excluded.current_stock, reserved_stock = excluded.reserved_stock,
    low_stock_threshold = excluded.low_stock_threshold, last_updated = excluded.last_updated
  where (public.branch_inventory.current_stock, public.branch_inventory.reserved_stock, public.branch_inventory.low_stock_threshold)
    is distinct from (excluded.current_stock, excluded.reserved_stock, excluded.low_stock_threshold);
  return new;
end $$;
drop trigger if exists inventory_branch_sync on public.inventory;
create trigger inventory_branch_sync after insert or update on public.inventory
  for each row execute function private.sync_legacy_to_tulsipur();

-- The old table mirrors Tulsipur, so only Tulsipur staff (and Super Admins) may write it.
alter policy "inventory staff write" on public.inventory
  using (private.can_access_branch(auth.uid(), 'tulsipur')) with check (private.can_access_branch(auth.uid(), 'tulsipur'));
-- Store details now live on each store; the old single settings row is Super Admin only.
alter policy "admins settings write" on public.store_settings
  using (private.has_role(auth.uid(), 'SUPER_ADMIN')) with check (private.has_role(auth.uid(), 'SUPER_ADMIN'));

alter table public.inventory_adjustments add column if not exists branch_id text references public.branches (id) default 'tulsipur';
update public.inventory_adjustments set branch_id = 'tulsipur' where branch_id is null;
alter policy "inventory staff adjustments" on public.inventory_adjustments
  using (private.can_access_branch(auth.uid(), coalesce(branch_id, 'tulsipur')))
  with check (private.can_access_branch(auth.uid(), coalesce(branch_id, 'tulsipur')));

-- 4. Orders belong to a store -----------------------------------------------
alter table public.orders add column if not exists branch_id text references public.branches (id) default 'tulsipur';
update public.orders set branch_id = 'tulsipur' where branch_id is null;
alter table public.orders alter column branch_id set not null;
alter table public.orders add column if not exists cross_branch_fee numeric not null default 0;
create index if not exists orders_branch_created_idx on public.orders (branch_id, created_at desc);

alter policy "orders own or staff read" on public.orders
  using (user_id = auth.uid() or private.can_access_branch(auth.uid(), branch_id));
alter policy "staff update orders" on public.orders
  using (private.can_access_branch(auth.uid(), branch_id)) with check (private.can_access_branch(auth.uid(), branch_id));
alter policy "order items own or staff" on public.order_items
  using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or private.can_access_branch(auth.uid(), o.branch_id))));
alter policy "payments own or staff" on public.payments
  using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or private.can_access_branch(auth.uid(), o.branch_id))));
alter policy "delivery visible to owner staff" on public.delivery_assignments
  using (staff_id = auth.uid() or exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or private.can_access_branch(auth.uid(), o.branch_id))));
alter policy "delivery staff write" on public.delivery_assignments
  using (exists (select 1 from public.orders o where o.id = order_id and private.can_access_branch(auth.uid(), o.branch_id)))
  with check (exists (select 1 from public.orders o where o.id = order_id and private.can_access_branch(auth.uid(), o.branch_id)));

-- A customer's chosen store is remembered on their profile.
alter table public.profiles add column if not exists preferred_branch_id text references public.branches (id) on delete set null;

-- 5. Placing an order at a store ---------------------------------------------
drop function if exists public.place_cod_order(jsonb, jsonb, text);
drop function if exists private.place_cod_order(jsonb, jsonb, text);

create or replace function private.place_cod_order(p_items jsonb, p_address jsonb, p_coupon text default null, p_branch text default 'tulsipur')
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_order uuid; v_number text; v_address text;
  v_subtotal numeric := 0; v_discount numeric := 0; v_fee numeric := 0; v_cross numeric := 0;
  v_stock integer; v_quantity integer;
  v_item jsonb; v_product record; v_coupon record; v_branch record; v_area text;
begin
  if v_user is null then raise exception 'Sign in before placing an order'; end if;
  select * into v_branch from public.branches where id = coalesce(nullif(trim(p_branch), ''), 'tulsipur');
  if not found then raise exception 'Choose a store before placing an order'; end if;
  if not v_branch.accepting_orders then raise exception '% is not taking online orders yet. Please choose another store.', v_branch.name; end if;
  if not v_branch.delivery_available then raise exception 'Delivery from % is paused right now', v_branch.name; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 50 then raise exception 'Invalid basket'; end if;
  if jsonb_typeof(p_address) <> 'object' then raise exception 'Delivery address required'; end if;
  if length(trim(coalesce(p_address->>'recipientName', ''))) < 2 or length(trim(coalesce(p_address->>'phone', ''))) < 7 or length(trim(coalesce(p_address->>'addressLine', ''))) < 5 then
    raise exception 'Complete the delivery address';
  end if;

  for v_item in select value from jsonb_array_elements(p_items) loop
    if jsonb_typeof(v_item) <> 'object' or coalesce(v_item->>'slug', '') = '' or coalesce(v_item->>'quantity', '') !~ '^[0-9]{1,3}$' then raise exception 'Invalid basket item'; end if;
    v_quantity := (v_item->>'quantity')::int;
    if v_quantity < 1 or v_quantity > 99 then raise exception 'Invalid quantity'; end if;
    if (select count(*) from jsonb_array_elements(p_items) x where x->>'slug' = v_item->>'slug') > 1 then raise exception 'Duplicate product in basket'; end if;
    select p.id, p.name, coalesce(p.sale_price, p.price) as price into v_product
    from public.products p join public.categories c on c.id = p.category_id
    where p.slug = v_item->>'slug' and p.status = 'ACTIVE' and c.status = 'ACTIVE';
    if not found then raise exception 'A product in your cart is no longer available'; end if;
    select current_stock - reserved_stock into v_stock from public.branch_inventory where branch_id = v_branch.id and product_id = v_product.id for update;
    if v_stock is null or v_stock < v_quantity then raise exception 'Not enough stock for % at the % store', v_product.name, v_branch.city; end if;
    v_subtotal := v_subtotal + v_product.price * v_quantity;
  end loop;

  if nullif(trim(coalesce(p_coupon, '')), '') is not null then
    select * into v_coupon from public.coupons
    where upper(code) = upper(trim(p_coupon)) and status = 'ACTIVE'
      and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at >= now())
      and (usage_limit is null or used_count < usage_limit)
    for update;
    if not found or v_subtotal < v_coupon.min_order then raise exception 'Coupon is not valid for this order'; end if;
    v_discount := case when v_coupon.discount_type = 'PERCENTAGE' then round(v_subtotal * v_coupon.discount_value / 100, 2) else v_coupon.discount_value end;
    v_discount := least(v_discount, v_subtotal);
    update public.coupons set used_count = used_count + 1 where id = v_coupon.id;
  end if;

  if v_subtotal < v_branch.min_order then raise exception 'Order is below the minimum order amount'; end if;
  -- Delivering to the other store's town costs that store's cross-store fee.
  v_area := lower(trim(coalesce(p_address->>'city', '')));
  if exists (select 1 from public.branches b where b.id <> v_branch.id and lower(b.city) = v_area) then v_cross := v_branch.cross_branch_fee; end if;
  v_fee := v_branch.delivery_fee + v_cross;

  v_number := 'DLT-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  v_address := concat_ws(', ', trim(p_address->>'addressLine'), nullif(trim(p_address->>'city'), ''), nullif(trim(p_address->>'province'), ''));
  insert into public.orders (order_number, user_id, branch_id, subtotal, discount, delivery_fee, cross_branch_fee, total, payment_method, delivery_instructions, estimated_delivery_at)
  values (v_number, v_user, v_branch.id, v_subtotal, v_discount, v_fee, v_cross, v_subtotal - v_discount + v_fee, 'COD',
          left('Deliver to: ' || v_address || '. Recipient: ' || trim(p_address->>'recipientName') || '. Phone: ' || trim(p_address->>'phone') || '. ' || coalesce(p_address->>'instructions', ''), 1000),
          now() + make_interval(mins => v_branch.estimated_delivery_minutes + case when v_cross > 0 then 30 else 0 end))
  returning id into v_order;

  for v_item in select value from jsonb_array_elements(p_items) loop
    v_quantity := (v_item->>'quantity')::int;
    select p.id, p.name, p.sku, coalesce(p.sale_price, p.price) as price into v_product from public.products p where p.slug = v_item->>'slug' and p.status = 'ACTIVE';
    insert into public.order_items (order_id, product_id, product_name, sku, quantity, unit_price, line_total)
    values (v_order, v_product.id, v_product.name, v_product.sku, v_quantity, v_product.price, v_product.price * v_quantity);
    update public.branch_inventory set current_stock = current_stock - v_quantity, last_updated = now() where branch_id = v_branch.id and product_id = v_product.id;
  end loop;

  update public.profiles set preferred_branch_id = v_branch.id where id = v_user and preferred_branch_id is distinct from v_branch.id;
  return v_order;
end $$;
revoke all on function private.place_cod_order(jsonb, jsonb, text, text) from public, anon;
grant execute on function private.place_cod_order(jsonb, jsonb, text, text) to authenticated;

create or replace function public.place_cod_order(p_items jsonb, p_address jsonb, p_coupon text default null, p_branch text default 'tulsipur')
returns uuid language sql security invoker set search_path = '' as $$ select private.place_cod_order(p_items, p_address, p_coupon, p_branch) $$;
revoke all on function public.place_cod_order(jsonb, jsonb, text, text) from public, anon;
grant execute on function public.place_cod_order(jsonb, jsonb, text, text) to authenticated;

-- Cancelled orders give stock back to the store that sold it.
create or replace function private.restock_cancelled_order()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status in ('CANCELLED', 'FAILED') and old.status not in ('CANCELLED', 'FAILED', 'DELIVERED') then
    update public.branch_inventory bi set current_stock = bi.current_stock + oi.quantity, last_updated = now()
    from public.order_items oi where oi.order_id = new.id and oi.product_id = bi.product_id and bi.branch_id = new.branch_id;
  end if;
  return new;
end $$;

-- 6. Store accounts -----------------------------------------------------------
-- Owner and store emails get their access automatically, but only once the email is confirmed
-- (so nobody can claim these addresses just by signing up with them).
create table if not exists private.staff_accounts (
  email text primary key,
  role public.app_role not null,
  branch_id text references public.branches (id),
  display_name text
);
revoke all on private.staff_accounts from public, anon, authenticated;
insert into private.staff_accounts (email, role, branch_id, display_name) values
  ('info@delightshoppingmart.com.np', 'SUPER_ADMIN', null, 'Delight Shopping Mart'),
  ('info@delightshoppingmart.com', 'SUPER_ADMIN', null, 'Delight Shopping Mart'),
  ('nishchalkc370@gmail.com', 'SUPER_ADMIN', null, null),
  ('tulsipur@delightshoppingmart.com.np', 'MANAGER', 'tulsipur', 'Delight Tulsipur'),
  ('ghorahi@delightshoppingmart.com.np', 'MANAGER', 'ghorahi', 'Delight Ghorahi')
on conflict (email) do update set role = excluded.role, branch_id = excluded.branch_id, display_name = excluded.display_name;

create or replace function private.grant_staff_account(_user uuid, _email text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_acc record;
begin
  select * into v_acc from private.staff_accounts where email = lower(coalesce(_email, ''));
  if not found then return; end if;
  insert into public.user_roles (user_id, role) values (_user, v_acc.role) on conflict do nothing;
  if v_acc.branch_id is not null then
    insert into public.staff_branches (user_id, branch_id) values (_user, v_acc.branch_id) on conflict do nothing;
  end if;
  if v_acc.display_name is not null then update public.profiles set full_name = v_acc.display_name where id = _user; end if;
end $$;
revoke all on function private.grant_staff_account(uuid, text) from public, anon, authenticated;

create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, email, phone)
  values (new.id,
          coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), split_part(coalesce(new.email, ''), '@', 1), 'Customer'),
          new.email,
          nullif(new.raw_user_meta_data->>'phone', ''))
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'CUSTOMER') on conflict do nothing;
  if new.email_confirmed_at is not null then perform private.grant_staff_account(new.id, new.email); end if;
  return new;
end $$;

create or replace function private.handle_user_confirmed()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.email_confirmed_at is not null and old.email_confirmed_at is null then perform private.grant_staff_account(new.id, new.email); end if;
  return new;
end $$;
drop trigger if exists on_auth_user_confirmed on auth.users;
create trigger on_auth_user_confirmed after update of email_confirmed_at on auth.users
  for each row execute function private.handle_user_confirmed();

-- Accounts that already exist and are confirmed.
select private.grant_staff_account(u.id, u.email) from auth.users u
where u.email_confirmed_at is not null and lower(u.email) in (select email from private.staff_accounts);

notify pgrst, 'reload schema';
