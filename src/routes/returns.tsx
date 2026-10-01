import { createFileRoute, Link } from '@tanstack/react-router';
import { InfoPage } from '@/components/delight/info-page';
import { STORE, whatsappLink } from '@/lib/store-info';

export const Route = createFileRoute('/returns')({
  head: () => ({ meta: [{ title: 'Returns & Refunds — Delight Shopping Mart' }, { name: 'description', content: 'How to return an item or get a refund from Delight Shopping Mart.' }] }),
  component: Page,
});

function Page() {
  return (
    <InfoPage title="Returns & Refunds" intro="Something not right? We will make it right.">
      <section><h2>Check at the door</h2><p>Please check your items when the rider arrives. You can refuse damaged, expired or wrong items on the spot and you will not pay for them.</p></section>
      <section>
        <h2>Report within 24 hours</h2>
        <p>If you find a problem later, tell us within 24 hours with your order number and a photo. We will replace the item or refund it.</p>
        <ul>
          <li>Missing, wrong, damaged or expired items: replaced or refunded.</li>
          <li>Unopened non-food items in original packing: returnable within 7 days.</li>
          <li>Opened food, personal care, baby care and undergarments: not returnable unless faulty.</li>
        </ul>
      </section>
      <section><h2>How refunds are paid</h2><p>Cash on Delivery orders are refunded in cash at the store or on your next delivery, or credited to your next order, whichever you prefer.</p></section>
      <section><h2>Start a return</h2><p>Open the order in <Link to="/account/orders" className="font-semibold text-brand">My Orders</Link> and tap “Get help”{whatsappLink() ? <>, <a href={whatsappLink('Hello Delight, I want to return an item.')} target="_blank" rel="noreferrer" className="font-semibold text-brand">message us on WhatsApp</a>,</> : ','} or call <a href={`tel:+${STORE.phone.replace(/\D/g, '')}`} className="font-semibold text-brand">{STORE.phone}</a>.</p></section>
    </InfoPage>
  );
}
