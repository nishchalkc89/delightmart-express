import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '@/components/delight/cart-context';
import { CheckoutPage, FastNote, OrderSummaryCard } from '@/components/delight/checkout-ui';
import { formatNpr } from '@/services/catalog';

export const Route = createFileRoute('/cart')({
  head: () => ({ meta: [{ title: 'Your Cart — Delight Shopping Mart' }, { name: 'description', content: 'Review your Delight Shopping Mart cart.' }, { property: 'og:title', content: 'Your Cart — Delight' }, { property: 'og:description', content: 'Review your items before checkout.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: Page,
});

function Page() {
  const c = useCart();
  return (
    <CheckoutPage step={1}>
      <div className="mt-6 flex items-end justify-between">
        <div>
          <h1 className="text-[30px] font-extrabold tracking-tight text-navy lg:text-[40px]">My Cart</h1>
          <p className="text-[14.5px] text-slate lg:text-[16px]">{c.count} item{c.count === 1 ? '' : 's'} in your cart</p>
        </div>
        {c.lines.length > 0 && <button onClick={c.clear} className="text-[15px] font-medium text-red">Clear Cart</button>}
      </div>

      {!c.lines.length ? (
        <div className="mt-8 rounded-xl border border-line bg-white p-10 text-center">
          <ShoppingBag className="mx-auto size-16 text-slate" strokeWidth={1.4} />
          <h2 className="mt-4 text-[20px] font-bold text-navy">Your cart is empty</h2>
          <p className="mt-1 text-slate">Fresh groceries and daily essentials are waiting for you.</p>
          <Link to="/products" className="mt-5 inline-flex h-12 items-center rounded-lg bg-brand px-7 font-semibold text-white">Start Shopping</Link>
        </div>
      ) : (
        <>
          <section className="mt-4 rounded-xl border border-line bg-white px-5 py-2">
            {c.lines.map(({ product: p, quantity }) => (
              <div key={p.id} className="flex items-center gap-4 border-b border-line py-3.5 last:border-0">
                <Link to="/products/$slug" params={{ slug: p.slug }}><img src={p.image} alt={p.name} className="h-[72px] w-[84px] shrink-0 object-contain" /></Link>
                <div className="min-w-0 flex-1">
                  <b className="block text-[16px] font-semibold text-navy">{p.name}</b>
                  <span className="text-[14px] text-slate">{p.unit}</span>
                  <b className="mt-0.5 block text-[16px] font-bold text-red">{formatNpr(p.price)}</b>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button onClick={() => c.remove(p.id)} aria-label={`Remove ${p.name}`} className="text-slate hover:text-red"><Trash2 className="size-5" /></button>
                  <div className="flex items-center gap-3">
                    <button aria-label="Decrease" onClick={() => c.setQuantity(p.id, quantity - 1)} className="grid size-8 place-items-center rounded-full bg-[#eef1f4]"><Minus className="size-4" /></button>
                    <b className="w-5 text-center">{quantity}</b>
                    <button aria-label="Increase" onClick={() => c.setQuantity(p.id, quantity + 1)} className="grid size-8 place-items-center rounded-full bg-[#eef1f4]"><Plus className="size-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </section>
          <div className="mt-4">
            <OrderSummaryCard count={c.lines.length} subtotal={c.subtotal} note={<FastNote title="You're saving NPR 20 on this order!" sub="Fast delivery. No extra charges." />} />
          </div>
          <Link to="/checkout" className="mt-5 flex h-[52px] w-full items-center justify-center gap-3 rounded-xl bg-brand text-[17px] font-semibold text-white shadow-md shadow-brand/20 hover:bg-brand-dark">Proceed to Checkout <ArrowRight className="size-5" /></Link>
        </>
      )}
    </CheckoutPage>
  );
}
