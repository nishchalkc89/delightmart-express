import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { Loader2, Lock, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useCart } from '@/components/delight/cart-context';
import { useCheckout } from '@/components/delight/checkout-context';
import { useAuth } from '@/components/delight/auth-context';
import { ActionButton, AddressBar, AddressSheet, BillSummary, Box, CheckoutShell, EmptyCart, PaymentIcon, Radio, SavingsCard, paymentOptions, useBill } from '@/components/delight/checkout-ui';
import { formatNpr } from '@/services/catalog';
import { placeOrder } from '@/services/orders';

export const Route = createFileRoute('/payment')({
  head: () => ({ meta: [{ title: 'Payment — Delight Shopping Mart' }, { name: 'description', content: 'Choose how to pay for your order.' }, { property: 'og:title', content: 'Payment — Delight' }, { property: 'og:description', content: 'Pay for your order.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: Page,
});

function Page() {
  const cart = useCart();
  const checkout = useCheckout();
  const bill = useBill();
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [placing, setPlacing] = useState(false);
  const [sheet, setSheet] = useState(false);
  const d = checkout.details;
  const ready = Boolean(d.addressId && d.recipientName && d.addressLine);

  // Payment needs a signed-in customer with a delivery address; otherwise go back to the cart.
  useEffect(() => {
    if (loading) return;
    if (!user) void nav({ to: '/login', search: { redirect: '/cart' } });
    else if (cart.lines.length && !ready) void nav({ to: '/cart' });
  }, [loading, user, ready, cart.lines.length, nav]);

  async function placeOrderNow() {
    if (!user || !ready) return;
    const method = paymentOptions.find((o) => o.value === checkout.paymentMethod)!;
    if (!method.available) { toast.error(`${method.title} is coming soon. Please choose Cash on Delivery.`); return; }
    setPlacing(true);
    try {
      const order = await placeOrder({ userId: user.id, lines: cart.lines, subtotal: cart.subtotal, discount: checkout.discount, paymentMethod: 'COD', details: checkout.details, coupon: checkout.discount > 0 ? checkout.coupon : '' });
      cart.clear();
      checkout.setCoupon('');
      checkout.setDetails({ ...checkout.details, instructions: '' });
      toast.success('Order placed! We’re packing it now.');
      void nav({ to: '/orders/$id', params: { id: order.id } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to place the order');
    } finally {
      setPlacing(false);
    }
  }

  if (!cart.lines.length) return <CheckoutShell title="Payment"><EmptyCart /></CheckoutShell>;

  const groups = [...new Set(paymentOptions.map((o) => o.group))];
  const footer = (
    <>
      {ready && <AddressBar onChange={() => setSheet(true)} />}
      <ActionButton onClick={() => void placeOrderNow()} disabled={placing || !ready || bill.belowMinimum}>
        {placing ? <Loader2 className="size-5 animate-spin" /> : <><Lock className="size-4" /> {checkout.paymentMethod === 'COD' ? `Place Order · ${formatNpr(bill.toPay)}` : `Pay ${formatNpr(bill.toPay)}`}</>}
      </ActionButton>
    </>
  );

  return (
    <CheckoutShell title="Select Payment Method" footer={footer} aside={<><BillSummary /><SavingsCard /></>}>
      <Box className="flex items-center justify-between px-4 py-3">
        <span><span className="block text-[13px] text-slate">To Pay</span><b className="text-[20px] font-extrabold text-navy">{formatNpr(bill.toPay)}</b></span>
        <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-brand"><ShieldCheck className="size-5" /> 100% safe &amp; secure</span>
      </Box>

      {groups.map((group) => (
        <Box key={group} className="p-4">
          <h2 className="text-[15px] font-bold text-navy">{group}</h2>
          <div className="mt-2 divide-y divide-line">
            {paymentOptions.filter((o) => o.group === group).map((o) => {
              const on = checkout.paymentMethod === o.value;
              return (
                <button key={o.value} type="button" disabled={!o.available} onClick={() => checkout.setPaymentMethod(o.value)} className="flex w-full items-center gap-3 py-3 text-left disabled:cursor-not-allowed">
                  <PaymentIcon icon={o.icon} />
                  <span className={`min-w-0 flex-1 ${o.available ? '' : 'opacity-50'}`}>
                    <b className="block text-[15px] font-semibold text-navy">{o.title}</b>
                    <span className="text-[12.5px] text-slate">{o.sub}</span>
                  </span>
                  {o.available ? <Radio checked={on} /> : <span className="rounded-full bg-[#f1f4f7] px-2.5 py-1 text-[11.5px] font-semibold text-slate">Coming soon</span>}
                </button>
              );
            })}
          </div>
        </Box>
      ))}

      <p className="px-1 text-center text-[12.5px] text-slate">By placing this order you agree to our <Link to="/terms" className="font-semibold text-brand">Terms &amp; Conditions</Link>. <Link to="/cart" className="font-semibold text-red">Back to cart</Link></p>
      <AddressSheet open={sheet} onOpenChange={setSheet} />
    </CheckoutShell>
  );
}
