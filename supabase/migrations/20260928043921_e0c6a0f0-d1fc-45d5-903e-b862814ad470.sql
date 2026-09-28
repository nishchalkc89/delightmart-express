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