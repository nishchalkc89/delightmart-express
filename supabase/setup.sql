-- ============================================================================
-- Delight Shopping Mart — complete database setup for a NEW Supabase project.
-- Paste this whole file into Supabase Dashboard → SQL Editor → New query → Run.
-- Run it ONCE on an empty project. It is generated from supabase/migrations/.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 202609230001_delight_schema.sql
-- ---------------------------------------------------------------------------
-- Delight Shopping Mart production schema
create extension if not exists pgcrypto;
create type public.app_role as enum ('SUPER_ADMIN','MANAGER','ORDER_STAFF','INVENTORY_STAFF','DELIVERY_STAFF','CUSTOMER');
create type public.product_status as enum ('ACTIVE','INACTIVE','DRAFT');
create type public.order_status as enum ('PENDING','CONFIRMED','PREPARING','READY_FOR_DELIVERY','OUT_FOR_DELIVERY','DELIVERED','CANCELLED','FAILED');
create type public.payment_status as enum ('PENDING','PAID','FAILED','REFUNDED','PARTIAL_REFUND');
create type public.delivery_status as enum ('PENDING','READY','OUT_FOR_DELIVERY','DELIVERED','FAILED');

create table public.profiles(id uuid primary key,full_name text not null,email text,phone text,avatar_url text,status text not null default 'ACTIVE',created_at timestamptz not null default now(),updated_at timestamptz not null default now());
grant select,insert,update on public.profiles to authenticated; grant all on public.profiles to service_role; alter table public.profiles enable row level security;
create table public.user_roles(id uuid primary key default gen_random_uuid(),user_id uuid not null,role public.app_role not null default 'CUSTOMER',unique(user_id,role));
grant select on public.user_roles to authenticated; grant all on public.user_roles to service_role; alter table public.user_roles enable row level security;
create or replace function public.has_role(_user_id uuid,_role public.app_role) returns boolean language sql stable security definer set search_path=public as $$select exists(select 1 from public.user_roles where user_id=_user_id and role=_role)$$;
grant execute on function public.has_role(uuid,public.app_role) to authenticated;
create or replace function public.is_staff(_user_id uuid) returns boolean language sql stable security definer set search_path=public as $$select exists(select 1 from public.user_roles where user_id=_user_id and role in ('SUPER_ADMIN','MANAGER','ORDER_STAFF','INVENTORY_STAFF','DELIVERY_STAFF'))$$;
grant execute on function public.is_staff(uuid) to authenticated;
create policy "profiles own read" on public.profiles for select to authenticated using(id=auth.uid() or public.is_staff(auth.uid())); create policy "profiles own update" on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid()); create policy "profiles own insert" on public.profiles for insert to authenticated with check(id=auth.uid());
create policy "roles own read" on public.user_roles for select to authenticated using(user_id=auth.uid() or public.has_role(auth.uid(),'SUPER_ADMIN'));

