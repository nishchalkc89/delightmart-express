import { createFileRoute } from '@tanstack/react-router';
import { Clock, MapPin, MessageCircle, Navigation, Phone } from 'lucide-react';
import { InfoPage } from '@/components/delight/info-page';
import { STORE, telLink, whatsappLink } from '@/lib/store-info';

export const Route = createFileRoute('/store-location')({
  head: () => ({ meta: [{ title: 'Store Location — Delight Shopping Mart' }, { name: 'description', content: 'Find Delight Shopping Mart in Tulsipur, Dang. Opening hours and directions.' }] }),
  component: Page,
});

function Page() {
  const q = encodeURIComponent(STORE.mapQuery);
  return (
    <InfoPage title="Store Location" intro="Come and shop in person, or order online for delivery.">
      <div className="overflow-hidden rounded-2xl border border-line">
        <iframe title="Map to Delight Shopping Mart" src={`https://www.google.com/maps?q=${q}&output=embed`} className="h-[300px] w-full lg:h-[380px]" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <p className="flex items-start gap-2 rounded-xl border border-line p-4"><MapPin className="mt-1 size-5 shrink-0 text-brand" /> {STORE.address}</p>
        <p className="flex items-start gap-2 rounded-xl border border-line p-4"><Clock className="mt-1 size-5 shrink-0 text-brand" /> {STORE.hours}</p>
      </div>
      <div className="flex flex-wrap gap-2.5">
        <a href={`https://www.google.com/maps/dir/?api=1&destination=${q}`} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-lg bg-brand px-5 font-semibold text-white"><Navigation className="size-4" /> Get directions</a>
        <a href={telLink} className="inline-flex h-11 items-center gap-2 rounded-lg border border-line px-5 font-semibold text-navy"><Phone className="size-4 text-brand" /> {STORE.phone}</a>
        <a href={whatsappLink()} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-lg border border-line px-5 font-semibold text-navy"><MessageCircle className="size-4 text-brand" /> WhatsApp</a>
      </div>
    </InfoPage>
  );
}
