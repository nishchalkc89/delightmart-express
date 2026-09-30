import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, Clock, Mail, MapPin, MessageCircle, Package, Phone } from 'lucide-react';
import { AccountCard, AccountTitle } from '@/components/delight/account-ui';
import { supabase } from '@/services/supabase';

export const Route = createFileRoute('/account/help')({
  head: () => ({ meta: [{ title: 'Help & Support — Delight' }, { name: 'description', content: 'Contact Delight Shopping Mart and find answers to common questions.' }] }),
  component: Page,
});

const faqs = [
  ['How long does delivery take?', 'Most orders inside Tulsipur arrive in 15–20 minutes. At busy times it can take a little longer; you can follow your order in My Orders.'],
  ['Is there a delivery charge?', 'Delivery is free right now. If a delivery fee applies, it is always shown in the Bill Summary in your cart before you pay.'],
  ['How do I pay?', 'Pay with cash (or the store’s QR) when your order arrives. eSewa, Khalti and cards are coming soon.'],
  ['Can I cancel my order?', 'Yes, before it is packed. Call us or message us on WhatsApp with your order number. Once it is out for delivery you can refuse it at the door.'],
  ['What if an item is missing or damaged?', 'Tell us within 24 hours with your order number and a photo. We will replace the item or refund you.'],
  ['How do I use a coupon code?', 'Open your cart, type the code in “Coupons & Offers” and tap Apply. You can see all active codes in My Account → Offers & Coupons.'],
  ['Do you deliver outside Tulsipur?', 'We currently deliver within Tulsipur and nearby areas. Add your address at checkout; if we cannot reach it we will call you.'],
] as const;

function Page() {
  const { data: store } = useQuery({
    queryKey: ['store-contact'],
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const { data } = await supabase.from('store_settings').select('phone,email,address,opening_time,closing_time').order('updated_at', { ascending: false }).limit(1).maybeSingle();
      return data;
    },
  });
  const phone = store?.phone || '+977 9841234567';
  const digits = phone.replace(/\D/g, '');
  const email = store?.email || 'info@delightshoppingmart.com';
  const hours = store?.opening_time && store?.closing_time ? `${store.opening_time.slice(0, 5)} – ${store.closing_time.slice(0, 5)}` : '7:00 AM – 9:00 PM';

  const contacts = [
    [Phone, 'Call us', phone, `tel:+${digits}`],
    [MessageCircle, 'WhatsApp', 'Chat with the store', `https://wa.me/${digits}`],
    [Mail, 'Email', email, `mailto:${email}`],
  ] as const;

  return (
    <div>
      <AccountTitle title="Help & Support" sub="We’re here to help, every day." />
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {contacts.map(([Icon, title, sub, href]) => (
          <a key={title} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className="flex items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3.5 hover:border-brand/50">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#eef8f3]"><Icon className="size-5 text-brand" /></span>
            <span className="min-w-0"><b className="block text-[15px] font-bold text-navy">{title}</b><span className="block truncate text-[13px] text-slate">{sub}</span></span>
          </a>
        ))}
      </div>

      <Link to="/account/orders" className="mt-3 flex items-center gap-3 rounded-2xl border border-[#fbd9de] bg-[#fdeef0] px-4 py-3.5">
        <Package className="size-6 text-red" />
        <span className="flex-1"><b className="block text-[15px] font-bold text-navy">Problem with an order?</b><span className="text-[13px] text-slate">Open the order and contact us with its number</span></span>
      </Link>

      <AccountCard title="Frequently Asked Questions">
        <div className="divide-y divide-line">
          {faqs.map(([q, a]) => (
            <details key={q} className="group py-3 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[15px] font-semibold text-navy">{q}<ChevronDown className="size-5 shrink-0 text-slate transition-transform group-open:rotate-180" /></summary>
              <p className="mt-2 text-[14px] leading-6 text-slate">{a}</p>
            </details>
          ))}
        </div>
      </AccountCard>

      <AccountCard title="Visit the store">
        <p className="flex items-start gap-2 text-[14px] text-navy"><MapPin className="mt-0.5 size-4 shrink-0 text-brand" /> {store?.address || 'Ward No. 6, Tulsipur, Dang, Lumbini Province, Nepal'}</p>
        <p className="mt-2 flex items-center gap-2 text-[14px] text-navy"><Clock className="size-4 shrink-0 text-brand" /> Open daily, {hours}</p>
      </AccountCard>
    </div>
  );
}
