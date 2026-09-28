alter function public.place_cod_order(jsonb,jsonb,text) set schema private;
create function public.place_cod_order(p_items jsonb,p_address jsonb,p_coupon text default null) returns uuid language sql security invoker set search_path = '' as $$select private.place_cod_order(p_items,p_address,p_coupon)$$;
revoke all on function public.place_cod_order(jsonb,jsonb,text) from public,anon;
grant execute on function public.place_cod_order(jsonb,jsonb,text) to authenticated;