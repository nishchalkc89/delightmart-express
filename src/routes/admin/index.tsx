import { createFileRoute, Link } from '@tanstack/react-router';
import { ChartColumn, ChevronRight, CircleDot, Coins, LayoutGrid, Package, ShoppingCart, Tag, TriangleAlert, Truck, Users, FileText, Box } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Avatar, Badge, Card, DataBadge, PeriodSelect, StatCard, Status, Table, Td, Tr, PERIODS, periodStart } from '@/components/delight/admin-ui';
import { fetchAdminOrders, fetchAdminProducts, statusLabel, useAdminData, useStaffName, type AdminOrder, type AdminProduct } from '@/services/admin';
import { npr } from '@/components/delight/admin-data';

export const Route = createFileRoute('/admin/')({
  head: () => ({ meta: [{ title: 'Dashboard — Delight Admin' }, { name: 'description', content: 'Delight Shopping Mart operations dashboard.' }, { property: 'og:title', content: 'Delight Admin Dashboard' }, { property: 'og:description', content: 'Store operations overview.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: Page,
});

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#f59f0b', CONFIRMED: '#2f80ed', PREPARING: '#4a9ff5', READY_FOR_DELIVERY: '#7c5cf5', OUT_FOR_DELIVERY: '#f5b40b',
  DELIVERED: '#0a8a5b', CANCELLED: '#ef4444', FAILED: '#9aa3ad',
};

function Page() {
  const orders = useAdminData<AdminOrder>(fetchAdminOrders);
  const stock = useAdminData<AdminProduct>(fetchAdminProducts);
  const name = useStaffName();
  const [period, setPeriod] = useState('7d');
  const periodLabel = PERIODS.find(([v]) => v === period)?.[1].toLowerCase() ?? '';

  const inRange = useMemo(() => orders.rows.filter((o) => new Date(o.createdAt).getTime() >= periodStart(period)), [orders.rows, period]);
  const counted = inRange.filter((o) => o.status !== 'CANCELLED' && o.status !== 'FAILED');
  const sales = counted.reduce((s, o) => s + o.total, 0);

  // Sales per day across the period (all time = the last 30 days that have orders).
  const chart = useMemo(() => {
    const start = periodStart(period) || (orders.rows.length ? Math.min(...orders.rows.map((o) => new Date(o.createdAt).getTime())) : Date.now());
    const first = new Date(start); first.setHours(0, 0, 0, 0);
    const days = Math.min(Math.max(1, Math.ceil((Date.now() - first.getTime()) / 86_400_000)), period === 'all' ? 30 : 92);
    const from = Date.now() - days * 86_400_000;
    const buckets = new Map<string, number>();
    for (let i = days - 1; i >= 0; i--) buckets.set(new Date(Date.now() - i * 86_400_000).toDateString(), 0);
    for (const o of counted) {
      if (new Date(o.createdAt).getTime() < from) continue;
      const k = new Date(o.createdAt).toDateString();
      if (buckets.has(k)) buckets.set(k, (buckets.get(k) ?? 0) + o.total);
    }
    return [...buckets].map(([k, v]) => ({ d: new Date(k).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), v }));
  }, [counted, period, orders.rows]);

  const byStatus = useMemo(() => {
    const m = new Map<string, number>();
    for (const o of inRange) m.set(o.status, (m.get(o.status) ?? 0) + 1);
    return [...m].map(([s, count]) => ({ n: statusLabel(s), count, c: STATUS_COLORS[s] ?? '#9aa3ad', p: inRange.length ? Math.round((count / inRange.length) * 100) : 0 })).sort((a, b) => b.count - a.count);
  }, [inRange]);

  const topSelling = useMemo(() => {
    const m = new Map<string, { qty: number; image: string }>();
    for (const o of counted) for (const i of o.items) m.set(i.name, { qty: (m.get(i.name)?.qty ?? 0) + i.quantity, image: i.image });
    return [...m].sort((a, b) => b[1].qty - a[1].qty).slice(0, 5);
  }, [counted]);

  const low = stock.rows.filter((p) => p.active && p.stock < p.threshold).sort((a, b) => a.stock - b.stock).slice(0, 6);
  const customers = new Set(inRange.map((o) => o.customer.email || o.customer.name)).size;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[32px] font-extrabold leading-tight tracking-tight text-navy lg:text-[36px]">Welcome back, {name}!<DataBadge live={orders.live} loading={orders.loading} /></h1>
          <p className="text-[17px] text-slate">Here's what's happening at Delight Shopping Mart.</p>
        </div>
        <PeriodSelect value={period} onChange={setPeriod} className="mt-2 w-[180px]" />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard icon={ShoppingCart} tone="green" label="Total Orders" value={String(inRange.length)} note={periodLabel} />
        <StatCard icon={Coins} tone="blue" label="Total Sales" value={npr(sales)} note={`${periodLabel}, excl. cancelled`} />
        <StatCard icon={Box} tone="amber" label="Pending Orders" value={String(orders.rows.filter((x) => x.status === 'PENDING').length)} note="awaiting confirmation" />
        <StatCard icon={Truck} tone="red" label="Out for Delivery" value={String(orders.rows.filter((x) => x.status === 'OUT_FOR_DELIVERY').length)} note="right now" />
        <StatCard icon={Users} tone="purple" label="Customers" value={String(customers)} note={`ordered ${periodLabel}`} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.62fr)_minmax(0,1fr)_325px]">
        <Card className="p-5">
          <h2 className="flex items-center gap-2.5 text-[19px] font-bold text-navy"><ChartColumn className="size-6" /> Sales Overview <span className="text-[13px] font-normal text-slate">({periodLabel})</span></h2>
          <div className="mt-3 h-[190px]">
            {sales ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chart} margin={{ left: -4, right: 12, top: 8 }}>
                  <defs><linearGradient id="dash" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0a8a5b" stopOpacity={0.28} /><stop offset="100%" stopColor="#0a8a5b" stopOpacity={0.02} /></linearGradient></defs>
                  <CartesianGrid vertical={false} stroke="#eef1f4" />
                  <XAxis dataKey="d" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#6b7385' }} minTickGap={16} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#6b7385' }} tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}K` : String(v))} />
                  <Tooltip formatter={(v) => npr(Number(v))} />
                  <Area type="monotone" dataKey="v" name="Sales" stroke="#0a8a5b" strokeWidth={2.5} fill="url(#dash)" dot={chart.length <= 14 ? { r: 3.5, fill: '#0a8a5b', strokeWidth: 0 } : false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <p className="grid h-full place-items-center text-[14px] text-slate">No sales {periodLabel} yet.</p>}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="flex items-center gap-2.5 text-[19px] font-bold text-navy"><CircleDot className="size-6" /> Order Status</h2>
          {inRange.length ? (
            <div className="mt-3 flex items-center gap-2">
              <div className="relative size-[170px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart><Pie data={byStatus} dataKey="count" nameKey="n" innerRadius={58} outerRadius={80} startAngle={90} endAngle={-270} stroke="none">{byStatus.map((s) => <Cell key={s.n} fill={s.c} />)}</Pie><Tooltip /></PieChart>
                </ResponsiveContainer>
                <span className="absolute inset-0 grid place-content-center text-center"><b className="text-[24px] font-extrabold text-navy">{inRange.length.toLocaleString('en-US')}</b><span className="text-[13px] text-slate">Orders</span></span>
              </div>
              <ul className="space-y-2 text-[13px]">
                {byStatus.map((s) => <li key={s.n} className="flex gap-2"><span className="mt-1 size-3 shrink-0 rounded-full" style={{ background: s.c }} /><span className="leading-tight text-navy">{s.n}<br /><span className="text-slate">{s.count} ({s.p}%)</span></span></li>)}
              </ul>
            </div>
          ) : <p className="grid h-[170px] place-items-center text-[14px] text-slate">No orders {periodLabel}.</p>}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2.5 text-[17px] font-bold text-navy"><TriangleAlert className="size-6 fill-[#e3101a] text-white" /> Low Stock</h2>
            <Link to="/admin/inventory" className="text-[14px] font-medium text-[#0a8a5b]">View All</Link>
          </div>
          <ul className="mt-2 divide-y divide-line">
            {low.map((p) => (
              <li key={p.id}>
                <Link to="/admin/inventory" search={{ q: p.sku }} className="flex items-center gap-3 py-2 hover:bg-page">
                  {p.image ? <img src={p.image} alt="" className="size-10 object-contain" /> : <span className="size-10 rounded bg-[#f1f4f7]" />}
                  <span className="line-clamp-2 flex-1 text-[13.5px] text-navy">{p.name}</span>
                  <span className="shrink-0 text-[13.5px] font-medium text-[#e3101a]">{p.stock <= 0 ? 'Out' : `${p.stock} left`}</span>
                </Link>
              </li>
            ))}
            {!stock.loading && !low.length && <li className="py-6 text-center text-[14px] text-slate">All products are well stocked.</li>}
          </ul>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,2.62fr)_325px]">
        <div className="min-w-0">
          <Card>
            <div className="flex items-center justify-between px-5 py-4">
              <h2 className="flex items-center gap-2.5 text-[19px] font-bold text-navy"><FileText className="size-6" /> Recent Orders</h2>
              <Link to="/admin/orders" className="flex items-center gap-1 text-[14px] font-medium text-[#0a8a5b]">View All Orders <ChevronRight className="size-4" /></Link>
            </div>
            <div className="px-3 pb-3">
              <Table head={['#', 'Customer', 'Items', 'Amount', 'Payment', 'Status', 'Action']}>
                {orders.rows.slice(0, 6).map((o) => (
                  <Tr key={o.id}>
                    <Td>{o.number}</Td>
                    <Td><span className="flex items-center gap-3"><Avatar name={o.customer.name} size="size-8" />{o.customer.name}</span></Td>
                    <Td>{o.items.reduce((s, i) => s + i.quantity, 0)} items</Td>
                    <Td>{npr(o.total)}</Td>
                    <Td><Badge tone="gray">{o.paymentMethod === 'COD' ? 'COD' : o.paymentMethod}</Badge></Td>
                    <Td><Status value={o.status === 'PENDING' ? 'New' : statusLabel(o.status)} /></Td>
                    <Td><Link to="/admin/orders" search={{ id: o.id }} className="rounded-md border border-line px-3 py-1 text-[13px] font-medium text-[#0a8a5b]">View</Link></Td>
                  </Tr>
                ))}
                {!orders.loading && !orders.rows.length && <Tr><Td className="py-6 text-slate">No orders yet. They will appear here as soon as customers order.</Td></Tr>}
              </Table>
            </div>
          </Card>
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {([[Package, 'Add Product', 'Create new product', 'green', '/admin/products'], [LayoutGrid, 'Manage Categories', 'Organize your store', 'green', '/admin/categories'], [Tag, 'Create Offer', 'Add discount or coupon', 'red', '/admin/offers'], [ChartColumn, 'View Reports', 'Sales, orders & more', 'purple', '/admin/reports']] as const).map(([Icon, a, b, tone, to]) => (
              <Link key={a} to={to} className="flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-4 hover:shadow-sm">
                <span className={`grid size-[46px] shrink-0 place-items-center rounded-full ${tone === 'green' ? 'bg-[#e3f6ec] text-[#0a8a5b]' : tone === 'red' ? 'bg-[#fde7e7] text-[#e3101a]' : 'bg-[#efeafd] text-[#7c5cf5]'}`}><Icon className="size-6" /></span>
                <span className="min-w-0 flex-1"><b className="block text-[15px] font-semibold text-navy">{a}</b><span className="text-[13px] text-slate">{b}</span></span>
                <ChevronRight className="size-5 text-navy" />
              </Link>
            ))}
          </div>
        </div>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2.5 text-[17px] font-bold text-navy"><ChartColumn className="size-6" /> Top Selling</h2>
            <Link to="/admin/reports" className="text-[14px] font-medium text-[#0a8a5b]">View All</Link>
          </div>
          <ul className="mt-2 divide-y divide-line">
            {topSelling.map(([pname, info], i) => (
              <li key={pname} className="flex items-center gap-3 py-2.5">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#eef1f4] text-[14px] font-semibold text-navy">{i + 1}</span>
                {info.image ? <img src={info.image} alt="" className="size-10 object-contain" /> : <span className="size-10 shrink-0 rounded bg-[#f1f4f7]" />}
                <span className="min-w-0 leading-tight"><span className="line-clamp-2 block text-[13.5px] text-navy">{pname}</span><span className="text-[13px] text-slate">{info.qty} sold</span></span>
              </li>
            ))}
            {!topSelling.length && <li className="py-6 text-center text-[14px] text-slate">No sales {periodLabel} yet.</li>}
          </ul>
        </Card>
      </div>
    </div>
  );
}
