import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { ArrowRight, House, Pencil, Plus, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useCart } from '@/components/delight/cart-context';
import { useCheckout, type DeliveryDetails } from '@/components/delight/checkout-context';
import { CheckoutPage, EmptyCartNotice, FastNote, OrderSummaryCard, PaymentOptions, PrimaryButton, Radio } from '@/components/delight/checkout-ui';
import { Input } from '@/components/ui/input';

export const Route = createFileRoute('/checkout')({
  head: () => ({ meta: [{ title: 'Checkout — Delight Shopping Mart' }, { name: 'description', content: 'Choose delivery and payment details for your Delight order.' }, { property: 'og:title', content: 'Checkout — Delight' }, { property: 'og:description', content: 'Complete your Delight order.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: Page,
});

type Saved = DeliveryDetails & { id: string; label: string; isDefault?: boolean };

// Demo saved addresses shown in the approved checkout screen.
const savedAddresses: Saved[] = [
  { id: 'a1', label: 'Nishchal Kc', isDefault: true, recipientName: 'Nishchal Kc', phone: '9801234567', addressLine: 'Ward No. 6, Tulsipur Sub-Metropolitan City', city: 'Dang', province: 'Lumbini Province, Nepal', instructions: '' },
  { id: 'a2', label: 'Home', recipientName: 'Nishchal Kc', phone: '9801234567', addressLine: 'Ward No. 3, Tulsipur', city: 'Dang', province: '', instructions: '' },
];

function Page() {
  const cart = useCart();
  const checkout = useCheckout();
  const nav = useNavigate();
  const { details } = checkout;
  const [selected, setSelected] = useState<string>('a1');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!details.addressLine) checkout.setDetails(savedAddresses[0]!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function choose(a: Saved) {
    setSelected(a.id);
    setAdding(false);
    checkout.setDetails({ recipientName: a.recipientName, phone: a.phone, addressLine: a.addressLine, city: a.city, province: a.province, instructions: details.instructions });
  }
  function update(key: keyof DeliveryDetails, value: string) {
    checkout.setDetails({ ...details, [key]: value });
  }
  function next() {
    if (!cart.lines.length) { toast.error('Add items to your cart first'); return; }
    if (!details.recipientName.trim() || !details.phone.trim() || !details.addressLine.trim()) { toast.error('Enter your name, phone, and delivery address'); return; }
    void nav({ to: '/review-order' });
  }

  return (
    <CheckoutPage step={2}>
      <h1 className="mt-5 text-[30px] font-extrabold tracking-tight text-navy lg:text-[40px]">Checkout</h1>
      <p className="text-[15px] text-slate lg:text-[17px]">Get your groceries delivered in minutes</p>

      <div className="mt-5 flex items-center justify-between">
        <h2 className="text-[18.5px] font-bold text-navy lg:text-[23px]">1. Delivery Address</h2>
        <button onClick={() => { setAdding(true); setSelected(''); }} className="flex items-center gap-1 text-[14.5px] font-medium text-brand lg:text-[16px]"><Plus className="size-4" /> Add New Address</button>
      </div>
      <div className="mt-3 space-y-2.5">
        {savedAddresses.map((a) => {
          const on = selected === a.id;
          return (
            <div key={a.id} role="button" tabIndex={0} onClick={() => choose(a)} onKeyDown={(e) => e.key === 'Enter' && choose(a)} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 lg:gap-4 lg:px-4 ${on ? 'border-brand/40 bg-[#effaf4]' : 'border-line bg-white'}`}>
              <Radio checked={on} />
              <House className="size-7 shrink-0 text-navy lg:size-8" strokeWidth={1.8} />
              <div className="min-w-0 flex-1">
                <b className="block text-[15px] font-semibold text-navy">{a.label}</b>
                <p className="text-[13px] leading-5 text-slate lg:text-[14.5px] lg:leading-6">
                  {a.addressLine} {a.isDefault && <span className="ml-1 rounded-full bg-[#d8f1e4] px-2 py-0.5 text-[11px] font-semibold text-brand">Default</span>}
                  {a.province && <><br />{a.city}, {a.province}</>}
                  {!a.province && <>, {a.city}</>}
                </p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); choose(a); setAdding(true); }} className={`flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-[14px] font-medium lg:px-3.5 lg:py-2 lg:text-[15px] ${on ? 'bg-[#dcf2e6] text-brand' : 'bg-[#eef1f4] text-navy'}`}><Pencil className="size-4" /> Edit</button>
            </div>
          );
        })}
      </div>

      {adding && (
        <div className="mt-3 grid gap-3 rounded-xl border border-line bg-white p-4 sm:grid-cols-2">
          <label className="text-[14px] font-semibold text-navy">Full Name<Input value={details.recipientName} onChange={(e) => update('recipientName', e.target.value)} className="mt-1 h-11" /></label>
          <label className="text-[14px] font-semibold text-navy">Phone<Input type="tel" value={details.phone} onChange={(e) => update('phone', e.target.value)} className="mt-1 h-11" /></label>
          <label className="text-[14px] font-semibold text-navy sm:col-span-2">Street / Ward / Landmark<Input value={details.addressLine} onChange={(e) => update('addressLine', e.target.value)} placeholder="Ward No. 6, Tulsipur" className="mt-1 h-11" /></label>
          <label className="text-[14px] font-semibold text-navy">City<Input value={details.city} onChange={(e) => update('city', e.target.value)} className="mt-1 h-11" /></label>
          <label className="text-[14px] font-semibold text-navy">Province<Input value={details.province} onChange={(e) => update('province', e.target.value)} className="mt-1 h-11" /></label>
          <label className="text-[14px] font-semibold text-navy sm:col-span-2">Delivery Instructions (optional)<Input value={details.instructions} onChange={(e) => update('instructions', e.target.value)} className="mt-1 h-11" /></label>
        </div>
      )}

      <h2 className="mt-5 text-[18.5px] font-bold text-navy lg:text-[23px]">2. Delivery Time</h2>
      <div className="mt-3 flex items-center gap-3 rounded-xl border border-brand/40 bg-[#effaf4] px-4 py-3.5 lg:gap-4 lg:px-5 lg:py-4">
        <Zap className="size-8 shrink-0 fill-brand text-brand" />
        <span className="flex-1"><b className="block text-[17px] font-bold text-brand lg:text-[20px]">Get it in 15–20 minutes</b><span className="text-[13px] text-slate lg:text-[14.5px]">Super fast delivery to your location</span></span>
        <span className="rounded-full bg-[#d8f1e4] px-4 py-1.5 text-[16px] font-bold text-brand lg:px-5 lg:py-2 lg:text-[18px]">FREE</span>
      </div>

      <h2 className="mt-5 text-[18.5px] font-bold text-navy lg:text-[23px]">3. Payment Method</h2>
      <div className="mt-3"><PaymentOptions value={checkout.paymentMethod} onChange={checkout.setPaymentMethod} /></div>

      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-[18.5px] font-bold text-navy lg:text-[23px]">Order Summary</h2>
        <Link to="/cart" className="text-[15px] font-medium text-brand lg:text-[16px]">View Cart ({cart.lines.length})</Link>
      </div>
      {cart.lines.length ? (
        <div className="mt-3">
          <OrderSummaryCard hideTitle count={cart.lines.length} subtotal={cart.subtotal} discount={checkout.discount} note={<FastNote title="You're saving NPR 20 on this order!" sub="Fast delivery. No extra charges." />} />
        </div>
      ) : <EmptyCartNotice />}

      <PrimaryButton onClick={next}>Continue to Review Order <ArrowRight className="size-5" /></PrimaryButton>
    </CheckoutPage>
  );
}