create table public.categories(id uuid primary key default gen_random_uuid(),parent_id uuid references public.categories(id) on delete set null,name text not null,slug text not null unique,description text,image_url text,status public.product_status not null default 'ACTIVE',sort_order int not null default 0,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
grant select on public.categories to anon,authenticated; grant insert,update,delete on public.categories to authenticated; grant all on public.categories to service_role; alter table public.categories enable row level security;
create policy "active categories public" on public.categories for select to anon,authenticated using(status='ACTIVE' or public.is_staff(auth.uid())); create policy "staff categories write" on public.categories for all to authenticated using(public.is_staff(auth.uid())) with check(public.is_staff(auth.uid()));
create table public.products(id uuid primary key default gen_random_uuid(),category_id uuid not null references public.categories(id),name text not null,slug text not null unique,sku text not null unique,brand text,description text not null default '',price numeric(12,2) not null check(price>=0),sale_price numeric(12,2) check(sale_price>=0),unit text not null default '1 pc',status public.product_status not null default 'ACTIVE',featured boolean not null default false,bestseller boolean not null default false,specifications jsonb not null default '{}',created_at timestamptz not null default now(),updated_at timestamptz not null default now());
grant select on public.products to anon,authenticated; grant insert,update,delete on public.products to authenticated; grant all on public.products to service_role; alter table public.products enable row level security;
create policy "active products public" on public.products for select to anon,authenticated using(status='ACTIVE' or public.is_staff(auth.uid())); create policy "staff products write" on public.products for all to authenticated using(public.is_staff(auth.uid())) with check(public.is_staff(auth.uid()));
create table public.product_images(id uuid primary key default gen_random_uuid(),product_id uuid not null references public.products(id) on delete cascade,url text not null,alt_text text,sort_order int not null default 0,is_primary boolean not null default false);
grant select on public.product_images to anon,authenticated; grant insert,update,delete on public.product_images to authenticated; grant all on public.product_images to service_role; alter table public.product_images enable row level security;
create policy "product images public" on public.product_images for select to anon,authenticated using(exists(select 1 from public.products p where p.id=product_id and p.status='ACTIVE') or public.is_staff(auth.uid())); create policy "staff product images write" on public.product_images for all to authenticated using(public.is_staff(auth.uid())) with check(public.is_staff(auth.uid()));
create table public.inventory(product_id uuid primary key references public.products(id) on delete cascade,current_stock int not null default 0 check(current_stock>=0),reserved_stock int not null default 0 check(reserved_stock>=0 and reserved_stock<=current_stock),low_stock_threshold int not null default 10,last_updated timestamptz not null default now());
grant select on public.inventory to anon,authenticated; grant insert,update,delete on public.inventory to authenticated; grant all on public.inventory to service_role; alter table public.inventory enable row level security;
create policy "inventory availability public" on public.inventory for select to anon,authenticated using(true); create policy "inventory staff write" on public.inventory for all to authenticated using(public.is_staff(auth.uid())) with check(public.is_staff(auth.uid()));
create table public.inventory_adjustments(id uuid primary key default gen_random_uuid(),product_id uuid not null references public.products(id),changed_by uuid,quantity_delta int not null,reason text not null,reference text,created_at timestamptz not null default now());
grant select,insert on public.inventory_adjustments to authenticated; grant all on public.inventory_adjustments to service_role; alter table public.inventory_adjustments enable row level security; create policy "inventory staff adjustments" on public.inventory_adjustments for all to authenticated using(public.is_staff(auth.uid())) with check(public.is_staff(auth.uid()));

create table public.addresses(id uuid primary key default gen_random_uuid(),user_id uuid not null,label text not null,recipient_name text not null,phone text not null,address_line text not null,city text not null default 'Tulsipur',province text not null default 'Lumbini Province',latitude numeric,longitude numeric,is_default boolean not null default false,created_at timestamptz not null default now());
grant select,insert,update,delete on public.addresses to authenticated; grant all on public.addresses to service_role; alter table public.addresses enable row level security; create policy "addresses own" on public.addresses for all to authenticated using(user_id=auth.uid() or public.is_staff(auth.uid())) with check(user_id=auth.uid() or public.is_staff(auth.uid()));
create table public.cart(id uuid primary key default gen_random_uuid(),user_id uuid not null unique,updated_at timestamptz not null default now());
grant select,insert,update,delete on public.cart to authenticated; grant all on public.cart to service_role; alter table public.cart enable row level security; create policy "cart own" on public.cart for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create table public.cart_items(id uuid primary key default gen_random_uuid(),cart_id uuid not null references public.cart(id) on delete cascade,product_id uuid not null references public.products(id),quantity int not null check(quantity>0),unique(cart_id,product_id));
grant select,insert,update,delete on public.cart_items to authenticated; grant all on public.cart_items to service_role; alter table public.cart_items enable row level security; create policy "cart items own" on public.cart_items for all to authenticated using(exists(select 1 from public.cart c where c.id=cart_id and c.user_id=auth.uid())) with check(exists(select 1 from public.cart c where c.id=cart_id and c.user_id=auth.uid()));

create table public.orders(id uuid primary key default gen_random_uuid(),order_number text not null unique,user_id uuid not null,address_id uuid references public.addresses(id),status public.order_status not null default 'PENDING',subtotal numeric(12,2) not null,discount numeric(12,2) not null default 0,delivery_fee numeric(12,2) not null default 0,platform_fee numeric(12,2) not null default 0,total numeric(12,2) not null,payment_method text not null,delivery_instructions text,estimated_delivery_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
grant select,insert,update on public.orders to authenticated; grant all on public.orders to service_role; alter table public.orders enable row level security; create policy "orders own or staff read" on public.orders for select to authenticated using(user_id=auth.uid() or public.is_staff(auth.uid())); create policy "orders own insert" on public.orders for insert to authenticated with check(user_id=auth.uid()); create policy "staff update orders" on public.orders for update to authenticated using(public.is_staff(auth.uid())) with check(public.is_staff(auth.uid()));
create table public.order_items(id uuid primary key default gen_random_uuid(),order_id uuid not null references public.orders(id) on delete cascade,product_id uuid references public.products(id),product_name text not null,sku text,quantity int not null check(quantity>0),unit_price numeric(12,2) not null,line_total numeric(12,2) not null);
grant select,insert on public.order_items to authenticated; grant all on public.order_items to service_role; alter table public.order_items enable row level security; create policy "order items own or staff" on public.order_items for select to authenticated using(exists(select 1 from public.orders o where o.id=order_id and (o.user_id=auth.uid() or public.is_staff(auth.uid())))); create policy "order items customer insert" on public.order_items for insert to authenticated with check(exists(select 1 from public.orders o where o.id=order_id and o.user_id=auth.uid()));
create table public.delivery_assignments(id uuid primary key default gen_random_uuid(),order_id uuid not null unique references public.orders(id) on delete cascade,staff_id uuid,status public.delivery_status not null default 'PENDING',assigned_at timestamptz,delivered_at timestamptz,failure_reason text,notes text,updated_at timestamptz not null default now());
grant select,insert,update on public.delivery_assignments to authenticated; grant all on public.delivery_assignments to service_role; alter table public.delivery_assignments enable row level security; create policy "delivery visible to owner staff" on public.delivery_assignments for select to authenticated using(staff_id=auth.uid() or public.is_staff(auth.uid()) or exists(select 1 from public.orders o where o.id=order_id and o.user_id=auth.uid())); create policy "delivery staff write" on public.delivery_assignments for all to authenticated using(public.is_staff(auth.uid())) with check(public.is_staff(auth.uid()));
create table public.payments(id uuid primary key default gen_random_uuid(),order_id uuid not null references public.orders(id),provider text not null,provider_transaction_id text,status public.payment_status not null default 'PENDING',amount numeric(12,2) not null,currency text not null default 'NPR',verified_at timestamptz,metadata jsonb not null default '{}',created_at timestamptz not null default now());
grant select on public.payments to authenticated; grant all on public.payments to service_role; alter table public.payments enable row level security; create policy "payments own or staff" on public.payments for select to authenticated using(public.is_staff(auth.uid()) or exists(select 1 from public.orders o where o.id=order_id and o.user_id=auth.uid()));

create table public.coupons(id uuid primary key default gen_random_uuid(),code text not null unique,discount_type text not null check(discount_type in('PERCENTAGE','FIXED')),discount_value numeric not null,min_order numeric not null default 0,usage_limit int,used_count int not null default 0,starts_at timestamptz,ends_at timestamptz,status text not null default 'ACTIVE',created_at timestamptz not null default now());
grant select on public.coupons to authenticated; grant insert,update,delete on public.coupons to authenticated; grant all on public.coupons to service_role; alter table public.coupons enable row level security; create policy "active coupons authenticated" on public.coupons for select to authenticated using(status='ACTIVE' or public.is_staff(auth.uid())); create policy "staff coupons write" on public.coupons for all to authenticated using(public.is_staff(auth.uid())) with check(public.is_staff(auth.uid()));
create table public.offers(id uuid primary key default gen_random_uuid(),name text not null,offer_type text not null check(offer_type in('PRODUCT','CATEGORY','COUPON','SHIPPING')),product_id uuid references public.products(id),category_id uuid references public.categories(id),discount_type text not null,discount_value numeric not null,starts_at timestamptz,ends_at timestamptz,usage_limit int,status text not null default 'ACTIVE',description text,created_at timestamptz not null default now());
grant select on public.offers to anon,authenticated; grant insert,update,delete on public.offers to authenticated; grant all on public.offers to service_role; alter table public.offers enable row level security; create policy "active offers public" on public.offers for select to anon,authenticated using(status='ACTIVE' or public.is_staff(auth.uid())); create policy "staff offers write" on public.offers for all to authenticated using(public.is_staff(auth.uid())) with check(public.is_staff(auth.uid()));
create table public.banners(id uuid primary key default gen_random_uuid(),title text not null,image_url text not null,link_url text,position text not null,status text not null default 'ACTIVE',starts_at timestamptz,ends_at timestamptz,sort_order int not null default 0,created_at timestamptz not null default now());
grant select on public.banners to anon,authenticated; grant insert,update,delete on public.banners to authenticated; grant all on public.banners to service_role; alter table public.banners enable row level security; create policy "active banners public" on public.banners for select to anon,authenticated using(status='ACTIVE' or public.is_staff(auth.uid())); create policy "staff banners write" on public.banners for all to authenticated using(public.is_staff(auth.uid())) with check(public.is_staff(auth.uid()));
create table public.reviews(id uuid primary key default gen_random_uuid(),user_id uuid not null,product_id uuid not null references public.products(id),order_id uuid references public.orders(id),rating int not null check(rating between 1 and 5),review text not null,status text not null default 'PENDING',created_at timestamptz not null default now(),unique(user_id,product_id,order_id));
grant select on public.reviews to anon,authenticated; grant insert,update,delete on public.reviews to authenticated; grant all on public.reviews to service_role; alter table public.reviews enable row level security; create policy "published reviews public" on public.reviews for select to anon,authenticated using(status='PUBLISHED' or user_id=auth.uid() or public.is_staff(auth.uid())); create policy "reviews own insert" on public.reviews for insert to authenticated with check(user_id=auth.uid()); create policy "reviews own update" on public.reviews for update to authenticated using(user_id=auth.uid() or public.is_staff(auth.uid())) with check(user_id=auth.uid() or public.is_staff(auth.uid()));
create table public.notifications(id uuid primary key default gen_random_uuid(),user_id uuid not null,title text not null,body text not null,type text not null,read_at timestamptz,created_at timestamptz not null default now());
grant select,update,delete on public.notifications to authenticated; grant all on public.notifications to service_role; alter table public.notifications enable row level security; create policy "notifications own" on public.notifications for select to authenticated using(user_id=auth.uid()); create policy "notifications own update" on public.notifications for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create table public.store_settings(id uuid primary key default gen_random_uuid(),store_name text not null,address text not null,phone text,email text,logo_url text,opening_time time,closing_time time,currency text not null default 'NPR',timezone text not null default 'Asia/Kathmandu',delivery_radius_km numeric,delivery_fee numeric,min_order numeric,estimated_delivery_minutes int,delivery_available boolean not null default true,updated_at timestamptz not null default now());
grant select on public.store_settings to anon,authenticated; grant insert,update on public.store_settings to authenticated; grant all on public.store_settings to service_role; alter table public.store_settings enable row level security; create policy "store settings public" on public.store_settings for select to anon,authenticated using(true); create policy "admins settings write" on public.store_settings for all to authenticated using(public.has_role(auth.uid(),'SUPER_ADMIN') or public.has_role(auth.uid(),'MANAGER')) with check(public.has_role(auth.uid(),'SUPER_ADMIN') or public.has_role(auth.uid(),'MANAGER'));

create index products_category_status_idx on public.products(category_id,status);create index orders_user_created_idx on public.orders(user_id,created_at desc);create index orders_status_created_idx on public.orders(status,created_at desc);create index delivery_staff_status_idx on public.delivery_assignments(staff_id,status);create index reviews_product_status_idx on public.reviews(product_id,status);create index notifications_user_created_idx on public.notifications(user_id,created_at desc);
create policy "public storefront media" on storage.objects for select to public using(bucket_id in('product-images','category-images','banners','store-branding'));create policy "staff storefront uploads" on storage.objects for all to authenticated using(bucket_id in('product-images','category-images','banners','store-branding') and public.is_staff(auth.uid())) with check(bucket_id in('product-images','category-images','banners','store-branding') and public.is_staff(auth.uid()));create policy "profile images own" on storage.objects for all to authenticated using(bucket_id='profile-images' and (storage.foldername(name))[1]=auth.uid()::text) with check(bucket_id='profile-images' and (storage.foldername(name))[1]=auth.uid()::text);

-- ---------------------------------------------------------------------------
-- 20260923083248_64a04a85-7a21-4c05-8a85-be3077821dd9.sql
-- ---------------------------------------------------------------------------
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;
alter function public.has_role(uuid, public.app_role) set schema private;
alter function public.is_staff(uuid) set schema private;
revoke all on function private.has_role(uuid, public.app_role) from public, anon;
revoke all on function private.is_staff(uuid) from public, anon;
grant execute on function private.has_role(uuid, public.app_role) to authenticated, service_role;
grant execute on function private.is_staff(uuid) to authenticated, service_role;

alter policy "profiles own read" on public.profiles using(id=auth.uid() or private.is_staff(auth.uid()));
alter policy "roles own read" on public.user_roles using(user_id=auth.uid() or private.has_role(auth.uid(),'SUPER_ADMIN'));
alter policy "active categories public" on public.categories using(status='ACTIVE' or private.is_staff(auth.uid()));
alter policy "staff categories write" on public.categories using(private.is_staff(auth.uid())) with check(private.is_staff(auth.uid()));
alter policy "active products public" on public.products using(status='ACTIVE' or private.is_staff(auth.uid()));
alter policy "staff products write" on public.products using(private.is_staff(auth.uid())) with check(private.is_staff(auth.uid()));
alter policy "product images public" on public.product_images using(exists(select 1 from public.products p where p.id=product_id and p.status='ACTIVE') or private.is_staff(auth.uid()));
alter policy "staff product images write" on public.product_images using(private.is_staff(auth.uid())) with check(private.is_staff(auth.uid()));
alter policy "inventory staff write" on public.inventory using(private.is_staff(auth.uid())) with check(private.is_staff(auth.uid()));
alter policy "inventory staff adjustments" on public.inventory_adjustments using(private.is_staff(auth.uid())) with check(private.is_staff(auth.uid()));
alter policy "addresses own" on public.addresses using(user_id=auth.uid() or private.is_staff(auth.uid())) with check(user_id=auth.uid() or private.is_staff(auth.uid()));
alter policy "orders own or staff read" on public.orders using(user_id=auth.uid() or private.is_staff(auth.uid()));
alter policy "staff update orders" on public.orders using(private.is_staff(auth.uid())) with check(private.is_staff(auth.uid()));
alter policy "order items own or staff" on public.order_items using(exists(select 1 from public.orders o where o.id=order_id and (o.user_id=auth.uid() or private.is_staff(auth.uid()))));
alter policy "delivery visible to owner staff" on public.delivery_assignments using(staff_id=auth.uid() or private.is_staff(auth.uid()) or exists(select 1 from public.orders o where o.id=order_id and o.user_id=auth.uid()));
alter policy "delivery staff write" on public.delivery_assignments using(private.is_staff(auth.uid())) with check(private.is_staff(auth.uid()));
alter policy "payments own or staff" on public.payments using(private.is_staff(auth.uid()) or exists(select 1 from public.orders o where o.id=order_id and o.user_id=auth.uid()));
alter policy "active coupons authenticated" on public.coupons using(status='ACTIVE' or private.is_staff(auth.uid()));
alter policy "staff coupons write" on public.coupons using(private.is_staff(auth.uid())) with check(private.is_staff(auth.uid()));
alter policy "active offers public" on public.offers using(status='ACTIVE' or private.is_staff(auth.uid()));
alter policy "staff offers write" on public.offers using(private.is_staff(auth.uid())) with check(private.is_staff(auth.uid()));
alter policy "active banners public" on public.banners using(status='ACTIVE' or private.is_staff(auth.uid()));
alter policy "staff banners write" on public.banners using(private.is_staff(auth.uid())) with check(private.is_staff(auth.uid()));
alter policy "published reviews public" on public.reviews using(status='PUBLISHED' or user_id=auth.uid() or private.is_staff(auth.uid()));
alter policy "reviews own update" on public.reviews using(user_id=auth.uid() or private.is_staff(auth.uid())) with check(user_id=auth.uid() or private.is_staff(auth.uid()));
alter policy "admins settings write" on public.store_settings using(private.has_role(auth.uid(),'SUPER_ADMIN') or private.has_role(auth.uid(),'MANAGER')) with check(private.has_role(auth.uid(),'SUPER_ADMIN') or private.has_role(auth.uid(),'MANAGER'));

drop policy "staff storefront uploads" on storage.objects;
create policy "staff storefront uploads" on storage.objects for all to authenticated using(bucket_id in('product-images','category-images','banners','store-branding') and private.is_staff(auth.uid())) with check(bucket_id in('product-images','category-images','banners','store-branding') and private.is_staff(auth.uid()));

-- ---------------------------------------------------------------------------
-- 20260928043827_9cd846d9-f044-43d4-a777-03e4fd13baf2.sql
-- ---------------------------------------------------------------------------
insert into public.categories(name,slug,description,sort_order) values ('Groceries','groceries','Fresh food and pantry staples',1),('Ladies Wear','ladies-wear','Fashion for every you',2),('Baby Care','baby-care','Daily care for little ones',3),('Stationery','stationery','School and office essentials',4),('Toys','toys','Play and learning',5),('Kitchen & Household','kitchen-household','Make home better',6),('Beauty & Skincare','beauty-skincare','Everyday personal care',7),('Cafe & Fast Food','cafe-fast-food','Quick bites and drinks',8),('Deals & Offers','deals-offers','Latest savings',9) on conflict(slug) do nothing;
with source(slug,name,sku,category_slug,price,unit,description,featured) as (values
('daawat-basmati-rice-5kg','Daawat Basmati Rice','SKU00123','groceries',1199::numeric,'5kg','Premium long-grain aromatic basmati rice, ideal for everyday meals and special occasions.',true),
('maggi-2-minute-noodles','Maggi 2-Minute Noodles','SKU00124','groceries',160::numeric,'280g','Quick, comforting noodles with a delicious masala flavour.',true),
('nivea-body-lotion-400ml','Nivea Body Lotion','SKU00125','beauty-skincare',425::numeric,'400ml','Daily moisturizing body lotion.',true),
('nike-ladies-t-shirt','Nike Ladies T-Shirt','SKU00126','ladies-wear',799::numeric,'1 pc','Comfortable everyday cotton t-shirt.',true),
('pampers-baby-diapers','Pampers Baby Diapers','SKU00127','baby-care',1350::numeric,'Large pack','Soft and absorbent baby diapers.',false),
('classmate-notebook','Classmate Notebook','SKU00128','stationery',60::numeric,'1 pc','Quality notebook for school and office.',false),
('wireless-headphones','Wireless Headphones','SKU00129','kitchen-household',2999::numeric,'1 pc','Immersive wireless sound.',true),
('running-shoes','Running Shoes','SKU00130','ladies-wear',1899::numeric,'1 pair','Lightweight sports shoes.',false),
('smart-watch','Smart Watch','SKU00131','kitchen-household',3499::numeric,'1 pc','Fitness tracking and alerts.',false),
('travel-backpack','Travel Backpack','SKU00132','ladies-wear',1299::numeric,'1 pc','Spacious, durable backpack.',false),
('sunflower-oil-1l','Sunflower Oil','SKU00133','groceries',210::numeric,'1L','Refined sunflower oil for everyday cooking.',false),
('fresh-banana-1kg','Fresh Banana','SKU00134','groceries',120::numeric,'1kg','Fresh, naturally sweet bananas.',false))
insert into public.products(category_id,name,slug,sku,description,price,unit,featured) select c.id,s.name,s.slug,s.sku,s.description,s.price,s.unit,s.featured from source s join public.categories c on c.slug=s.category_slug on conflict(slug) do nothing;
insert into public.inventory(product_id,current_stock,reserved_stock,low_stock_threshold) select p.id,case p.slug when 'daawat-basmati-rice-5kg' then 8 when 'maggi-2-minute-noodles' then 120 when 'nivea-body-lotion-400ml' then 45 when 'nike-ladies-t-shirt' then 32 when 'pampers-baby-diapers' then 24 when 'classmate-notebook' then 200 when 'wireless-headphones' then 18 when 'running-shoes' then 26 when 'smart-watch' then 15 when 'travel-backpack' then 38 when 'sunflower-oil-1l' then 50 else 60 end,0,10 from public.products p where p.slug in ('daawat-basmati-rice-5kg','maggi-2-minute-noodles','nivea-body-lotion-400ml','nike-ladies-t-shirt','pampers-baby-diapers','classmate-notebook','wireless-headphones','running-shoes','smart-watch','travel-backpack','sunflower-oil-1l','fresh-banana-1kg') on conflict(product_id) do nothing;
insert into public.store_settings(store_name,address,phone,email,opening_time,closing_time,currency,timezone,delivery_radius_km,delivery_fee,min_order,estimated_delivery_minutes) select 'Delight Shopping Mart','Ward No. 6, Tulsipur, Dang, Lumbini Province, Nepal',null,null,'07:00','21:00','NPR','Asia/Kathmandu',8,0,0,20 where not exists(select 1 from public.store_settings);

-- ---------------------------------------------------------------------------
-- 20260928043921_e0c6a0f0-d1fc-45d5-903e-b862814ad470.sql
-- ---------------------------------------------------------------------------
insert into public.coupons(code,discount_type,discount_value,min_order,status) values ('DELIGHT100','FIXED',100,500,'ACTIVE') on conflict(code) do nothing;
revoke insert on public.orders from authenticated;
revoke insert on public.order_items from authenticated;
drop policy if exists "orders own insert" on public.orders;
drop policy if exists "order items customer insert" on public.order_items;
create or replace function public.place_cod_order(p_items jsonb,p_address jsonb,p_coupon text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_user uuid:=auth.uid(); v_order uuid; v_number text; v_subtotal numeric:=0; v_discount numeric:=0; v_fee numeric:=0; v_stock integer; v_quantity integer; v_product record; v_item record; v_coupon record; v_count integer:=0; v_address text;
begin
 if v_user is null then raise exception 'Sign in before placing an order'; end if;
 if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items)=0 or jsonb_array_length(p_items)>50 then raise exception 'Invalid basket'; end if;
 if jsonb_typeof(p_address) <> 'object' then raise exception 'Delivery address required'; end if;
 if length(trim(coalesce(p_address->>'recipientName','')))<2 or length(trim(coalesce(p_address->>'phone','')))<7 or length(trim(coalesce(p_address->>'addressLine','')))<5 then raise exception 'Complete the delivery address'; end if;
 for v_item in select value from jsonb_array_elements(p_items) loop
  v_count:=v_count+1;
  if jsonb_typeof(v_item) <> 'object' or coalesce(v_item->>'slug','')='' or coalesce(v_item->>'quantity','') !~ '^[0-9]{1,3}$' then raise exception 'Invalid basket item'; end if;
  v_quantity:=(v_item->>'quantity')::int;
  if v_quantity<1 or v_quantity>99 then raise exception 'Invalid quantity'; end if;
  select p.id,p.name,p.sku,coalesce(p.sale_price,p.price) as price into v_product from public.products p where p.slug=v_item->>'slug' and p.status='ACTIVE';
  if not found then raise exception 'A product is unavailable'; end if;
  if (select count(*) from jsonb_array_elements(p_items) x where x->>'slug'=v_item->>'slug')>1 then raise exception 'Duplicate product in basket'; end if;
  select current_stock-reserved_stock into v_stock from public.inventory where product_id=v_product.id for update;
  if v_stock is null or v_stock<v_quantity then raise exception 'Not enough stock for %',v_product.name; end if;
  v_subtotal:=v_subtotal+v_product.price*v_quantity;
 end loop;
 if nullif(trim(coalesce(p_coupon,'')),'') is not null then
  select * into v_coupon from public.coupons where upper(code)=upper(trim(p_coupon)) and status='ACTIVE' and (starts_at is null or starts_at<=now()) and (ends_at is null or ends_at>=now()) and (usage_limit is null or used_count<usage_limit) for update;
  if not found or v_subtotal<v_coupon.min_order then raise exception 'Coupon is not valid for this order'; end if;
  v_discount:=case when v_coupon.discount_type='PERCENTAGE' then round(v_subtotal*v_coupon.discount_value/100,2) else v_coupon.discount_value end;
  v_discount:=least(v_discount,v_subtotal);
  update public.coupons set used_count=used_count+1 where id=v_coupon.id;
 end if;
 select coalesce(delivery_fee,0),coalesce(min_order,0) into v_fee,v_stock from public.store_settings where delivery_available=true order by updated_at desc limit 1;
 if not found then raise exception 'Delivery is unavailable'; end if;
 if v_subtotal<v_stock then raise exception 'Order is below the minimum order amount'; end if;
 v_number:='DLT-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12));
 v_address:=concat_ws(', ',trim(p_address->>'addressLine'),trim(p_address->>'city'),trim(p_address->>'province'));
 insert into public.orders(order_number,user_id,subtotal,discount,delivery_fee,total,payment_method,delivery_instructions,estimated_delivery_at)
 values(v_number,v_user,v_subtotal,v_discount,v_fee,v_subtotal-v_discount+v_fee,'COD',left('Deliver to: '||v_address||'. Recipient: '||trim(p_address->>'recipientName')||'. Phone: '||trim(p_address->>'phone')||'. '||coalesce(p_address->>'instructions',''),1000),now()+interval '20 minutes') returning id into v_order;
 for v_item in select value from jsonb_array_elements(p_items) loop
  v_quantity:=(v_item->>'quantity')::int;
  select p.id,p.name,p.sku,coalesce(p.sale_price,p.price) as price into v_product from public.products p where p.slug=v_item->>'slug' and p.status='ACTIVE';
  insert into public.order_items(order_id,product_id,product_name,sku,quantity,unit_price,line_total) values(v_order,v_product.id,v_product.name,v_product.sku,v_quantity,v_product.price,v_product.price*v_quantity);
  update public.inventory set current_stock=current_stock-v_quantity,last_updated=now() where product_id=v_product.id;
 end loop;
 return v_order;
end $$;
revoke all on function public.place_cod_order(jsonb,jsonb,text) from public,anon;
grant execute on function public.place_cod_order(jsonb,jsonb,text) to authenticated;

-- ---------------------------------------------------------------------------
-- 20260928043949_f16a5f30-b6b8-4a6d-86fb-8baab09d3834.sql
-- ---------------------------------------------------------------------------
alter function public.place_cod_order(jsonb,jsonb,text) set schema private;
create function public.place_cod_order(p_items jsonb,p_address jsonb,p_coupon text default null) returns uuid language sql security invoker set search_path = '' as $$select private.place_cod_order(p_items,p_address,p_coupon)$$;
revoke all on function public.place_cod_order(jsonb,jsonb,text) from public,anon;
grant execute on function public.place_cod_order(jsonb,jsonb,text) to authenticated;

-- ---------------------------------------------------------------------------
-- 20260928044023_ce5d68da-5081-4c9e-8794-fcdc6fb69b72.sql
-- ---------------------------------------------------------------------------
grant usage on schema private to authenticated;
grant execute on function private.place_cod_order(jsonb,jsonb,text) to authenticated;

-- ---------------------------------------------------------------------------
-- 20260929090000_storefront_catalog_access.sql
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 20260930090000_shopper_features.sql
-- ---------------------------------------------------------------------------
------------------------------------------------------------------------
-- Shopper features: newsletter, saved wishlist, cancelling your own order,
-- and automatic order-status notifications.
-- Safe to run more than once.
------------------------------------------------------------------------

-- 1. Newsletter subscribers ------------------------------------------------
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text not null default 'website',
  status text not null default 'SUBSCRIBED' check (status in ('SUBSCRIBED', 'UNSUBSCRIBED')),
  created_at timestamptz not null default now(),
  constraint newsletter_email_format check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email) <= 254)
);
create unique index if not exists newsletter_subscribers_email_key on public.newsletter_subscribers (lower(email));
alter table public.newsletter_subscribers enable row level security;
grant insert on public.newsletter_subscribers to anon, authenticated;
grant select, update, delete on public.newsletter_subscribers to authenticated;
grant all on public.newsletter_subscribers to service_role;
drop policy if exists "anyone can subscribe" on public.newsletter_subscribers;
create policy "anyone can subscribe" on public.newsletter_subscribers for insert to anon, authenticated
  with check (status = 'SUBSCRIBED' and source in ('website', 'app', 'footer', 'home'));
