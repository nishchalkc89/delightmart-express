-- Make the store fully functional:
--   1. anonymous shoppers can read the catalogue
--   2. every sign-up gets a profile + CUSTOMER role (and the owner becomes SUPER_ADMIN)
--   3. super admins can manage staff roles
--   4. storage buckets for admin image uploads
--   5. COD payment records follow the order lifecycle
--   6. catalogue, prices and coupons aligned with the approved design screens

------------------------------------------------------------------------
-- 1. Public catalogue reads
--    The public SELECT policies call private.is_staff(), which anon may not execute,
--    so every anonymous read failed with "permission denied for function is_staff".
--    Split them: anon gets a simple status check, authenticated keeps the staff check.
------------------------------------------------------------------------
alter policy "active categories public" on public.categories to authenticated;
create policy "active categories anon" on public.categories for select to anon using (status = 'ACTIVE');

alter policy "active products public" on public.products to authenticated;
create policy "active products anon" on public.products for select to anon using (status = 'ACTIVE');

alter policy "product images public" on public.product_images to authenticated;
create policy "product images anon" on public.product_images for select to anon
  using (exists (select 1 from public.products p where p.id = product_id and p.status = 'ACTIVE'));

alter policy "active offers public" on public.offers to authenticated;
create policy "active offers anon" on public.offers for select to anon using (status = 'ACTIVE');

alter policy "active banners public" on public.banners to authenticated;
create policy "active banners anon" on public.banners for select to anon using (status = 'ACTIVE');

alter policy "published reviews public" on public.reviews to authenticated;
create policy "published reviews anon" on public.reviews for select to anon using (status = 'PUBLISHED');

------------------------------------------------------------------------
-- 2. Profiles and roles for every account
------------------------------------------------------------------------
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
  -- Store owner is bootstrapped as the first super admin.
  if lower(coalesce(new.email, '')) = 'nishchalkc370@gmail.com' then
    insert into public.user_roles (user_id, role) values (new.id, 'SUPER_ADMIN') on conflict do nothing;
  end if;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();

-- Backfill accounts created before this migration.
insert into public.profiles (id, full_name, email, phone)
select u.id,
       coalesce(nullif(u.raw_user_meta_data->>'full_name', ''), split_part(coalesce(u.email, ''), '@', 1), 'Customer'),
       u.email, nullif(u.raw_user_meta_data->>'phone', '')
from auth.users u on conflict (id) do nothing;
insert into public.user_roles (user_id, role) select id, 'CUSTOMER' from auth.users on conflict do nothing;
insert into public.user_roles (user_id, role)
select id, 'SUPER_ADMIN' from auth.users where lower(email) = 'nishchalkc370@gmail.com' on conflict do nothing;

------------------------------------------------------------------------
-- 3. Super admins manage staff roles; staff can see all roles (for delivery assignment)
------------------------------------------------------------------------
grant insert, delete on public.user_roles to authenticated;
alter policy "roles own read" on public.user_roles using (user_id = auth.uid() or private.is_staff(auth.uid()));
create policy "super admin manages roles" on public.user_roles for insert to authenticated
  with check (private.has_role(auth.uid(), 'SUPER_ADMIN'));
create policy "super admin removes roles" on public.user_roles for delete to authenticated
  using (private.has_role(auth.uid(), 'SUPER_ADMIN'));
-- Staff may update customer profile status (activate/deactivate).
create policy "staff update profiles" on public.profiles for update to authenticated
  using (private.is_staff(auth.uid())) with check (private.is_staff(auth.uid()));

------------------------------------------------------------------------
-- 4. Storage buckets used by the admin uploads
------------------------------------------------------------------------
insert into storage.buckets (id, name, public) values
  ('product-images', 'product-images', true),
  ('category-images', 'category-images', true),
  ('banners', 'banners', true),
  ('store-branding', 'store-branding', true),
  ('profile-images', 'profile-images', false)
on conflict (id) do nothing;

------------------------------------------------------------------------
-- 5. Payment records for Cash on Delivery orders
------------------------------------------------------------------------
create or replace function private.sync_order_payment()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    insert into public.payments (order_id, provider, status, amount)
    values (new.id, new.payment_method, 'PENDING', new.total);
  elsif new.status is distinct from old.status then
    if new.status = 'DELIVERED' then
      update public.payments set status = 'PAID', verified_at = now()
      where order_id = new.id and provider = 'COD' and status = 'PENDING';
    elsif new.status in ('CANCELLED', 'FAILED') then
      update public.payments set status = 'FAILED' where order_id = new.id and status = 'PENDING';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists orders_payment_sync on public.orders;
