import { createFileRoute, Link } from '@tanstack/react-router';
import { InfoPage } from '@/components/delight/info-page';
import { STORE } from '@/lib/store-info';

export const Route = createFileRoute('/terms')({
  head: () => ({ meta: [{ title: 'Terms & Conditions — Delight Shopping Mart' }, { name: 'description', content: 'Terms for shopping at Delight Shopping Mart online.' }] }),
  component: Page,
});

function Page() {
  return (
    <InfoPage title="Terms & Conditions" intro="Please read these terms before placing an order on our website or app." updated="30 September 2026">
      <section><h2>1. Orders</h2><p>Placing an order is an offer to buy. We confirm it when the store accepts it. We may cancel an order if an item is out of stock, a price was shown incorrectly, or we cannot deliver to the address; you are not charged for cancelled items.</p></section>
      <section><h2>2. Prices and payment</h2><p>Prices are in Nepali Rupees (NPR). The price you pay is the one shown in your cart when you place the order. Payment is currently Cash on Delivery; online payment options will be listed at checkout when they are available.</p></section>
      <section><h2>3. Delivery</h2><p>We deliver within our delivery area in and around Tulsipur and Ghorahi. Delivery times are estimates. Someone should be available to receive the order; if we cannot reach you, we may cancel it.</p></section>
      <section><h2>4. Coupons</h2><p>Coupon codes have their own minimum order, dates and limits, cannot be exchanged for cash, and may be withdrawn at any time. One coupon per order.</p></section>
      <section><h2>5. Returns</h2><p>See <Link to="/returns" className="font-semibold text-brand">Returns &amp; Refunds</Link> for what can be returned and how.</p></section>
      <section><h2>6. Your account</h2><p>Keep your password private. You are responsible for orders placed from your account. Contact us straight away if you think someone else is using it.</p></section>
      <section><h2>7. Contact</h2><p>{STORE.name}, {STORE.address}. Phone {STORE.phone}, email {STORE.email}.</p></section>
    </InfoPage>
  );
}
