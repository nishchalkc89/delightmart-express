import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Copy, Percent, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { useCheckout } from '@/components/delight/checkout-context';
import { useCart } from '@/components/delight/cart-context';
import { AccountTitle } from '@/components/delight/account-ui';
import { formatNpr } from '@/services/catalog';
import { supabase } from '@/services/supabase';

export const Route = createFileRoute('/account/offers')({
  head: () => ({ meta: [{ title: 'Offers & Coupons — Delight' }, { name: 'description', content: 'Coupon codes and offers at Delight Shopping Mart.' }] }),
  component: Page,
});

type Coupon = { code: string; discount_type: string; discount_value: number; min_order: number; ends_at: string | null; usage_limit: number | null; used_count: number };

function Page() {
  const checkout = useCheckout();
  const cart = useCart();
  const nav = useNavigate();
  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ['my-coupons'],
    queryFn: async () => {
      const { data, error } = await supabase.from('coupons').select('code,discount_type,discount_value,min_order,ends_at,usage_limit,used_count,starts_at').eq('status', 'ACTIVE').order('min_order');
      if (error) throw error;
      const now = Date.now();
      return (data ?? []).filter((c) => (!c.starts_at || new Date(c.starts_at).getTime() <= now) && (!c.ends_at || new Date(c.ends_at).getTime() >= now) && (c.usage_limit === null || c.used_count < c.usage_limit)) as Coupon[];
    },
  });

  function copy(code: string) {
    void navigator.clipboard?.writeText(code).then(() => toast.success(`${code} copied`), () => toast.info(code));
  }
  function use(code: string) {
    checkout.setCoupon(code);
    toast.success(`${code} will be ready in your cart — tap Apply there`);
    if (cart.lines.length) void nav({ to: '/cart' });
    else void nav({ to: '/categories/$slug', params: { slug: 'deals-offers' } });
  }

  return (
    <div>
      <AccountTitle title="Offers & Coupons" sub="Use these codes in your cart to save on your order." />
      <div className="mt-4 space-y-3">
        {isLoading && [0, 1].map((i) => <div key={i} className="h-[110px] animate-pulse rounded-2xl bg-[#f1f4f7]" />)}
        {coupons.map((c) => {
          const off = c.discount_type === 'PERCENTAGE' ? `${Number(c.discount_value)}% OFF` : `${formatNpr(Number(c.discount_value))} OFF`;
          return (
            <article key={c.code} className="flex overflow-hidden rounded-2xl border border-line bg-white">
              <div className="grid w-[92px] shrink-0 place-items-center bg-red px-2 text-center text-white [writing-mode:vertical-rl] rotate-180">
                <b className="text-[17px] font-extrabold tracking-wide">{off}</b>
              </div>
              <div className="min-w-0 flex-1 p-4">
                <div className="flex items-center gap-2">
                  <span className="rounded-md border border-dashed border-brand bg-[#effaf4] px-2.5 py-1 font-mono text-[15px] font-bold tracking-wider text-brand">{c.code}</span>
                  <button onClick={() => copy(c.code)} aria-label={`Copy ${c.code}`} className="p-1 text-slate hover:text-brand"><Copy className="size-4" /></button>
                </div>
                <p className="mt-2 text-[14px] text-navy">Get {off.toLowerCase()} {Number(c.min_order) > 0 ? `on orders above ${formatNpr(Number(c.min_order))}` : 'on your order'}.</p>
                <p className="text-[12.5px] text-slate">{c.ends_at ? `Valid till ${new Date(c.ends_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` : 'No expiry date'} · One use per order</p>
                <button onClick={() => use(c.code)} className="mt-3 rounded-lg bg-brand px-4 py-2 text-[13.5px] font-semibold text-white">Use this code</button>
              </div>
            </article>
          );
        })}
        {!isLoading && !coupons.length && (
          <div className="rounded-2xl border border-line bg-white p-8 text-center">
            <Tag className="mx-auto size-10 text-slate" />
            <p className="mt-2 text-[15px] text-slate">No coupon codes right now. Check back soon!</p>
          </div>
        )}
      </div>
      <Link to="/categories/$slug" params={{ slug: 'deals-offers' }} className="mt-4 flex items-center gap-3 rounded-2xl border border-[#fbd9de] bg-[#fdeef0] px-4 py-3.5">
        <span className="grid size-10 place-items-center rounded-full bg-red text-white"><Percent className="size-5" strokeWidth={3} /></span>
        <span className="flex-1"><b className="block text-[15.5px] font-bold text-navy">Today’s Deals</b><span className="text-[13px] text-slate">Products with discounts already applied</span></span>
        <span className="text-[14px] font-bold text-red">Shop</span>
      </Link>
    </div>
  );
}