create trigger orders_payment_sync after insert or update of status on public.orders
  for each row execute function private.sync_order_payment();

insert into public.payments (order_id, provider, status, amount)
select o.id, o.payment_method, case when o.status = 'DELIVERED' then 'PAID'::public.payment_status else 'PENDING'::public.payment_status end, o.total
from public.orders o where not exists (select 1 from public.payments p where p.order_id = o.id);

-- Cancelled orders give their stock back.
create or replace function private.restock_cancelled_order()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status in ('CANCELLED', 'FAILED') and old.status not in ('CANCELLED', 'FAILED', 'DELIVERED') then
    update public.inventory i set current_stock = i.current_stock + oi.quantity, last_updated = now()
    from public.order_items oi where oi.order_id = new.id and oi.product_id = i.product_id;
  end if;
  return new;
end $$;

drop trigger if exists orders_restock_on_cancel on public.orders;
create trigger orders_restock_on_cancel after update of status on public.orders
  for each row execute function private.restock_cancelled_order();

------------------------------------------------------------------------
-- 6. Catalogue aligned with the design (DEMO CATALOGUE — replace with real stock)
------------------------------------------------------------------------
with prices(slug, price, sale_price, unit) as (values
  ('daawat-basmati-rice-5kg', 1499::numeric, 1199::numeric, '5kg'),
  ('maggi-2-minute-noodles', 190, 160, '280g'),
  ('nivea-body-lotion-400ml', 475, 425, '400ml'),
  ('nike-ladies-t-shirt', 1050, 799, '(Assorted)'),
  ('pampers-baby-diapers', 1590, 1350, 'M 60 Pcs'),
  ('classmate-notebook', 70, 60, 'Single Line'),
  ('wireless-headphones', 4999, 2999, '1 pc'),
  ('running-shoes', 2999, 1899, '1 pair'),
  ('smart-watch', 5999, 3499, '1 pc'),
  ('travel-backpack', 2499, 1299, '1 pc'),
  ('sunflower-oil-1l', 260, 210, '1L'),
  ('fresh-banana-1kg', 120, null, '1kg (Approx. 5-6 pcs)'))
update public.products p
set price = s.price, sale_price = s.sale_price, unit = s.unit, updated_at = now()
from prices s where p.slug = s.slug;

with source(slug, name, sku, category_slug, price, sale_price, unit, description, featured) as (values
  ('cookware-set-5-pcs', 'Cookware Set (5 Pcs)', 'SKU00135', 'kitchen-household', 3999::numeric, 2499::numeric, '1 set', 'Stainless steel cookware set for everyday cooking.', true),
  ('teddy-bear-medium', 'Teddy Bear (Medium)', 'SKU00136', 'toys', 1199, 799, '1 pc', 'Soft, cuddly teddy bear for kids of all ages.', true),
  ('school-backpack', 'School Backpack', 'SKU00137', 'stationery', 1450, null, '1 pc', 'Lightweight school backpack with padded straps.', false),
  ('baby-wipes-72-pcs', 'Baby Wipes (72 pcs)', 'SKU00138', 'baby-care', 350, null, '72 pcs', 'Gentle, fragrance-free wipes for delicate skin.', false),
  ('ladies-kurti', 'Ladies Kurti', 'SKU00139', 'ladies-wear', 1250, null, '1 pc', 'Printed cotton kurti for everyday comfort.', false),
  ('sports-shoes', 'Sports Shoes', 'SKU00140', 'ladies-wear', 2499, null, '1 pair', 'Breathable sports shoes with cushioned soles.', false),
  ('red-lentils-masoor-dal-1kg', 'Red Lentils (Masoor Dal)', 'SKU00141', 'groceries', 220, 180, '1kg', 'Clean, high-protein red lentils.', false),
  ('fresh-eggs-30-pcs', 'Fresh Eggs (30 pcs)', 'SKU00142', 'groceries', 520, 450, '30 pcs', 'Farm-fresh eggs delivered daily.', false),
  ('jasmine-rice-5kg', 'Jasmine Rice', 'SKU00143', 'groceries', 1050, null, '5kg', 'Fragrant, soft jasmine rice.', false),
  ('masoor-dal-1kg', 'Masoor Dal', 'SKU00144', 'groceries', 180, null, '1kg', 'Everyday masoor dal.', false),
  ('chana-dal-1kg', 'Chana Dal', 'SKU00145', 'groceries', 220, null, '1kg', 'Premium split chickpeas.', false))
