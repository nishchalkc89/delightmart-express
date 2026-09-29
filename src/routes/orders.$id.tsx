import { createFileRoute, Link } from '@tanstack/react-router';
import { Check, ChefHat, CircleCheck, ClipboardCheck, MapPin, Package, Truck, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { StorePage } from '@/components/delight/store-shell';
import { getMyOrders } from '@/services/orders';
import { formatNpr } from '@/services/catalog';
import { useAuth } from '@/components/delight/auth-context';
import { orderStatusStyle, titleCase } from '@/components/delight/order-list';

type Order = Awaited<ReturnType<typeof getMyOrders>>[number];

const stages = [
  ['PENDING', 'Order Placed', ClipboardCheck],
  ['CONFIRMED', 'Confirmed', CircleCheck],
  ['PREPARING', 'Preparing', ChefHat],
  ['OUT_FOR_DELIVERY', 'Out for Delivery', Truck],
  ['DELIVERED', 'Delivered', Package],
] as const;
const rank: Record<string, number> = { PENDING: 0, CONFIRMED: 1, PREPARING: 2, READY_FOR_DELIVERY: 2, OUT_FOR_DELIVERY: 3, DELIVERED: 4 };

export const Route = createFileRoute('/orders/$id')({
  head: ({ params }) => ({ meta: [{ title: `Order #${params.id} — Delight Shopping Mart` }, { name: 'description', content: 'Track your Delight Shopping Mart order.' }, { property: 'og:title', content: 'Order Tracking — Delight' }, { property: 'og:description', content: 'See order and delivery progress.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    void getMyOrders(user.id).then((list) => setOrder(list.find((o) => o.id === id) ?? null)).catch(() => setOrder(null)).finally(() => setLoading(false));
  }, [user, authLoading, id]);

  const current = order ? rank[order.status] ?? -1 : -1;
  const stopped = order && (order.status === 'CANCELLED' || order.status === 'FAILED');

  return (
    <StorePage mobile={{ variant: 'back', actions: ['cart'], search: false }}>
      <div className="mx-auto max-w-[860px] px-4 py-3 lg:py-8">
        {loading ? (
          <div className="space-y-3"><div className="h-24 animate-pulse rounded-xl bg-[#f1f4f7]" /><div className="h-56 animate-pulse rounded-xl bg-[#f1f4f7]" /></div>
        ) : !order ? (
          <div className="rounded-xl border border-line bg-white p-8 text-center">
            <Package className="mx-auto size-12 text-slate" strokeWidth={1.4} />
            <h1 className="mt-3 text-[20px] font-bold text-navy">{!user ? 'Sign in to view your order' : 'Order not found'}</h1>
            <Link to={user ? '/orders' : '/login'} className="mt-4 inline-flex h-11 items-center rounded-lg bg-brand px-6 font-semibold text-white">{user ? 'My Orders' : 'Sign In'}</Link>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-[28px] font-extrabold tracking-tight text-navy lg:text-[34px]">Order #{order.order_number}</h1>
                <p className="text-[14px] text-slate">Placed on {new Date(order.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <span className={`rounded-lg px-3 py-1.5 text-[14px] font-semibold ${orderStatusStyle[order.status] ?? ''}`}>{titleCase(order.status)}</span>
            </div>

            {!stopped && (
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-brand/40 bg-[#effaf4] px-4 py-3.5">
                <Zap className="size-8 shrink-0 fill-brand text-brand" />
                <span><b className="block text-[17px] font-bold text-brand">{order.status === 'DELIVERED' ? 'Delivered — enjoy your order!' : 'Arriving in about 15–20 minutes'}</b><span className="text-[13.5px] text-slate">{order.estimated_delivery_at ? `Estimated by ${new Date(order.estimated_delivery_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` : 'Our store team will deliver to your address.'}</span></span>
              </div>
            )}

            <section className="mt-4 rounded-xl border border-line bg-white px-4 py-5">
              <h2 className="text-[18px] font-bold text-navy">Delivery Progress</h2>
              <ol className="mt-5 grid grid-cols-5">
                {stages.map(([key, label, Icon], i) => {
                  const done = !stopped && i <= current;
                  return (
                    <li key={key} className="relative flex flex-col items-center text-center">
                      {i > 0 && <span className={`absolute top-5 h-0.5 ${!stopped && i <= current ? 'bg-brand' : 'bg-line'}`} style={{ left: 'calc(-50% + 24px)', right: 'calc(50% + 24px)' }} />}
                      <span className={`z-10 grid size-10 place-items-center rounded-full ${done ? 'bg-brand text-white' : 'bg-[#eef1f4] text-slate'}`}>{done && i < current ? <Check className="size-5" strokeWidth={3} /> : <Icon className="size-5" />}</span>
                      <span className={`mt-2 text-[11.5px] leading-tight lg:text-[13px] ${done ? 'font-semibold text-brand' : 'text-slate'}`}>{label}</span>
                    </li>
                  );
                })}
              </ol>
              {stopped && <p className="mt-4 rounded-lg bg-[#fde7e7] px-4 py-3 text-[14px] text-[#e3101a]">This order was {order.status.toLowerCase()}. Please contact the store if you need help.</p>}
            </section>

            <section className="mt-3 rounded-xl border border-line bg-white px-4 py-4">
              <h2 className="border-b border-line pb-3 text-[18px] font-bold text-navy">Order Items ({order.order_items.length})</h2>
              {order.order_items.map((item, i) => (
                <div key={i} className="flex items-center justify-between gap-3 border-b border-line py-3 last:border-0">
                  <span className="text-[14.5px] text-navy">{item.product_name}<span className="block text-[13px] text-slate">Qty: {item.quantity} × {formatNpr(item.unit_price)}</span></span>
                  <b className="text-[15px] font-bold text-navy">{formatNpr(item.line_total)}</b>
                </div>
              ))}
            </section>

            <section className="mt-3 rounded-xl border border-line bg-white px-4 py-4 text-[14.5px]">
              <p className="flex justify-between text-slate"><span>Subtotal</span><span className="text-navy">{formatNpr(order.subtotal)}</span></p>
              {order.discount > 0 && <p className="mt-2 flex justify-between text-slate"><span>Discount</span><span className="text-brand">− {formatNpr(order.discount)}</span></p>}
              <p className="mt-2 flex justify-between text-slate"><span>Delivery Charge</span><span className="font-semibold text-brand">{order.delivery_fee ? formatNpr(order.delivery_fee) : 'FREE'}</span></p>
              <p className="mt-3 flex items-center justify-between border-t border-line pt-3"><b className="text-[17px] text-navy">Total Amount</b><b className="text-[22px] font-extrabold text-red">{formatNpr(order.total)}</b></p>
              <p className="mt-3 flex items-start gap-2 rounded-lg bg-page px-3 py-2.5 text-[13.5px] text-slate"><MapPin className="mt-0.5 size-4 shrink-0 text-navy" />Payment: Cash on Delivery{order.delivery_instructions ? ` · ${order.delivery_instructions}` : ''}</p>
            </section>
          </>
        )}
      </div>
    </StorePage>
  );
}
