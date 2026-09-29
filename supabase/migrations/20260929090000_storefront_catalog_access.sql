-- Storefront catalogue access + catalogue aligned with the approved design screens.

-- 1. Public read policies on categories/products/product_images/offers/banners/reviews call
--    public.is_staff(auth.uid()). Anonymous visitors could not execute it, so every public
--    catalogue read failed with "permission denied for function is_staff".
--    Both helpers are SECURITY DEFINER and simply return false when auth.uid() is null.
grant execute on function public.is_staff(uuid) to anon;
grant execute on function public.has_role(uuid, public.app_role) to anon;

-- 2. Prices shown in the design: price = original price, sale_price = selling price.
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

-- 3. Products added in the design screens (DEMO CATALOGUE — replace with real stock).
with source(slug, name, sku, category_slug, brand, price, sale_price, unit, description, featured, stock) as (values
  ('cookware-set-5-pcs', 'Cookware Set (5 Pcs)', 'SKU00135', 'kitchen-household', null, 3999::numeric, 2499::numeric, '1 set', 'Stainless steel cookware set for everyday cooking.', true, 20),
  ('teddy-bear-medium', 'Teddy Bear (Medium)', 'SKU00136', 'toys', null, 1199, 799, '1 pc', 'Soft, cuddly teddy bear for kids of all ages.', true, 30),
  ('school-backpack', 'School Backpack', 'SKU00137', 'stationery', null, 1450, null, '1 pc', 'Lightweight school backpack with padded straps.', false, 22),
  ('baby-wipes-72-pcs', 'Baby Wipes (72 pcs)', 'SKU00138', 'baby-care', null, 350, null, '72 pcs', 'Gentle, fragrance-free wipes for delicate skin.', false, 60),
  ('ladies-kurti', 'Ladies Kurti', 'SKU00139', 'ladies-wear', null, 1250, null, '1 pc', 'Printed cotton kurti for everyday comfort.', false, 18),
  ('sports-shoes', 'Sports Shoes', 'SKU00140', 'ladies-wear', null, 2499, null, '1 pair', 'Breathable sports shoes with cushioned soles.', false, 16),
  ('red-lentils-masoor-dal-1kg', 'Red Lentils (Masoor Dal)', 'SKU00141', 'groceries', null, 220, 180, '1kg', 'Clean, high-protein red lentils.', false, 70),
  ('fresh-eggs-30-pcs', 'Fresh Eggs (30 pcs)', 'SKU00142', 'groceries', null, 520, 450, '30 pcs', 'Farm-fresh eggs delivered daily.', false, 40),
  ('jasmine-rice-5kg', 'Jasmine Rice', 'SKU00143', 'groceries', null, 1050, null, '5kg', 'Fragrant, soft jasmine rice.', false, 30),
  ('masoor-dal-1kg', 'Masoor Dal', 'SKU00144', 'groceries', null, 180, null, '1kg', 'Everyday masoor dal.', false, 45),
  ('chana-dal-1kg', 'Chana Dal', 'SKU00145', 'groceries', null, 220, null, '1kg', 'Premium split chickpeas.', false, 45))
insert into public.products(category_id, name, slug, sku, brand, description, price, sale_price, unit, featured)
select c.id, s.name, s.slug, s.sku, s.brand, s.description, s.price, s.sale_price, s.unit, s.featured
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

-- 4. Promo codes shown in the design.
insert into public.coupons(code, discount_type, discount_value, min_order, status) values
  ('DELIGHT100', 'FIXED', 100, 500, 'ACTIVE'),
  ('DELIGHT5', 'PERCENTAGE', 5, 3000, 'ACTIVE')
on conflict (code) do nothing;
