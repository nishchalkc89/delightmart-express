import { createFileRoute } from '@tanstack/react-router';
import { StorePage } from '@/components/delight/store-shell';
import { OrderList } from '@/components/delight/order-list';

export const Route = createFileRoute('/orders/')({
  head: () => ({ meta: [{ title: 'My Orders — Delight Shopping Mart' }, { name: 'description', content: 'Track and manage your Delight orders.' }, { property: 'og:title', content: 'My Orders — Delight' }, { property: 'og:description', content: 'See your current and past orders.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: Page,
});

function Page() {
  return (
    <StorePage mobile={{ variant: 'back', actions: ['cart'], search: false }}>
      <div className="mx-auto max-w-[860px] px-4 py-3 lg:py-8">
        <h1 className="text-[28px] font-extrabold tracking-tight text-navy lg:text-[36px]">My Orders</h1>
        <p className="text-[14.5px] text-slate lg:text-[16px]">Track current orders and view past purchases.</p>
        <OrderList />
      </div>
    </StorePage>
  );
}
