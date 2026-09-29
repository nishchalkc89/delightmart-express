import { Link } from '@tanstack/react-router';
import { ChevronRight, Package } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from './auth-context';
import { getMyOrders } from '@/services/orders';
import { formatNpr } from '@/services/catalog';

type Order = Awaited<ReturnType<typeof getMyOrders>>[number];

export const orderStatusStyle: Record<string, string> = {
  PENDING: 'bg-[#fdf1dc] text-[#d97706]',
  CONFIRMED: 'bg-[#e4f0fd] text-[#2f73d9]',
  PREPARING: 'bg-[#fdf1dc] text-[#d97706]',
  READY_FOR_DELIVERY: 'bg-[#efeafd] text-[#7c5cf5]',
  OUT_FOR_DELIVERY: 'bg-[#e4f0fd] text-[#2f73d9]',
  DELIVERED: 'bg-[#e3f6ec] text-[#0a8a5b]',
  CANCELLED: 'bg-[#fde7e7] text-[#e3101a]',
  FAILED: 'bg-[#fde7e7] text-[#e3101a]',
};

export const titleCase = (s: string) => s.toLowerCase().split('_').map((w) => w[0]!.toUpperCase() + w.slice(1)).join(' ');

export function OrderList() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    void getMyOrders(user.id).then(setOrders).catch((e: Error) => toast.error(e.message)).finally(() => setLoading(false));
  }, [user, authLoading]);

  if (loading) {
    return <div className="mt-4 space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-[92px] animate-pulse rounded-xl bg-[#f1f4f7]" />)}</div>;
  }
  if (!user) {
    return (
      <div className="mt-4 rounded-xl border border-line bg-white p-8 text-center">
        <Package className="mx-auto size-12 text-slate" strokeWidth={1.4} />
        <h2 className="mt-3 text-[18px] font-bold text-navy">Sign in to see your orders</h2>
        <Link to="/login" className="mt-4 inline-flex h-11 items-center rounded-lg bg-brand px-6 font-semibold text-white">Sign In</Link>
      </div>
    );
  }
  if (!orders.length) {
    return (
      <div className="mt-4 rounded-xl border border-line bg-white p-8 text-center">
        <Package className="mx-auto size-12 text-slate" strokeWidth={1.4} />
        <h2 className="mt-3 text-[18px] font-bold text-navy">No orders yet</h2>
        <p className="mt-1 text-[14px] text-slate">Your orders will appear here once you place one.</p>
        <Link to="/products" className="mt-4 inline-flex h-11 items-center rounded-lg bg-brand px-6 font-semibold text-white">Start Shopping</Link>
      </div>
    );
  }
  return (
    <div className="mt-4 space-y-3">
      {orders.map((o) => (
        <Link key={o.id} to="/orders/$id" params={{ id: o.id }} className="flex items-center gap-4 rounded-xl border border-line bg-white px-4 py-4 hover:shadow-sm">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-brand-50"><Package className="size-6 text-brand" /></span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2"><b className="text-[16px] font-bold text-navy">Order #{o.order_number}</b><span className={`rounded-md px-2 py-0.5 text-[12px] font-semibold ${orderStatusStyle[o.status] ?? 'bg-[#eef1f4] text-navy'}`}>{titleCase(o.status)}</span></span>
            <span className="mt-0.5 block text-[13.5px] text-slate">{o.order_items.length} item{o.order_items.length === 1 ? '' : 's'} · {new Date(o.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          </span>
          <span className="text-right"><b className="block text-[16px] font-bold text-navy">{formatNpr(o.total)}</b><span className="text-[12.5px] text-slate">Cash on Delivery</span></span>
          <ChevronRight className="size-5 text-slate" />
        </Link>
      ))}
    </div>
  );
}
