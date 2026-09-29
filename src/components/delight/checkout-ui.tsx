import { Link } from '@tanstack/react-router';
import { ChevronDown, Info, Zap } from 'lucide-react';
import type { ReactNode } from 'react';
import { StorePage } from './store-shell';
import { CheckoutSteps } from './checkout-steps';
import type { PaymentMethod } from './checkout-context';
import { formatNpr } from '@/services/catalog';
import { asset } from '@/lib/assets';

export const paymentOptions: { value: PaymentMethod; title: string; sub: string; icon: string; mark: string; markClass: string }[] = [
  { value: 'ESEWA', title: 'eSewa', sub: 'Pay easily with eSewa', icon: 'pay-esewa', mark: 'pay-esewa-word', markClass: 'h-7 lg:h-11' },
  { value: 'KHALTI', title: 'Khalti', sub: 'Pay with Khalti', icon: 'pay-khalti', mark: 'pay-khalti-word', markClass: 'h-8 lg:h-11' },
  { value: 'CARD', title: 'Debit / Credit Card', sub: 'Visa, Mastercard, etc.', icon: 'pay-card', mark: 'pay-visa-mc', markClass: 'h-6 lg:h-10' },
  { value: 'COD', title: 'Cash on Delivery', sub: 'Pay when you receive', icon: 'pay-cod', mark: 'pay-cod-hand', markClass: 'h-9 lg:h-12' },
];

export function paymentLabel(m: PaymentMethod) {
  return paymentOptions.find((o) => o.value === m)!;
}

/** Page wrapper used by every checkout step: mobile back header without search, steps, centred column. */
export function CheckoutPage({ step, children }: { step: 1 | 2 | 3 | 4; children: ReactNode }) {
  return (
    <StorePage mobile={{ variant: 'back', actions: [], search: false }} hideMobileNav>
      <div className="mx-auto max-w-[860px] px-4 pb-10 pt-2 lg:pt-8">
        <CheckoutSteps current={step} />
        {children}
      </div>
    </StorePage>
  );
}

export function Radio({ checked }: { checked: boolean }) {
  return (
    <span className={`grid size-6 shrink-0 place-items-center rounded-full border-2 ${checked ? 'border-brand' : 'border-[#9aa3ad]'}`}>
      {checked && <span className="size-3 rounded-full bg-brand" />}
    </span>
  );
}

export function PaymentOptions({ value, onChange }: { value: PaymentMethod; onChange: (v: PaymentMethod) => void }) {
  return (
    <div className="space-y-2.5">
      {paymentOptions.map((o) => {
        const on = value === o.value;
        return (
          <button key={o.value} type="button" onClick={() => onChange(o.value)} className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 lg:gap-4 lg:px-4 text-left transition-colors lg:py-4 ${on ? 'border-brand/40 bg-[#effaf4]' : 'border-line bg-white hover:bg-[#fafcfb]'}`}>
            <Radio checked={on} />
            <img src={asset(o.icon)} alt="" className="size-9 shrink-0 object-contain lg:size-12" />
            <span className="min-w-0 flex-1">
              <b className="block text-[15px] font-semibold leading-tight text-navy lg:text-[18px]">{o.title}</b>
              <span className="text-[13px] text-slate lg:text-[15px]">{o.sub}</span>
            </span>
            <img src={asset(o.mark)} alt="" className={`${o.markClass} w-auto max-w-[30%] shrink-0 object-contain mix-blend-multiply`} />
          </button>
        );
      })}
    </div>
  );
}

export function SummaryRows({ count, subtotal, discount = 0 }: { count: number; subtotal: number; discount?: number | undefined }) {
  return (
    <div className="space-y-2.5 text-[14px] lg:text-[16px]">
      <p className="flex justify-between text-slate"><span>Items Total ({count} items)</span><span className="text-navy">{formatNpr(subtotal)}</span></p>
      <p className="flex justify-between text-slate"><span className="flex items-center gap-1.5">Delivery Charge <Info className="size-4" /></span><b className="font-semibold text-brand">FREE</b></p>
      <p className="flex justify-between text-slate"><span className="flex items-center gap-1.5">Platform Fee <Info className="size-4" /></span><span className="flex gap-6"><del className="text-slate">NPR 20</del><b className="font-semibold text-brand">FREE</b></span></p>
      {discount > 0 && <p className="flex justify-between text-slate"><span>Discount</span><b className="font-semibold text-brand">− {formatNpr(discount)}</b></p>}
      <div className="!mt-4 border-t border-line pt-4">
        <p className="flex items-center justify-between"><b className="text-[17px] font-bold text-navy lg:text-[19px]">Total Amount</b><b className="text-[22px] font-extrabold text-red lg:text-[26px]">{formatNpr(Math.max(0, subtotal - discount))}</b></p>
      </div>
    </div>
  );
}

export function FastNote({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mt-4 flex items-center gap-3 rounded-lg bg-[#eef8f3] px-4 py-3">
      <Zap className="size-7 shrink-0 fill-brand text-brand" />
      <span><b className="block text-[14.5px] font-bold text-brand">{title}</b><span className="text-[12.5px] text-ink">{sub}</span></span>
    </div>
  );
}

export function OrderSummaryCard({ count, subtotal, discount, link, note, hideTitle = false }: { count: number; subtotal: number; discount?: number | undefined; link?: ReactNode; note?: ReactNode; hideTitle?: boolean }) {
  return (
    <section className="rounded-xl border border-line bg-white px-4 py-4 lg:px-5">
      {!hideTitle && (
        <div className="mb-3 flex items-center justify-between border-b border-line pb-3">
          <h2 className="text-[18px] font-bold text-navy lg:text-[21px]">Order Summary</h2>
          {link}
        </div>
      )}
      <SummaryRows count={count} subtotal={subtotal} discount={discount} />
      {note}
    </section>
  );
}

export function ViewDetails() {
  return <span className="flex items-center gap-1 text-[15px] font-medium text-brand">View Details <ChevronDown className="size-4" /></span>;
}

export function EmptyCartNotice() {
  return (
    <div className="mt-6 rounded-xl border border-line bg-white p-6 text-center">
      <h2 className="text-[18px] font-bold text-navy">Your cart is empty</h2>
      <p className="mt-1 text-[14px] text-slate">Add a few products to continue checkout.</p>
      <Link to="/products" className="mt-4 inline-flex h-11 items-center rounded-lg bg-brand px-6 font-semibold text-white">Browse products</Link>
    </div>
  );
}

export function PrimaryButton({ children, onClick, disabled, type = 'button' }: { children: ReactNode; onClick?: () => void; disabled?: boolean; type?: 'button' | 'submit' }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} className="mt-5 flex h-[52px] w-full items-center justify-center gap-3 rounded-xl bg-brand text-[17px] font-semibold text-white shadow-md shadow-brand/20 hover:bg-brand-dark disabled:opacity-60 lg:h-[58px] lg:text-[19px]">
      {children}
    </button>
  );
}
