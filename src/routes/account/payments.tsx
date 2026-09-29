import { createFileRoute } from '@tanstack/react-router';
import { Check, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useCheckout } from '@/components/delight/checkout-context';
import { paymentOptions } from '@/components/delight/checkout-ui';
import { AccountCard, AccountTitle } from '@/components/delight/account-ui';
import { asset } from '@/lib/assets';

export const Route = createFileRoute('/account/payments')({
  head: () => ({ meta: [{ title: 'Payment Methods — Delight' }, { name: 'description', content: 'Choose how you like to pay for Delight orders.' }] }),
  component: Page,
});

function Page() {
  const checkout = useCheckout();
  return (
    <div>
      <AccountTitle title="Payment Methods" sub="Choose your preferred way to pay. It is selected for you at checkout." />
      {[...new Set(paymentOptions.map((o) => o.group))].map((group) => (
        <AccountCard key={group} title={group}>
          <div className="divide-y divide-line">
            {paymentOptions.filter((o) => o.group === group).map((o) => {
              const preferred = checkout.paymentMethod === o.value;
              return (
                <div key={o.value} className="flex items-center gap-3 py-3">
                  <img src={asset(o.icon)} alt="" className="size-10 shrink-0 object-contain" />
                  <span className={`min-w-0 flex-1 ${o.available ? '' : 'opacity-55'}`}>
                    <b className="block text-[15px] font-semibold text-navy">{o.title}</b>
                    <span className="text-[13px] text-slate">{o.sub}</span>
                  </span>
                  {!o.available ? <span className="rounded-full bg-[#f1f4f7] px-3 py-1 text-[12px] font-semibold text-slate">Coming soon</span>
                    : preferred ? <span className="flex items-center gap-1 rounded-full bg-[#dcf2e6] px-3 py-1 text-[12.5px] font-semibold text-brand"><Check className="size-4" /> Preferred</span>
                    : <button onClick={() => { checkout.setPaymentMethod(o.value); toast.success(`${o.title} is now your preferred payment method`); }} className="rounded-lg border border-brand px-3 py-1.5 text-[13px] font-semibold text-brand">Set as preferred</button>}
                </div>
              );
            })}
          </div>
        </AccountCard>
      ))}
      <p className="mt-4 flex items-start gap-2 rounded-xl bg-[#eef8f3] px-4 py-3 text-[13.5px] text-navy">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-brand" />
        Delight never stores your card or wallet PIN. Online payments (eSewa, Khalti and cards) will open the provider’s own secure page when they go live.
      </p>
    </div>
  );
}
