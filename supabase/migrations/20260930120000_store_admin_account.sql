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