insert into public.products(category_id, name, slug, sku, description, price, sale_price, unit, featured)
select c.id, s.name, s.slug, s.sku, s.description, s.price, s.sale_price, s.unit, s.featured
from source s join public.categories c on c.slug = s.category_slug
on conflict (slug) do nothing;

insert into public.inventory(product_id, current_stock, reserved_stock, low_stock_threshold)
select p.id, s.stock, 0, 10
from (values
  ('cookware-set-5-pcs', 20), ('teddy-bear-medium', 30), ('school-backpack', 22), ('baby-wipes-72-pcs', 60),
  ('ladies-kurti', 18), ('sports-shoes', 16), ('red-lentils-masoor-dal-1kg', 70), ('fresh-eggs-30-pcs', 40),
  ('jasmine-rice-5kg', 30), ('masoor-dal-1kg', 45), ('chana-dal-1kg', 45)) as s(slug, stock)
join public.products p on p.slug = s.slug
on conflict (product_id) do nothing;

insert into public.coupons(code, discount_type, discount_value, min_order, status) values
  ('DELIGHT100', 'FIXED', 100, 500, 'ACTIVE'),
  ('DELIGHT5', 'PERCENTAGE', 5, 3000, 'ACTIVE')
on conflict (code) do nothing;

------------------------------------------------------------------------
-- 7. Fix Cash on Delivery order placement.
--    The original function looped basket items into a RECORD and then called
--    jsonb functions on it, so every order failed with "function jsonb_typeof(record)
--    does not exist". Items are now read as jsonb. Behaviour is otherwise unchanged:
--    server-side prices, stock checks, coupon validation, minimum order, stock deduction.
------------------------------------------------------------------------
create or replace function private.place_cod_order(p_items jsonb, p_address jsonb, p_coupon text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_order uuid; v_number text; v_address text;
  v_subtotal numeric := 0; v_discount numeric := 0; v_fee numeric := 0; v_min numeric := 0;
  v_stock integer; v_quantity integer;
  v_item jsonb; v_product record; v_coupon record;
begin
  if v_user is null then raise exception 'Sign in before placing an order'; end if;
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
    select p.id, p.name, coalesce(p.sale_price, p.price) as price into v_product from public.products p where p.slug = v_item->>'slug' and p.status = 'ACTIVE';
    if not found then raise exception 'A product in your cart is no longer available'; end if;
    select current_stock - reserved_stock into v_stock from public.inventory where product_id = v_product.id for update;
    if v_stock is null or v_stock < v_quantity then raise exception 'Not enough stock for %', v_product.name; end if;
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

  select coalesce(delivery_fee, 0), coalesce(min_order, 0) into v_fee, v_min
  from public.store_settings where delivery_available = true order by updated_at desc limit 1;
  if not found then raise exception 'Delivery is unavailable right now'; end if;
  if v_subtotal < v_min then raise exception 'Order is below the minimum order amount'; end if;

  v_number := 'DLT-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  v_address := concat_ws(', ', trim(p_address->>'addressLine'), nullif(trim(p_address->>'city'), ''), nullif(trim(p_address->>'province'), ''));
  insert into public.orders (order_number, user_id, subtotal, discount, delivery_fee, total, payment_method, delivery_instructions, estimated_delivery_at)
  values (v_number, v_user, v_subtotal, v_discount, v_fee, v_subtotal - v_discount + v_fee, 'COD',
          left('Deliver to: ' || v_address || '. Recipient: ' || trim(p_address->>'recipientName') || '. Phone: ' || trim(p_address->>'phone') || '. ' || coalesce(p_address->>'instructions', ''), 1000),
          now() + interval '20 minutes')
  returning id into v_order;

  for v_item in select value from jsonb_array_elements(p_items) loop
    v_quantity := (v_item->>'quantity')::int;
    select p.id, p.name, p.sku, coalesce(p.sale_price, p.price) as price into v_product from public.products p where p.slug = v_item->>'slug' and p.status = 'ACTIVE';
    insert into public.order_items (order_id, product_id, product_name, sku, quantity, unit_price, line_total)
    values (v_order, v_product.id, v_product.name, v_product.sku, v_quantity, v_product.price, v_product.price * v_quantity);
    update public.inventory set current_stock = current_stock - v_quantity, last_updated = now() where product_id = v_product.id;
  end loop;

  return v_order;
end $$;

revoke all on function private.place_cod_order(jsonb, jsonb, text) from public, anon;
grant execute on function private.place_cod_order(jsonb, jsonb, text) to authenticated;
