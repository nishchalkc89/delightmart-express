import { createFileRoute } from '@tanstack/react-router';
import { InfoPage } from '@/components/delight/info-page';

export const Route = createFileRoute('/shipping')({
  head: () => ({ meta: [{ title: 'Shipping Information — Delight Shopping Mart' }, { name: 'description', content: 'Delivery area, times and charges for Delight Shopping Mart orders.' }] }),
  component: Page,
});

function Page() {
  return (
    <InfoPage title="Shipping Information" intro="Fast local delivery from our stores in Tulsipur and Ghorahi.">
      <section><h2>Where we deliver</h2><p>Tulsipur, Ghorahi and nearby areas. Each order is delivered by the store you choose; delivering to the other store’s town has a small extra fee, shown in your bill. Add your address at checkout; if it is outside our area, we will call you before packing.</p></section>
      <section><h2>How fast</h2><p>Most orders arrive in 15–20 minutes during opening hours (7 AM – 9 PM). Orders placed after closing are delivered the next morning. Busy times and heavy rain can add a little time.</p></section>
      <section><h2>Delivery charge</h2><p>Delivery is currently free. If a charge applies, it is always shown in the Bill Summary in your cart before you place the order.</p></section>
      <section><h2>Tracking</h2><p>Follow every step — confirmed, packing, out for delivery, delivered — in My Orders. You also get a notification when the status changes.</p></section>
    </InfoPage>
  );
}
