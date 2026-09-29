import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowRight, MapPin, Pencil, Wallet, Zap } from 'lucide-react';
import type { ReactNode } from 'react';
import { useCart } from '@/components/delight/cart-context';
import { useCheckout } from '@/components/delight/checkout-context';
import { CheckoutPage, EmptyCartNotice, FastNote, OrderSummaryCard, paymentLabel } from '@/components/delight/checkout-ui';
import { formatNpr } from '@/services/catalog';
import { asset } from '@/lib/assets';

export const Route = createFileRoute('/review-order')({
  head: () => ({ meta: [{ title: 'Review Your Order — Delight' }, { name: 'description', content: 'Review order details before payment.' }, { property: 'og:title', content: 'Review Order — Delight' }, { property: 'og:description', content: 'Confirm your items and delivery details.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: Page,
});

function EditLink({ to }: { to: '/checkout' | '/cart' | '/payment' }) {
  return <Link to={to} className="flex items-center gap-1.5 text-[15px] font-medium text-brand"><Pencil className="size-4" /> Edit</Link>;
}

function Card({ icon, title, action, children }: { icon: ReactNode; title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-white px-4 py-3.5 lg:px-5 lg:py-4">
      <div className="flex gap-3 lg:gap-4">
        <span className="pt-0.5">{icon}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2"><h2 className="text-[17.5px] font-bold text-navy lg:text-[19px]">{title}</h2>{action}</div>
          {children}
        </div>
      </div>
    </section>
  );
}

function Page() {
  const cart = useCart();
  const checkout = useCheckout();
  const d = checkout.details;
  const pay = paymentLabel(checkout.paymentMethod);

  return (
    <CheckoutPage step={3}>
      <h1 className="mt-5 text-[28px] font-extrabold tracking-tight text-navy lg:text-[38px]">Review Your Order</h1>
      <p className="text-[14.5px] text-slate lg:text-[16px]">Almost there! Please review your order before payment.</p>

      {!cart.lines.length ? <EmptyCartNotice /> : (
        <div className="mt-4 space-y-3">
          <Card icon={<MapPin className="size-8 fill-brand text-white" />} title="Delivery Address" action={<EditLink to="/checkout" />}>
            <div className="flex items-end justify-between gap-3">
              <div className="mt-1 text-[13.5px] leading-[1.45] lg:text-[15px] lg:leading-6">
                <b className="font-semibold text-navy">{d.recipientName || 'Address not entered'}</b>
                <p className="text-slate">{d.addressLine}<br />{[d.city, d.province].filter(Boolean).join(', ')}</p>
                <p className="text-slate">Phone: {d.phone}</p>
              </div>
              <span className="mb-4 flex shrink-0 items-center gap-1 rounded-full bg-[#e3f5ec] px-3 py-1.5 text-[14px] font-semibold text-brand lg:px-4 lg:py-2 lg:text-[16px]"><Zap className="size-4 fill-brand" /> 15–20 min</span>
            </div>
          </Card>

          <Card icon={<Zap className="size-8 fill-navy text-navy" />} title="Delivery Time" action={<EditLink to="/checkout" />}>
            <b className="mt-1.5 block text-[18px] font-bold text-brand lg:text-[20px]">Get it in 15–20 minutes</b>
            <p className="text-[13.5px] text-slate lg:text-[14.5px]">We'll deliver to your location as soon as possible.</p>
          </Card>

          <section className="rounded-xl border border-line bg-white px-4 py-3.5 lg:px-5 lg:py-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h2 className="text-[18px] font-bold text-navy">Order Items ({cart.lines.length})</h2>
              <Link to="/cart" className="text-[15px] font-medium text-brand">Edit Cart</Link>
            </div>
            {cart.lines.map(({ product: p, quantity }) => (
              <div key={p.id} className="flex items-center gap-4 border-b border-line py-3 last:border-0">
                <img src={p.image} alt={p.name} className="h-[60px] w-[72px] shrink-0 object-contain lg:h-[72px] lg:w-[92px]" />
                <div className="min-w-0 flex-1"><b className="block text-[14.5px] font-semibold text-navy lg:text-[16px]">{p.name}</b><span className="text-[13px] text-slate lg:text-[14.5px]">{p.unit}</span></div>
                <div className="text-right"><span className="block text-[13.5px] text-slate lg:text-[15px]">Qty: {quantity}</span><b className="text-[15.5px] font-bold text-navy lg:text-[17px]">{formatNpr(quantity * p.price)}</b></div>
              </div>
            ))}
          </section>

          <Card icon={<Wallet className="size-7 text-navy" />} title="Payment Method" action={<EditLink to="/payment" />}>
            <div className="mt-2 flex items-center gap-4">
              <img src={asset(pay.icon)} alt="" className="size-12 object-contain" />
              <span className="flex-1"><b className="block text-[15px] font-semibold text-navy">{pay.title}</b><span className="text-[13.5px] text-slate">{pay.sub}</span></span>
              <img src={asset(pay.mark)} alt="" className="h-10 w-auto max-w-[36%] object-contain mix-blend-multiply" />
            </div>
          </Card>

          <OrderSummaryCard count={cart.lines.length} subtotal={cart.subtotal} discount={checkout.discount} note={<FastNote title="You're saving NPR 20 on this order!" sub="Fast delivery in 15–20 minutes. No extra charges." />} />

          <Link to="/payment" className="!mt-5 flex h-[52px] w-full items-center justify-center gap-3 rounded-xl bg-brand text-[17px] font-semibold text-white shadow-md shadow-brand/20 hover:bg-brand-dark">Proceed to Payment <ArrowRight className="size-5" /></Link>
        </div>
      )}
    </CheckoutPage>
  );
}
