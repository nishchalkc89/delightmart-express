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