drop policy if exists "staff read subscribers" on public.newsletter_subscribers;
create policy "staff read subscribers" on public.newsletter_subscribers for select to authenticated using (private.is_staff(auth.uid()));
drop policy if exists "staff manage subscribers" on public.newsletter_subscribers;
create policy "staff manage subscribers" on public.newsletter_subscribers for update to authenticated using (private.is_staff(auth.uid())) with check (private.is_staff(auth.uid()));
drop policy if exists "staff delete subscribers" on public.newsletter_subscribers;
create policy "staff delete subscribers" on public.newsletter_subscribers for delete to authenticated using (private.is_staff(auth.uid()));

-- 2. Wishlist (saved items), one row per customer and product ---------------
create table if not exists public.wishlist_items (
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);
alter table public.wishlist_items enable row level security;
grant select, insert, delete on public.wishlist_items to authenticated;
grant all on public.wishlist_items to service_role;
drop policy if exists "wishlist own" on public.wishlist_items;
create policy "wishlist own" on public.wishlist_items for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 3. Customers can cancel their own order before it is packed ---------------
create or replace function private.cancel_my_order(p_order uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_status public.order_status;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  select status into v_status from public.orders where id = p_order and user_id = auth.uid() for update;
  if not found then raise exception 'Order not found'; end if;
  if v_status = 'CANCELLED' then raise exception 'This order is already cancelled.'; end if;
  if v_status not in ('PENDING', 'CONFIRMED') then raise exception 'This order is already being packed and can no longer be cancelled. Please call the store.'; end if;
  update public.orders set status = 'CANCELLED', updated_at = now() where id = p_order;
end $$;
revoke all on function private.cancel_my_order(uuid) from public, anon;
grant execute on function private.cancel_my_order(uuid) to authenticated;

create or replace function public.cancel_my_order(p_order uuid)
returns void language sql security invoker set search_path = '' as $$ select private.cancel_my_order(p_order) $$;
revoke all on function public.cancel_my_order(uuid) from public, anon;
grant execute on function public.cancel_my_order(uuid) to authenticated;

-- 4. A notification for the customer whenever their order status changes -----
create or replace function private.notify_order_status()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_title text; v_body text;
begin
  if tg_op = 'UPDATE' and new.status is not distinct from old.status then return new; end if;
  v_title := case new.status
    when 'PENDING' then 'Order placed'
    when 'CONFIRMED' then 'Order confirmed'
    when 'PREPARING' then 'Packing your order'
    when 'READY_FOR_DELIVERY' then 'Ready for delivery'
    when 'OUT_FOR_DELIVERY' then 'Out for delivery'
    when 'DELIVERED' then 'Delivered'
    when 'CANCELLED' then 'Order cancelled'
    else 'Order update' end;
  v_body := 'Order ' || new.order_number || ': ' || case new.status
    when 'PENDING' then 'we have received your order.'
    when 'CONFIRMED' then 'the store has confirmed it.'
    when 'PREPARING' then 'your items are being packed.'
    when 'READY_FOR_DELIVERY' then 'packed and waiting for a rider.'
    when 'OUT_FOR_DELIVERY' then 'your rider is on the way.'
    when 'DELIVERED' then 'delivered. Thank you for shopping with Delight!'
    when 'CANCELLED' then 'cancelled.'
    else lower(new.status::text) end;
  insert into public.notifications (user_id, title, body, type) values (new.user_id, v_title, v_body, 'ORDER');
  return new;
end $$;
drop trigger if exists orders_notify_status on public.orders;
create trigger orders_notify_status after insert or update of status on public.orders
  for each row execute function private.notify_order_status();

-- ---------------------------------------------------------------------------
-- 20260930120000_store_admin_account.sql
-- ---------------------------------------------------------------------------
------------------------------------------------------------------------
-- Store admin account: info@delightshoppingmart.com is a Super Admin.
-- The account itself (email + password) is created in
-- Supabase Dashboard -> Authentication -> Users -> Add user.
-- Run this file before or after creating that user; both orders work.
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
  -- Store admin accounts become Super Admins automatically.
  if lower(coalesce(new.email, '')) in ('info@delightshoppingmart.com', 'nishchalkc370@gmail.com') then
    insert into public.user_roles (user_id, role) values (new.id, 'SUPER_ADMIN') on conflict do nothing;
    update public.profiles set full_name = 'Delight Shopping Mart'
      where id = new.id and lower(coalesce(new.email, '')) = 'info@delightshoppingmart.com';
  end if;
  return new;
end $$;

-- If the admin user already exists, give it the role now.
insert into public.profiles (id, full_name, email)
select id, 'Delight Shopping Mart', email from auth.users where lower(email) = 'info@delightshoppingmart.com'
on conflict (id) do update set full_name = 'Delight Shopping Mart';
insert into public.user_roles (user_id, role)
select id, 'SUPER_ADMIN' from auth.users where lower(email) = 'info@delightshoppingmart.com'
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- 20261001090000_branches.sql
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 20261001120000_security_hardening.sql
-- ---------------------------------------------------------------------------
------------------------------------------------------------------------
-- Security hardening before going live. Safe to run more than once.
--
-- 1. Reviews: customers' reviews always start as PENDING and customers cannot publish
--    (or un-hide) their own review; only staff change a review's status.
-- 2. Profiles: a customer cannot change their own account status (so a deactivated
--    account cannot re-activate itself); only staff can.
------------------------------------------------------------------------

create or replace function private.guard_review_status()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if private.is_staff(auth.uid()) or auth.uid() is null then return new; end if;
  if tg_op = 'INSERT' then
    new.status := 'PENDING';
  elsif new.status is distinct from old.status then
    -- Editing a review sends it back for moderation; publishing is staff-only.
    new.status := 'PENDING';
  end if;
  return new;
end $$;
revoke all on function private.guard_review_status() from public, anon, authenticated;
drop trigger if exists reviews_guard_status on public.reviews;
create trigger reviews_guard_status before insert or update on public.reviews
  for each row execute function private.guard_review_status();

create or replace function private.guard_profile_status()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status is distinct from old.status and not private.is_staff(auth.uid()) and auth.uid() is not null then
    new.status := old.status;
  end if;
  return new;
end $$;
revoke all on function private.guard_profile_status() from public, anon, authenticated;
drop trigger if exists profiles_guard_status on public.profiles;
create trigger profiles_guard_status before update on public.profiles
  for each row execute function private.guard_profile_status();
