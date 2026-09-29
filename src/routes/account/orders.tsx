import { createFileRoute } from '@tanstack/react-router';
import { OrderList } from '@/components/delight/order-list';

export const Route = createFileRoute('/account/orders')({
  head: () => ({ meta: [{ title: 'Order History — Delight Shopping Mart' }, { name: 'description', content: 'See your Delight orders and delivery status.' }, { property: 'og:title', content: 'Order History — Delight' }, { property: 'og:description', content: 'Review past and current orders.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: Page,
});

function Page() {
  return (
    <div>
      <h1 className="text-[28px] font-extrabold tracking-tight text-navy lg:text-[34px]">Order History</h1>
      <p className="text-[14.5px] text-slate">Track current orders and view past purchases.</p>
      <OrderList />
    </div>
  );
}
