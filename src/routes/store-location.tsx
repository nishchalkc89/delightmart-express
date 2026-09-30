import { createFileRoute } from '@tanstack/react-router';
import { Clock, MapPin, MessageCircle, Navigation, Phone } from 'lucide-react';
import { InfoPage } from '@/components/delight/info-page';
import { useBranch } from '@/components/delight/branch-context';
import { hoursText, type Branch } from '@/lib/branch';

export const Route = createFileRoute('/store-location')({
  head: () => ({ meta: [{ title: 'Store Locations — Delight Shopping Mart' }, { name: 'description', content: 'Find Delight Shopping Mart in Tulsipur and Ghorahi, Dang. Opening hours and directions.' }] }),
  component: Page,
});

function Page() {
  const { branches, branch } = useBranch();
  const list = [...branches].sort((a, b) => Number(b.id === branch.id) - Number(a.id === branch.id));
  return (
    <InfoPage title="Store Locations" intro="Two stores in Dang. Come and shop in person, or order online for delivery.">
      {list.map((b) => <StoreCard key={b.id} store={b} />)}
    </InfoPage>
  );
}

function StoreCard({ store: b }: { store: Branch }) {
  const pin = b.lat !== null && b.lng !== null ? `${b.lat},${b.lng}` : null;
  const digits = (b.phone ?? '').replace(/\D/g, '');
  const wa = (b.whatsapp || b.phone || '').replace(/\D/g, '');
  return (
    <section className="space-y-3 rounded-2xl border border-line p-4">
      <h2 className="flex flex-wrap items-center gap-2 text-[20px] font-extrabold text-navy">
        {b.city} store
        {!b.acceptingOrders && <span className="rounded-full bg-[#fff4df] px-2.5 py-0.5 text-[12px] font-semibold text-[#9a6200]">Online orders opening soon</span>}
      </h2>
      {pin && (
        <div className="overflow-hidden rounded-xl border border-line">
          <iframe title={`Map to Delight ${b.city}`} src={`https://www.google.com/maps?q=${pin}&z=17&output=embed`} className="h-[260px] w-full lg:h-[340px]" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <p className="flex items-start gap-2 rounded-xl border border-line p-4"><MapPin className="mt-1 size-5 shrink-0 text-brand" /> {b.address}</p>
        <p className="flex items-start gap-2 rounded-xl border border-line p-4"><Clock className="mt-1 size-5 shrink-0 text-brand" /> {hoursText(b) ? `Open daily, ${hoursText(b)}` : 'Opening hours coming soon'}</p>
      </div>
      <div className="flex flex-wrap gap-2.5">
        {pin && <a href={`https://www.google.com/maps/dir/?api=1&destination=${pin}`} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-lg bg-brand px-5 font-semibold text-white"><Navigation className="size-4" /> Get directions</a>}
        {b.mapsUrl && <a href={b.mapsUrl} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-lg border border-line px-5 font-semibold text-navy"><MapPin className="size-4 text-brand" /> Open in Google Maps</a>}
        {digits && <a href={`tel:+${digits}`} className="inline-flex h-11 items-center gap-2 rounded-lg border border-line px-5 font-semibold text-navy"><Phone className="size-4 text-brand" /> {b.phone}</a>}
        {wa && <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-lg border border-line px-5 font-semibold text-navy"><MessageCircle className="size-4 text-brand" /> WhatsApp</a>}
      </div>
    </section>
  );
}
