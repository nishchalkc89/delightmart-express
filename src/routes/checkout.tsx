import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { ArrowRight, House, Pencil, Plus, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useCart } from '@/components/delight/cart-context';
import { useCheckout, type DeliveryDetails } from '@/components/delight/checkout-context';
import { CheckoutPage, EmptyCartNotice, FastNote, OrderSummaryCard, PaymentOptions, PrimaryButton, Radio } from '@/components/delight/checkout-ui';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/components/delight/auth-context';
import { supabase } from '@/services/supabase';

export const Route = createFileRoute('/checkout')({
  head: () => ({ meta: [{ title: 'Checkout — Delight Shopping Mart' }, { name: 'description', content: 'Choose delivery and payment details for your Delight order.' }, { property: 'og:title', content: 'Checkout — Delight' }, { property: 'og:description', content: 'Complete your Delight order.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: Page,
});

type Saved = DeliveryDetails & { id: string; label: string; isDefault: boolean };

function Page() {
  const cart = useCart();
  const checkout = useCheckout();
  const { user, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const { details } = checkout;
  const [saved, setSaved] = useState<Saved[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [adding, setAdding] = useState(false);
  const [saveNew, setSaveNew] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    void supabase.from('addresses').select('id,label,recipient_name,phone,address_line,city,province,is_default').eq('user_id', user.id).order('is_default', { ascending: false }).order('created_at', { ascending: false }).then(({ data }) => {
      const list = (data ?? []).map((a) => ({ id: a.id, label: a.label, isDefault: a.is_default, recipientName: a.recipient_name, phone: a.phone, addressLine: a.address_line, city: a.city, province: a.province, instructions: '' }));
      setSaved(list);
      if (list[0]) choose(list[0]);
      else {
        setAdding(true);
        checkout.setDetails({ ...details, recipientName: details.recipientName || String(user.user_metadata['full_name'] ?? ''), phone: details.phone || String(user.user_metadata['phone'] ?? '') });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  function choose(a: Saved) {
    setSelected(a.id);
    setAdding(false);
    checkout.setDetails({ recipientName: a.recipientName, phone: a.phone, addressLine: a.addressLine, city: a.city, province: a.province, instructions: details.instructions });
  }
  function update(key: keyof DeliveryDetails, value: string) {
    checkout.setDetails({ ...details, [key]: value });
  }
  async function next() {
    if (!user) { toast.error('Sign in to place your order'); void nav({ to: '/login' }); return; }
    if (!cart.lines.length) { toast.error('Add items to your cart first'); return; }
    if (details.recipientName.trim().length < 2 || details.phone.trim().length < 7 || details.addressLine.trim().length < 5) { toast.error('Enter your name, a valid phone number and your full address'); return; }
    if (adding && saveNew) {
      setBusy(true);
      const { error } = await supabase.from('addresses').insert({ user_id: user.id, label: saved.length ? 'Other' : 'Home', recipient_name: details.recipientName.trim(), phone: details.phone.trim(), address_line: details.addressLine.trim(), city: details.city.trim() || 'Tulsipur', province: details.province.trim() || 'Lumbini Province', is_default: saved.length === 0 });
      setBusy(false);
      if (error) toast.error(`Address not saved: ${error.message}`);
    }
    void nav({ to: '/review-order' });
  }

  if (authLoading) return <CheckoutPage step={2}><div className="mt-8 h-72 animate-pulse rounded-xl bg-[#f1f4f7]" /></CheckoutPage>;

  if (!user) {
    return (
      <CheckoutPage step={2}>
        <div className="mt-8 rounded-xl border border-line bg-white p-8 text-center">
          <h1 className="text-[24px] font-extrabold text-navy">Sign in to checkout</h1>
          <p className="mt-2 text-[15px] text-slate">Your cart is saved. Sign in or create an account to choose a delivery address and place your order.</p>
          <div className="mt-5 flex justify-center gap-3">
            <Link to="/login" className="inline-flex h-12 items-center rounded-lg bg-brand px-7 font-semibold text-white">Login</Link>
            <Link to="/signup" className="inline-flex h-12 items-center rounded-lg border border-line px-7 font-semibold text-navy">Create Account</Link>
          </div>
        </div>
      </CheckoutPage>
    );
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
        {saved.map((a) => {
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
              <button onClick={(e) => { e.stopPropagation(); choose(a); setAdding(true); setSaveNew(false); }} className={`flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-[14px] font-medium lg:px-3.5 lg:py-2 lg:text-[15px] ${on ? 'bg-[#dcf2e6] text-brand' : 'bg-[#eef1f4] text-navy'}`}><Pencil className="size-4" /> Edit</button>
            </div>
          );
        })}
      </div>

      {adding && (
        <div className="mt-3 grid gap-3 rounded-xl border border-line bg-white p-4 sm:grid-cols-2">
          {saved.length > 0 && <p className="text-[14px] font-semibold text-navy sm:col-span-2">New delivery address</p>}
          <label className="text-[14px] font-semibold text-navy">Full Name<Input value={details.recipientName} onChange={(e) => update('recipientName', e.target.value)} className="mt-1 h-11" /></label>
          <label className="text-[14px] font-semibold text-navy">Phone<Input type="tel" value={details.phone} onChange={(e) => update('phone', e.target.value)} className="mt-1 h-11" /></label>
          <label className="text-[14px] font-semibold text-navy sm:col-span-2">Street / Ward / Landmark<Input value={details.addressLine} onChange={(e) => update('addressLine', e.target.value)} placeholder="Ward No. 6, Tulsipur" className="mt-1 h-11" /></label>
          <label className="text-[14px] font-semibold text-navy">City<Input value={details.city} onChange={(e) => update('city', e.target.value)} className="mt-1 h-11" /></label>
          <label className="text-[14px] font-semibold text-navy">Province<Input value={details.province} onChange={(e) => update('province', e.target.value)} className="mt-1 h-11" /></label>
          <label className="text-[14px] font-semibold text-navy sm:col-span-2">Delivery Instructions (optional)<Input value={details.instructions} onChange={(e) => update('instructions', e.target.value)} className="mt-1 h-11" /></label>
          <label className="flex items-center gap-2 text-[14px] text-navy sm:col-span-2"><input type="checkbox" checked={saveNew} onChange={(e) => setSaveNew(e.target.checked)} className="size-4 accent-[#08704c]" /> Save this address for next time</label>
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

      <PrimaryButton onClick={() => void next()} disabled={busy}>Continue to Review Order <ArrowRight className="size-5" /></PrimaryButton>
    </CheckoutPage>
  );
}
