import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { ChevronRight, Clock, Loader2, Percent, Trash2, Zap } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useCart } from '@/components/delight/cart-context';
import { useCheckout } from '@/components/delight/checkout-context';
import { useAuth } from '@/components/delight/auth-context';
import { AddButton } from '@/components/delight/product-card';
import { ActionButton, AddressBar, AddressSheet, BillSummary, Box, CheckoutShell, EmptyCart, SavedBanner, SavingsCard, useAddresses, useBill } from '@/components/delight/checkout-ui';
import { fetchProductsByIds, formatNpr } from '@/services/catalog';
import { useBranch } from '@/components/delight/branch-context';
import { ART_BACKGROUND } from '@/lib/product-art';
import { ProductThumb } from '@/components/delight/product-tile';

export const Route = createFileRoute('/cart')({
  head: () => ({ meta: [{ title: 'Cart — Delight Shopping Mart' }, { name: 'description', content: 'Review your Delight Shopping Mart cart.' }, { property: 'og:title', content: 'Your Cart — Delight' }, { property: 'og:description', content: 'Review your items before checkout.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: Page,
});

const instructionChips = ['Avoid ringing the bell', 'Leave at the door', 'Call before arriving', 'Leave with the guard'];

function Page() {
  const cart = useCart();
  const checkout = useCheckout();
  const bill = useBill();
  const { choose, branch } = useBranch();
  const { user, loading } = useAuth();
  const { data: addresses } = useAddresses();
  const nav = useNavigate();
  const [sheet, setSheet] = useState(false);
  const [applying, setApplying] = useState(false);
  const d = checkout.details;
  const hasAddress = Boolean(d.addressId && addresses?.some((a) => a.id === d.addressId));

  // Pick the default saved address automatically, like quick-commerce apps do.
  useEffect(() => {
    if (!addresses?.length || hasAddress) return;
    const a = addresses[0]!;
    checkout.setDetails({ ...d, recipientName: a.recipientName, phone: a.phone, addressLine: a.addressLine, city: a.city, province: a.province, label: a.label, addressId: a.id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addresses]);

  // Saved carts can be days old, and stock differs per store: bring prices and stock up to date
  // for the chosen store and drop items that are gone (again whenever the store changes).
  const checked = useRef('');
  useEffect(() => {
    if (checked.current === branch.id || !cart.lines.length) return;
    checked.current = branch.id;
    void fetchProductsByIds(cart.lines.map((l) => l.product.id), branch.id).then((current) => {
      const r = cart.refresh(current);
      if (r.removed.length) toast.warning(`Removed (no longer available): ${r.removed.join(', ')}`);
      if (r.reduced.length) toast.info(`Only limited stock left for: ${r.reduced.join(', ')}`);
      if (r.priceChanged.length) toast.info(`Prices updated for: ${r.priceChanged.join(', ')}`);
    }).catch(() => { checked.current = ''; });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.lines.length, branch.id]);

  async function applyCoupon() {
    setApplying(true);
    const result = await checkout.applyCoupon(cart.subtotal);
    setApplying(false);
    toast[result.ok ? 'success' : 'error'](result.message);
  }
  function toggleChip(chip: string) {
    const parts = d.instructions.split('. ').map((x) => x.trim()).filter(Boolean);
    const next = parts.includes(chip) ? parts.filter((x) => x !== chip) : [...parts, chip];
    checkout.setDetails({ ...d, instructions: next.join('. ') });
  }

  if (!cart.lines.length) return <CheckoutShell title="Cart"><EmptyCart /></CheckoutShell>;

  const footer = loading ? <ActionButton disabled><Loader2 className="size-5 animate-spin" /></ActionButton>
    : !user ? <ActionButton onClick={() => void nav({ to: '/login', search: { redirect: '/cart' } })}>Login to proceed</ActionButton>
    : !hasAddress ? <ActionButton onClick={() => setSheet(true)}>Add Address to proceed</ActionButton>
    : (
      <>
        <AddressBar onChange={() => setSheet(true)} />
        <ActionButton disabled={bill.belowMinimum || !bill.acceptingOrders} onClick={() => void nav({ to: '/payment' })}>
          <span className="flex flex-1 flex-col items-start pl-2 text-left leading-tight"><span className="text-[17px] font-extrabold">{formatNpr(bill.toPay)}</span><span className="text-[11.5px] font-medium opacity-90">TOTAL</span></span>
          <span className="flex items-center gap-1 pr-2">Proceed to Pay <ChevronRight className="size-5" /></span>
        </ActionButton>
      </>
    );

  return (
    <CheckoutShell title="Cart" footer={footer} aside={<><BillSummary /><SavingsCard /></>}>
      <SavedBanner />

      <Box>
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <span className="grid size-10 place-items-center rounded-full bg-[#eef8f3]"><Zap className="size-5 fill-brand text-brand" /></span>
          <span><b className="block text-[16px] font-extrabold text-navy">Delivery in {bill.minutes} minutes</b><span className="text-[13px] text-slate">From {bill.storeCity} store · {bill.count} item{bill.count === 1 ? '' : 's'} · <button type="button" onClick={choose} className="font-semibold text-brand">Change store</button></span></span>
          <button type="button" onClick={cart.clear} className="ml-auto flex items-center gap-1 text-[13px] font-semibold text-slate hover:text-red"><Trash2 className="size-4" /> Clear</button>
        </div>
        <div className="divide-y divide-line px-4">
          {cart.lines.map(({ product: p, quantity }) => (
            <div key={p.id} className="flex items-center gap-3 py-3">
              <Link to="/products/$slug" params={{ slug: p.slug }} className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-lg border border-line" style={{ background: p.art ? ART_BACKGROUND[p.categorySlug ?? ''] : '#fff' }}>
                {p.noPhoto ? <ProductThumb product={p} className="size-full" /> : <img src={p.image} alt={p.name} className={p.art ? 'size-8' : 'size-full object-contain p-1'} />}
              </Link>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-[14px] font-medium leading-snug text-navy">{p.name}</p>
                <span className="text-[12.5px] text-slate">{p.unit}</span>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <AddButton product={p} size="sm" />
                <span className="text-[13px]">{p.oldPrice && <del className="mr-1 text-slate">{formatNpr(p.oldPrice * quantity)}</del>}<b className="text-navy">{formatNpr(p.price * quantity)}</b></span>
              </div>
            </div>
          ))}
        </div>
        <p className="border-t border-line px-4 py-3 text-center text-[13.5px] text-navy">Missed something? <Link to="/" className="font-bold text-red">Add more items</Link></p>
      </Box>

      {bill.belowMinimum && <p className="rounded-xl bg-[#fff4e5] px-4 py-2.5 text-[13.5px] text-[#9a5b00]">Minimum order is {formatNpr(bill.minOrder)}. Add {formatNpr(bill.minOrder - bill.itemTotal)} more to place your order.</p>}

      <Box className="p-4">
        <h2 className="flex items-center gap-2 text-[16px] font-bold text-navy"><Percent className="size-5 rounded-full bg-brand p-1 text-white" strokeWidth={3} /> Coupons &amp; Offers</h2>
        <div className="mt-3 flex gap-2">
          <input value={checkout.coupon} onChange={(e) => checkout.setCoupon(e.target.value)} placeholder="Enter coupon code" aria-label="Coupon code" className="h-11 min-w-0 flex-1 rounded-lg border border-line px-3 text-[15px] uppercase outline-none placeholder:normal-case focus:border-brand" />
          <button type="button" onClick={() => void applyCoupon()} disabled={applying || !checkout.coupon.trim()} className="h-11 rounded-lg border border-red px-5 text-[14px] font-bold text-red disabled:opacity-50">{applying ? 'Checking…' : 'Apply'}</button>
        </div>
        {checkout.discount > 0 && <p className="mt-2 text-[13px] font-semibold text-brand">Coupon {checkout.coupon.toUpperCase()} applied — you save {formatNpr(checkout.discount)}</p>}
      </Box>

      <Box className="p-4">
        <h2 className="text-[16px] font-bold text-navy">Delivery Instructions</h2>
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {instructionChips.map((chip) => {
            const on = d.instructions.includes(chip);
            return <button key={chip} type="button" onClick={() => toggleChip(chip)} className={`shrink-0 rounded-xl border px-3 py-2 text-[13px] font-medium ${on ? 'border-brand bg-[#effaf4] text-brand' : 'border-line text-navy'}`}>{chip}</button>;
          })}
        </div>
        <textarea value={d.instructions} onChange={(e) => checkout.setDetails({ ...d, instructions: e.target.value })} rows={2} placeholder="Anything else the rider should know?" className="mt-3 w-full resize-none rounded-lg border border-line px-3 py-2 text-[14px] outline-none focus:border-brand" />
      </Box>

      <Box className="p-4">
        <h2 className="flex items-center gap-2 text-[15px] font-bold text-navy"><Clock className="size-4" /> Cancellation Policy</h2>
        <p className="mt-1 text-[13px] leading-5 text-slate">You can cancel your order before it is packed. Once it is out for delivery it can’t be cancelled, but you can refuse it at the door.</p>
      </Box>

      <AddressSheet open={sheet} onOpenChange={setSheet} />
    </CheckoutShell>
  );
}
