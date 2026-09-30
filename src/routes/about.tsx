import { createFileRoute, Link } from '@tanstack/react-router';
import { Heart, Leaf, MapPin, Truck } from 'lucide-react';
import { InfoPage } from '@/components/delight/info-page';

export const Route = createFileRoute('/about')({
  head: () => ({ meta: [{ title: 'Our Story — Delight Shopping Mart' }, { name: 'description', content: 'Delight Shopping Mart is Tulsipur’s local one-stop shop for groceries and daily essentials.' }] }),
  component: Page,
});

const values = [
  [Leaf, 'Quality you can trust', 'Genuine brands and fresh stock, checked by our team.'],
  [Truck, 'Fast local delivery', 'Most orders reach you in 15–20 minutes.'],
  [Heart, 'For a happier Tulsipur', 'Friendly service from neighbours who know the town.'],
] as const;

function Page() {
  return (
    <InfoPage title="Our Story" intro="Delight Shopping Mart is Tulsipur’s local one-stop shop — everything your home needs, under one roof and now at your door.">
      <section>
        <h2>Shop local, grow together</h2>
        <p>We started Delight to make everyday shopping in Tulsipur simple: fresh groceries, trusted brands, baby care, beauty, stationery, kitchen and household essentials in one place, at fair local prices. Every order you place supports a local business and the people who work here.</p>
      </section>
      <div className="grid gap-3 sm:grid-cols-3">
        {values.map(([Icon, a, b]) => (
          <div key={a} className="rounded-2xl bg-[#eef8f3] p-4"><Icon className="size-6 text-brand" /><b className="mt-2 block text-[15px] text-navy">{a}</b><p className="text-[13.5px] leading-6 text-slate">{b}</p></div>
        ))}
      </div>
      <section>
        <h2>Visit us</h2>
        <p className="flex items-start gap-2"><MapPin className="mt-1.5 size-4 shrink-0 text-brand" /> <span>Ward No. 6, Tulsipur, Dang. See the map on our <Link to="/store-location" className="font-semibold text-brand">Store Location</Link> page.</span></p>
      </section>
    </InfoPage>
  );
}
