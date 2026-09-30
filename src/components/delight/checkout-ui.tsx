import { Link } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Briefcase, Check, ChevronRight, House, Loader2, MapPin, Plus, ShoppingBag, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { StorePage } from './store-shell';
import { useCart } from './cart-context';
import { useCheckout, type DeliveryDetails, type PaymentMethod } from './checkout-context';
import { useAuth } from './auth-context';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatNpr } from '@/services/catalog';
import { supabase } from '@/services/supabase';
import { asset } from '@/lib/assets';

/* ------------------------------------------------------------------ */
/* Payment methods                                                     */
/* ------------------------------------------------------------------ */

export const paymentOptions: { value: PaymentMethod; title: string; sub: string; icon: string; group: string; available: boolean }[] = [
  { value: 'COD', title: 'Cash on Delivery', sub: 'Pay with cash or QR when your order arrives', icon: 'pay-cod', group: 'Pay on Delivery', available: true },
  { value: 'ESEWA', title: 'eSewa', sub: 'Pay from your eSewa wallet', icon: 'pay-esewa', group: 'Wallets', available: false },
  { value: 'KHALTI', title: 'Khalti', sub: 'Pay from your Khalti wallet', icon: 'pay-khalti', group: 'Wallets', available: false },
  { value: 'CARD', title: 'Debit / Credit Card', sub: 'Visa, Mastercard and more', icon: 'pay-card', group: 'Cards', available: false },
];

export function paymentLabel(m: PaymentMethod) {
  return paymentOptions.find((o) => o.value === m)!;
}

/* ------------------------------------------------------------------ */
/* Bill                                                                */
/* ------------------------------------------------------------------ */

type StoreSettings = { deliveryFee: number; minOrder: number; minutes: number };

/** Delivery fee, minimum order and delivery time set in Admin → Settings (the order function charges the same fee). */
export function useStoreSettings(): StoreSettings {
  const { data } = useQuery({
    queryKey: ['store-settings'],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<StoreSettings> => {
      const { data: row } = await supabase.from('store_settings').select('delivery_fee,min_order,estimated_delivery_minutes').order('updated_at', { ascending: false }).limit(1).maybeSingle();
      return { deliveryFee: Number(row?.delivery_fee ?? 0), minOrder: Number(row?.min_order ?? 0), minutes: Number(row?.estimated_delivery_minutes ?? 20) };
    },
  });
  return data ?? { deliveryFee: 0, minOrder: 0, minutes: 20 };
}

export function useBill() {
  const cart = useCart();
  const checkout = useCheckout();
  const settings = useStoreSettings();
  const itemTotal = cart.subtotal;
  const mrpTotal = cart.lines.reduce((s, l) => s + (l.product.oldPrice ?? l.product.price) * l.quantity, 0);
  const coupon = Math.min(checkout.discount, itemTotal);
  const deliveryFee = cart.lines.length ? settings.deliveryFee : 0;
  return {
    count: cart.lines.reduce((s, l) => s + l.quantity, 0),
    itemTotal, mrpTotal, mrpSaving: mrpTotal - itemTotal, coupon, deliveryFee,
    toPay: Math.max(0, itemTotal - coupon) + deliveryFee,
    savings: mrpTotal - itemTotal + coupon,
    minOrder: settings.minOrder,
    belowMinimum: itemTotal < settings.minOrder,
    minutes: settings.minutes,
  };
}

/* ------------------------------------------------------------------ */
/* Layout                                                              */
/* ------------------------------------------------------------------ */

/** Cart and payment pages: grey page, white cards, summary on the right on desktop and a fixed action bar on phones. */
export function CheckoutShell({ title, children, aside, footer }: { title: string; children: ReactNode; aside?: ReactNode; footer?: ReactNode }) {
  return (
    <StorePage mobile={{ variant: 'back', actions: [], search: false }} hideMobileNav>
      <div className="min-h-[70vh] bg-[#f3f5f7]">
        <div className={`mx-auto max-w-[1120px] px-3 pt-3 lg:px-6 lg:pb-12 lg:pt-6 ${footer ? 'pb-44' : 'pb-10'}`}>
          <h1 className="mb-3 text-[22px] font-extrabold tracking-tight text-navy lg:mb-5 lg:text-[32px]">{title}</h1>
          <div className="lg:grid lg:grid-cols-[1fr_390px] lg:items-start lg:gap-6">
            <div className="space-y-3">{children}</div>
            {(aside || footer) && (
              <aside className="mt-3 space-y-3 lg:sticky lg:top-[130px] lg:mt-0">
                {aside}
                {footer && <div className="hidden rounded-2xl border border-line bg-white p-4 lg:block">{footer}</div>}
              </aside>
            )}
          </div>
        </div>
      </div>
      {footer && <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-6px_18px_rgb(16_24_40/0.08)] lg:hidden">{footer}</div>}
    </StorePage>
  );
}

