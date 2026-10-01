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
