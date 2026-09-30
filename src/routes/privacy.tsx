import { createFileRoute } from '@tanstack/react-router';
import { InfoPage } from '@/components/delight/info-page';
import { STORE } from '@/lib/store-info';

export const Route = createFileRoute('/privacy')({
  head: () => ({ meta: [{ title: 'Privacy Policy — Delight Shopping Mart' }, { name: 'description', content: 'How Delight Shopping Mart uses and protects your information.' }] }),
  component: Page,
});

function Page() {
  return (
    <InfoPage title="Privacy Policy" intro="We only collect what we need to deliver your orders, and we never sell your data." updated="30 September 2026">
      <section><h2>What we collect</h2><ul><li>Your name, phone number, email and delivery addresses.</li><li>Your orders, saved items and coupon use.</li><li>Basic technical information (browser, device) to keep the site working and secure.</li></ul></section>
      <section><h2>How we use it</h2><ul><li>To take, pack and deliver your orders and contact you about them.</li><li>To send offers and news only if you subscribe — you can stop at any time.</li><li>To prevent fraud and improve our service.</li></ul></section>
      <section><h2>Sharing</h2><p>We do not sell or rent your information. It is shared only with people who need it to serve you (for example, our delivery riders see your address and phone) and with the service providers that host our website and database.</p></section>
      <section><h2>Security</h2><p>Your password is encrypted and never visible to our staff. We do not store card or wallet PINs.</p></section>
      <section><h2>Your choices</h2><p>You can update your details in My Account, change notification settings in App Settings, and ask us to delete your account in Privacy &amp; Security or by emailing {STORE.email}.</p></section>
    </InfoPage>
  );
}