export function Box({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-line bg-white ${className}`}>{children}</section>;
}

export function Radio({ checked }: { checked: boolean }) {
  return (
    <span className={`grid size-5 shrink-0 place-items-center rounded-full border-2 ${checked ? 'border-brand' : 'border-[#9aa3ad]'}`}>
      {checked && <span className="size-2.5 rounded-full bg-brand" />}
    </span>
  );
}

export function ActionButton({ children, onClick, disabled, tone = 'red' }: { children: ReactNode; onClick?: () => void; disabled?: boolean | undefined; tone?: 'red' | 'green' }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`flex h-[52px] w-full items-center justify-center gap-2 rounded-xl text-[16.5px] font-bold text-white shadow-md transition-colors disabled:opacity-50 ${tone === 'red' ? 'bg-red shadow-red/25 hover:bg-red/90' : 'bg-brand shadow-brand/25 hover:bg-brand-dark'}`}>
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Bill summary & savings                                              */
/* ------------------------------------------------------------------ */

export function SavedBanner() {
  const bill = useBill();
  if (bill.savings <= 0) return null;
  return <p className="rounded-xl bg-[#e3f5ec] px-4 py-2 text-center text-[14px] font-medium text-brand">Yay! You saved <b className="font-extrabold">{formatNpr(bill.savings)}</b> on this order</p>;
}

export function BillSummary() {
  const bill = useBill();
  return (
    <Box className="p-4">
      <h2 className="flex items-center gap-2 text-[17px] font-bold text-navy"><ShoppingBag className="size-5 text-brand" /> Bill Summary</h2>
      <div className="mt-3 space-y-2.5 text-[14px]">
        <Row label={`Item Total (${bill.count} item${bill.count === 1 ? '' : 's'})`}>
          {bill.mrpSaving > 0 && <del className="mr-1.5 text-slate">{formatNpr(bill.mrpTotal)}</del>}{formatNpr(bill.itemTotal)}
        </Row>
        {bill.coupon > 0 && <Row label="Coupon Discount"><span className="font-semibold text-brand">− {formatNpr(bill.coupon)}</span></Row>}
        <Row label="Delivery Fee">{bill.deliveryFee > 0 ? formatNpr(bill.deliveryFee) : <span className="font-bold text-brand">FREE</span>}</Row>
        <Row label="Handling Fee"><span className="font-bold text-brand">FREE</span></Row>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-dashed border-line pt-3">
        <b className="text-[16px] font-bold text-navy">To Pay</b>
        <b className="text-[18px] font-extrabold text-navy">{bill.mrpSaving + bill.coupon > 0 && <del className="mr-1.5 text-[13px] font-medium text-slate">{formatNpr(bill.mrpTotal + bill.deliveryFee)}</del>}{formatNpr(bill.toPay)}</b>
      </div>
    </Box>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return <p className="flex items-center justify-between text-slate"><span>{label}</span><span className="text-navy">{children}</span></p>;
}

export function SavingsCard() {
  const bill = useBill();
  if (bill.savings <= 0) return null;
  return (
    <section className="rounded-2xl border border-[#cdebd9] bg-[#effaf4] p-4">
      <div className="flex items-center justify-between"><h2 className="text-[16px] font-bold text-navy">Savings on this order</h2><span className="rounded-md bg-brand px-2 py-0.5 text-[14px] font-extrabold text-white">{formatNpr(bill.savings)}</span></div>
      <div className="mt-3 space-y-2 rounded-xl bg-white p-3 text-[13.5px]">
        {bill.mrpSaving > 0 && <p className="flex justify-between"><span className="text-navy">Discount on MRP</span><b className="text-navy">{formatNpr(bill.mrpSaving)}</b></p>}
        {bill.coupon > 0 && <p className="flex justify-between border-t border-dashed border-line pt-2"><span className="text-navy">Coupon savings</span><b className="text-navy">{formatNpr(bill.coupon)}</b></p>}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Addresses                                                           */
/* ------------------------------------------------------------------ */

type SavedAddress = DeliveryDetails & { id: string; label: string; isDefault: boolean };

export function useAddresses() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['addresses', user?.id],
    enabled: Boolean(user),
    queryFn: async (): Promise<SavedAddress[]> => {
      const { data, error } = await supabase.from('addresses').select('id,label,recipient_name,phone,address_line,city,province,is_default').eq('user_id', user!.id).order('is_default', { ascending: false }).order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((a) => ({ id: a.id, label: a.label, isDefault: a.is_default, recipientName: a.recipient_name, phone: a.phone, addressLine: a.address_line, city: a.city, province: a.province, instructions: '' }));
    },
  });
}

const labelIcon = (label: string | undefined) => (label === 'Work' ? Briefcase : label === 'Home' ? House : MapPin);

/** The chosen delivery address with a Change link (shown above the pay button). */
export function AddressBar({ onChange }: { onChange: () => void }) {
  const { details } = useCheckout();
  const Icon = labelIcon(details.label);
  return (
    <div className="mb-2.5 flex items-center gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#eef8f3]"><Icon className="size-[18px] text-brand" /></span>
      <span className="min-w-0 flex-1">
        <b className="block text-[14px] font-bold text-navy">Delivering to {details.label ?? 'your address'}</b>
        <span className="block truncate text-[12.5px] text-slate">{[details.addressLine, details.city].filter(Boolean).join(', ')}</span>
      </span>
      <button type="button" onClick={onChange} className="shrink-0 text-[14px] font-bold text-red">Change</button>
    </div>
  );
}

const emptyForm = { label: 'Home', recipientName: '', phone: '', addressLine: '', landmark: '', city: 'Tulsipur', province: 'Lumbini Province' };

/** Pick a saved address or add a new one (bottom sheet on phones, side panel on desktop). */
export function AddressSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const checkout = useCheckout();
  const queryClient = useQueryClient();
  const { data: saved = [], isLoading } = useAddresses();
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const showForm = adding || (!isLoading && saved.length === 0);

  function choose(a: SavedAddress) {
    checkout.setDetails({ ...checkout.details, recipientName: a.recipientName, phone: a.phone, addressLine: a.addressLine, city: a.city, province: a.province, label: a.label, addressId: a.id });
    onOpenChange(false);
  }

  async function save() {
    if (!user) return;
    if (form.recipientName.trim().length < 2) { toast.error('Enter the receiver’s name'); return; }
    if (!/^9\d{9}$/.test(form.phone.replace(/\D/g, '').slice(-10))) { toast.error('Enter a 10-digit mobile number (98XXXXXXXX)'); return; }
    if (form.addressLine.trim().length < 5) { toast.error('Enter your house / street / ward'); return; }
    setBusy(true);
    const addressLine = [form.addressLine.trim(), form.landmark.trim() && `Near ${form.landmark.trim()}`].filter(Boolean).join(', ');
    const { data, error } = await supabase.from('addresses').insert({
      user_id: user.id, label: form.label, recipient_name: form.recipientName.trim(), phone: form.phone.replace(/\D/g, '').slice(-10),
      address_line: addressLine, city: form.city.trim() || 'Tulsipur', province: form.province.trim() || 'Lumbini Province', is_default: saved.length === 0,
    }).select('id').single();
    setBusy(false);
    if (error || !data) { toast.error(`Address not saved: ${error?.message ?? 'try again'}`); return; }
    await queryClient.invalidateQueries({ queryKey: ['addresses', user.id] });
    choose({ id: data.id, label: form.label, isDefault: saved.length === 0, recipientName: form.recipientName.trim(), phone: form.phone.replace(/\D/g, '').slice(-10), addressLine, city: form.city.trim() || 'Tulsipur', province: form.province.trim() || 'Lumbini Province', instructions: '' });
    setForm(emptyForm);
    setAdding(false);
    toast.success('Address saved');
  }

  const field = 'mt-1 h-11 w-full rounded-lg border border-line bg-white px-3 text-[15px] text-navy outline-none focus:border-brand';
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={isMobile ? 'bottom' : 'right'} className={`overflow-y-auto p-0 ${isMobile ? 'max-h-[88vh] rounded-t-2xl' : 'w-[440px] sm:max-w-[440px]'}`}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-white px-4 py-3.5">
          <SheetTitle className="text-[18px] font-bold text-navy">{showForm ? 'Add delivery address' : 'Select delivery address'}</SheetTitle>
          <button type="button" aria-label="Close" onClick={() => onOpenChange(false)} className="grid size-8 place-items-center rounded-full bg-[#f1f4f7]"><X className="size-4" /></button>
        </div>

        {!showForm && (
          <div className="p-4">
            <button type="button" onClick={() => setAdding(true)} className="flex w-full items-center gap-3 rounded-xl border border-dashed border-brand/50 bg-[#f4fbf7] px-4 py-3 text-[15px] font-bold text-brand"><Plus className="size-5" /> Add a new address</button>
            <p className="mb-2 mt-4 text-[13px] font-semibold uppercase tracking-wide text-slate">Saved addresses</p>
            <div className="space-y-2">
              {saved.map((a) => {
                const Icon = labelIcon(a.label);
                const on = checkout.details.addressId === a.id;
                return (
                  <button key={a.id} type="button" onClick={() => choose(a)} className={`flex w-full items-start gap-3 rounded-xl border px-3.5 py-3 text-left ${on ? 'border-brand bg-[#effaf4]' : 'border-line bg-white hover:border-brand/40'}`}>
                    <Icon className="mt-0.5 size-5 shrink-0 text-navy" />
                    <span className="min-w-0 flex-1">
                      <b className="block text-[15px] font-bold text-navy">{a.label}{a.isDefault && <span className="ml-2 rounded-full bg-[#d8f1e4] px-2 py-0.5 text-[11px] font-semibold text-brand">Default</span>}</b>
                      <span className="block text-[13px] leading-5 text-slate">{a.recipientName} · {a.phone}<br />{a.addressLine}, {a.city}</span>
                    </span>
                    {on && <Check className="size-5 shrink-0 text-brand" />}
                  </button>
                );
              })}
              {isLoading && <div className="h-20 animate-pulse rounded-xl bg-[#f1f4f7]" />}
            </div>
          </div>
        )}

        {showForm && (
          <div className="space-y-3 p-4">
            <div>
              <p className="text-[13px] font-semibold text-navy">Save address as</p>
              <div className="mt-1.5 flex gap-2">
                {['Home', 'Work', 'Other'].map((l) => {
                  const Icon = labelIcon(l);
                  return <button key={l} type="button" onClick={() => setForm({ ...form, label: l })} className={`flex h-9 items-center gap-1.5 rounded-full border px-4 text-[13.5px] font-semibold ${form.label === l ? 'border-brand bg-[#effaf4] text-brand' : 'border-line text-navy'}`}><Icon className="size-4" />{l}</button>;
                })}
              </div>
            </div>
            <label className="block text-[13px] font-semibold text-navy">House / Flat / Street / Ward *<input className={field} value={form.addressLine} onChange={(e) => setForm({ ...form, addressLine: e.target.value })} placeholder="e.g. Ward 6, Bijaypur Road" /></label>
            <label className="block text-[13px] font-semibold text-navy">Nearby landmark<input className={field} value={form.landmark} onChange={(e) => setForm({ ...form, landmark: e.target.value })} placeholder="e.g. Opposite Tulsipur Hospital" /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-[13px] font-semibold text-navy">City<input className={field} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></label>
              <label className="block text-[13px] font-semibold text-navy">Province<input className={field} value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} /></label>
            </div>
            <p className="pt-1 text-[13px] font-semibold uppercase tracking-wide text-slate">Receiver details</p>
            <label className="block text-[13px] font-semibold text-navy">Receiver’s name *<input className={field} value={form.recipientName} onChange={(e) => setForm({ ...form, recipientName: e.target.value })} placeholder="Full name" /></label>
            <label className="block text-[13px] font-semibold text-navy">Mobile number *<input className={field} type="tel" inputMode="numeric" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="98XXXXXXXX" /></label>
            <div className="flex gap-2 pt-1">
              {saved.length > 0 && <button type="button" onClick={() => setAdding(false)} className="h-[48px] rounded-xl border border-line px-5 text-[15px] font-semibold text-navy">Back</button>}
              <ActionButton onClick={() => void save()} disabled={busy}>{busy ? <Loader2 className="size-5 animate-spin" /> : 'Save & Continue'}</ActionButton>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/* Empty cart                                                          */
/* ------------------------------------------------------------------ */

export function EmptyCart() {
  return (
    <Box className="px-6 py-12 text-center">
      <img src="/art/shopping_cart.svg" alt="" className="mx-auto size-20" />
      <h2 className="mt-4 text-[20px] font-bold text-navy">Your cart is empty</h2>
      <p className="mt-1 text-[14px] text-slate">Fresh groceries and daily essentials are waiting for you.</p>
      <Link to="/" className="mt-5 inline-flex h-12 items-center gap-2 rounded-xl bg-red px-7 font-bold text-white">Start Shopping <ChevronRight className="size-4" /></Link>
    </Box>
  );
}

export function PaymentIcon({ icon }: { icon: string }) {
  return <img src={asset(icon)} alt="" className="size-10 shrink-0 object-contain" />;
}
