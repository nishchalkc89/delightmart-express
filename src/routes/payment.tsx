import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { ArrowRight, Lock, Percent, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useCart } from '@/components/delight/cart-context';
import { useCheckout } from '@/components/delight/checkout-context';
import { useAuth } from '@/components/delight/auth-context';
import { CheckoutPage, EmptyCartNotice, FastNote, OrderSummaryCard, PaymentOptions, PrimaryButton, ViewDetails, paymentLabel } from '@/components/delight/checkout-ui';
import { formatNpr } from '@/services/catalog';
import { placeOrder } from '@/services/orders';

export const Route = createFileRoute('/payment')({
  head: () => ({ meta: [{ title: 'Secure Payment — Delight Shopping Mart' }, { name: 'description', content: 'Choose a secure payment method.' }, { property: 'og:title', content: 'Secure Payment — Delight' }, { property: 'og:description', content: 'Pay securely for your order.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: Page,
});

function Page() {
  const cart = useCart();
  const checkout = useCheckout();
  const { user } = useAuth();
  const nav = useNavigate();
  const [placing, setPlacing] = useState(false);
  const total = Math.max(0, cart.subtotal - checkout.discount);
  const method = paymentLabel(checkout.paymentMethod);

  async function submit() {
    if (!cart.lines.length) { toast.error('Your cart is empty'); return; }
    if (checkout.paymentMethod !== 'COD') { toast.error(`${method.title} payments are coming soon. Please choose Cash on Delivery for now.`); return; }
    if (!user) { toast.error('Sign in to place your order'); void nav({ to: '/login' }); return; }
    if (!checkout.details.recipientName || !checkout.details.phone || !checkout.details.addressLine) { toast.error('Complete your delivery address'); void nav({ to: '/checkout' }); return; }
    setPlacing(true);
    try {
      const order = await placeOrder({ userId: user.id, lines: cart.lines, subtotal: cart.subtotal, discount: checkout.discount, paymentMethod: 'COD', details: checkout.details, coupon: checkout.discount > 0 ? checkout.coupon : '' });
      cart.clear();
      checkout.reset();
      toast.success('Your order has been placed');
      void nav({ to: '/orders/$id', params: { id: order.id } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to place the order');
    } finally {
      setPlacing(false);
    }
  }

  function apply() {
    const ok = checkout.applyCoupon();
    toast[ok ? 'success' : 'error'](ok ? 'Promo code applied' : 'Invalid promo code');
  }

  return (
    <CheckoutPage step={4}>
      <div className="mt-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[32px] font-extrabold tracking-tight text-navy lg:text-[40px]">Payment</h1>
          <p className="text-[14.5px] text-slate lg:text-[16px]">Almost there! Choose your preferred payment method.</p>
        </div>
        <span className="flex shrink-0 items-center gap-2 pt-2 text-[14px] leading-5 text-slate"><ShieldCheck className="size-8 text-brand" strokeWidth={1.6} />100% Secure<br />Payments</span>
      </div>

      <div className="mt-5"><PaymentOptions value={checkout.paymentMethod} onChange={checkout.setPaymentMethod} /></div>

      <section className="mt-4 flex gap-4 rounded-xl bg-[#eef8f3] px-4 py-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand text-white"><Percent className="size-5" strokeWidth={3} /></span>
        <div className="min-w-0 flex-1">
          <b className="block text-[18px] font-bold text-brand">Have a promo code?</b>
          <div className="mt-2 flex gap-3">
            <input value={checkout.coupon} onChange={(e) => checkout.setCoupon(e.target.value)} placeholder="Enter promo code" className="h-12 min-w-0 flex-1 rounded-lg border border-line bg-white px-4 text-[16px] outline-none focus:border-brand" aria-label="Promo code" />
            <button onClick={apply} className="h-12 rounded-lg bg-[#d6efe2] px-7 text-[17px] font-semibold text-brand">Apply</button>
          </div>
        </div>
      </section>

      {cart.lines.length ? (
        <div className="mt-4">
          <OrderSummaryCard count={cart.lines.length} subtotal={cart.subtotal} discount={checkout.discount} link={<Link to="/review-order"><ViewDetails /></Link>} note={<FastNote title="Super Fast Delivery" sub="Get it in 15–20 minutes at your doorstep!" />} />
        </div>
      ) : <EmptyCartNotice />}

      <PrimaryButton onClick={submit} disabled={placing || !cart.lines.length}>
        <Lock className="size-5" /> {placing ? 'Placing order…' : checkout.paymentMethod === 'COD' ? `Place Order · ${formatNpr(total)}` : `Pay ${formatNpr(total)} with ${method.title}`} <ArrowRight className="size-5" />
      </PrimaryButton>
      <p className="mt-4 text-center text-[14px] text-slate">By placing this order, you agree to our <Link to="/" className="text-brand">Terms &amp; Conditions</Link> and <Link to="/" className="text-brand">Privacy Policy</Link>.</p>
    </CheckoutPage>
  );
}
