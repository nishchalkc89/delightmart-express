import { Store } from 'lucide-react';
import { Card } from './admin-ui';
import { npr } from './admin-data';
import { useAdminScope } from '@/services/admin-scope';
import type { AdminOrder } from '@/services/admin';

const COLORS = ['#0a8a5b', '#8b5cf6', '#2f80ed', '#f59f0b'];

/**
 * Revenue and orders per store, side by side, with the combined total.
 * Shown to the owner while viewing "All stores"; `orders` are the orders of the selected period.
 */
export function StoreComparison({ orders, periodLabel }: { orders: AdminOrder[]; periodLabel: string }) {
  const { scope, allowed, setScope } = useAdminScope();
  if (scope !== 'all' || allowed.length < 2) return null;
  const counted = orders.filter((o) => o.status !== 'CANCELLED' && o.status !== 'FAILED');
  const rows = allowed.map((b, i) => {
    const mine = counted.filter((o) => o.branch === b.id);
    const revenue = mine.reduce((s, o) => s + o.total, 0);
    return { b, color: COLORS[i % COLORS.length]!, revenue, count: orders.filter((o) => o.branch === b.id).length, avg: mine.length ? Math.round(revenue / mine.length) : 0, pending: orders.filter((o) => o.branch === b.id && o.status === 'PENDING').length };
  });
  const total = rows.reduce((s, r) => s + r.revenue, 0);
  return (
    <Card className="mt-4 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="flex items-center gap-2 text-[17px] font-bold text-navy"><Store className="size-5 text-[#0a8a5b]" /> Revenue by store</h2>
        <span className="text-[13px] text-slate">{periodLabel} · excluding cancelled orders</span>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
        {rows.map((r) => (
          <button key={r.b.id} type="button" onClick={() => setScope(r.b.id)} title={`Open the ${r.b.city} store view`} className="rounded-xl border border-line p-4 text-left transition-colors hover:border-[#0a8a5b]">
            <span className="flex items-center gap-2 text-[14px] font-semibold text-navy"><span className="size-3 rounded-full" style={{ background: r.color }} />{r.b.city} store</span>
            <b className="mt-1 block text-[24px] font-extrabold text-navy">{npr(r.revenue)}</b>
            <span className="block text-[13px] text-slate">{r.count} orders · avg {npr(r.avg)}{r.pending ? ` · ${r.pending} pending` : ''}</span>
            <span className="mt-2 block h-1.5 rounded-full bg-[#eef1f4]"><span className="block h-full rounded-full" style={{ width: `${total ? (r.revenue / total) * 100 : 0}%`, background: r.color }} /></span>
            <span className="mt-1 block text-[12px] text-slate">{total ? Math.round((r.revenue / total) * 100) : 0}% of total</span>
          </button>
        ))}
        <div className="rounded-xl bg-[#f0fbf5] p-4">
          <span className="text-[14px] font-semibold text-[#077a52]">All stores</span>
          <b className="mt-1 block text-[24px] font-extrabold text-navy">{npr(total)}</b>
          <span className="block text-[13px] text-slate">{orders.length} orders in total</span>
        </div>
      </div>
    </Card>
  );
}
