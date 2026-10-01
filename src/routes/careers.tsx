import { createFileRoute } from '@tanstack/react-router';
import { Mail } from 'lucide-react';
import { InfoPage } from '@/components/delight/info-page';
import { STORE } from '@/lib/store-info';

export const Route = createFileRoute('/careers')({
  head: () => ({ meta: [{ title: 'Careers — Delight Shopping Mart' }, { name: 'description', content: 'Work with Delight Shopping Mart in Tulsipur and Ghorahi.' }] }),
  component: Page,
});

function Page() {
  return (
    <InfoPage title="Careers" intro="Join a friendly local team serving families across Tulsipur and Ghorahi.">
      <section>
        <h2>Roles we often hire for</h2>
        <ul>
          <li>Store assistants and cashiers</li>
          <li>Order pickers and packers</li>
          <li>Delivery riders (own two-wheeler and licence)</li>
          <li>Inventory and stock staff</li>
        </ul>
      </section>
      <section>
        <h2>How to apply</h2>
        <p>Send your name, phone number, the role you are interested in and a short note about yourself. You can also drop in at the store and ask for the manager.</p>
        <a href={`mailto:${STORE.email}?subject=${encodeURIComponent('Job application')}`} className="mt-3 inline-flex h-11 items-center gap-2 rounded-lg bg-brand px-5 font-semibold text-white"><Mail className="size-4" /> Apply by email</a>
      </section>
    </InfoPage>
  );
}
