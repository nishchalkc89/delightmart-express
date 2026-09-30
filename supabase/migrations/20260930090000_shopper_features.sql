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
