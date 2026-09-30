import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { ChartColumn, Clock, Download, Eye, FileText, Hexagon, ShoppingCart, Trophy, Users, Box } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Avatar, Card, DataBadge, downloadCsv, Field, FilterSelect, IconBtn, inPeriod, PageHeader, PeriodSelect, periodStart, PERIODS, PrimaryAction, StatCard, Status, Table, Td, Tr, type BadgeTone, Badge } from '@/components/delight/admin-ui';
import { fetchAdminOrders, fmtDate, fmtTime, statusLabel, useAdminData, type AdminOrder } from '@/services/admin';
import { npr } from '@/components/delight/admin-data';

export const Route = createFileRoute('/admin/reports')({
  head: () => ({ meta: [{ title: 'Reports & Analytics — Delight Admin' }, { name: 'description', content: 'Business performance insights.' }, { property: 'og:title', content: 'Reports & Analytics — Delight Admin' }, { property: 'og:description', content: 'Sales and order analytics.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: Page,
});

const statusTone: Record<string, BadgeTone> = { Delivered: 'green', 'Out for Delivery': 'blue', Processing: 'amber', Pending: 'red' };
const DAY = 86_400_000;
const isValid = (o: AdminOrder) => o.status !== 'CANCELLED' && o.status !== 'FAILED';
const periodName = (p: string) => PERIODS.find(([k]) => k === p)?.[1] ?? p;
const today = () => new Date().toISOString().slice(0, 10);

/** Days covered by a period, for the chart (all time = since the first order, up to a year). */
function daysIn(period: string, rows: AdminOrder[]) {
  const start = periodStart(period);
  const from = start || Math.min(...rows.map((o) => new Date(o.createdAt).getTime()), Date.now());
  const midnight = new Date(); midnight.setHours(0, 0, 0, 0);
  return Math.min(365, Math.max(start ? 1 : 7, Math.floor((midnight.getTime() - new Date(from).setHours(0, 0, 0, 0)) / DAY) + 1));
}

function exportSales(rows: AdminOrder[], period: string) {
  downloadCsv(`delight-sales-${period}-${today()}.csv`, [
    ['Order', 'Date', 'Customer', 'Phone', 'Items', 'Subtotal', 'Discount', 'Delivery fee', 'Total', 'Payment', 'Status'],
    ...rows.map((o) => [o.number, `${fmtDate(o.createdAt)} ${fmtTime(o.createdAt)}`, o.customer.name, o.customer.phone, o.items.reduce((s, i) => s + i.quantity, 0), o.subtotal, o.discount, o.deliveryFee, o.total, o.paymentMethod, statusLabel(o.status)]),
  ]);
}

function exportProducts(rows: AdminOrder[], period: string) {
  const sold = new Map<string, { qty: number; revenue: number; orders: number }>();
  rows.filter(isValid).forEach((o) => o.items.forEach((i) => { const x = sold.get(i.name) ?? { qty: 0, revenue: 0, orders: 0 }; x.qty += i.quantity; x.revenue += i.lineTotal; x.orders += 1; sold.set(i.name, x); }));
  downloadCsv(`delight-product-sales-${period}-${today()}.csv`, [
    ['Product', 'Units sold', 'Orders', 'Revenue (NPR)'],
    ...[...sold.entries()].sort((a, b) => b[1].revenue - a[1].revenue).map(([name, x]) => [name, x.qty, x.orders, x.revenue]),
  ]);
}

function exportCustomers(rows: AdminOrder[], period: string) {
  const people = new Map<string, { name: string; phone: string; email: string; orders: number; spent: number; last: string }>();
  rows.filter(isValid).forEach((o) => {
    const key = o.customer.phone || o.customer.email || o.customer.name;
    const x = people.get(key) ?? { ...o.customer, orders: 0, spent: 0, last: o.createdAt };
    x.orders += 1; x.spent += o.total; if (o.createdAt > x.last) x.last = o.createdAt;
    people.set(key, x);
  });
  downloadCsv(`delight-customers-${period}-${today()}.csv`, [
    ['Customer', 'Phone', 'Email', 'Orders', 'Total spent (NPR)', 'Last order'],
    ...[...people.values()].sort((a, b) => b.spent - a.spent).map((x) => [x.name, x.phone, x.email, x.orders, x.spent, fmtDate(x.last)]),
  ]);
}

const reports: Record<string, (rows: AdminOrder[], period: string) => void> = { sales: exportSales, products: exportProducts, customers: exportCustomers };

function Page() {
  const navigate = useNavigate();
  const { rows: everything, live, loading } = useAdminData<AdminOrder>(() => fetchAdminOrders(1000));
  const [period, setPeriod] = useState('30d');
  const [metric, setMetric] = useState('revenue');
  const [reportType, setReportType] = useState('sales');
  const [reportPeriod, setReportPeriod] = useState('30d');

  const all = useMemo(() => everything.filter((o) => inPeriod(o.createdAt, period)), [everything, period]);
  const valid = all.filter(isValid);
  const revenue = valid.reduce((s, o) => s + o.total, 0);
  const customers = new Set(all.map((o) => o.customer.phone || o.customer.email || o.customer.name)).size;

  const trend = useMemo(() => {
    const days = daysIn(period, everything);
    const midnight = new Date(); midnight.setHours(0, 0, 0, 0);
    const first = midnight.getTime() - (days - 1) * DAY;
    const buckets = Array.from({ length: days }, (_, k) => ({ v: 0, d: new Date(first + k * DAY).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) }));
    for (const o of valid) {
      const k = Math.floor((new Date(o.createdAt).getTime() - first) / DAY);
      if (k >= 0 && k < days) buckets[k]!.v += metric === 'orders' ? 1 : o.total;
    }
    return buckets;
  }, [valid, period, metric, everything]);

  const groups: Array<[string, (o: AdminOrder) => boolean, string]> = [['Delivered', (o) => o.status === 'DELIVERED', '#0a8a5b'], ['Out for Delivery', (o) => o.status === 'OUT_FOR_DELIVERY', '#2f80ed'], ['Processing', (o) => ['CONFIRMED', 'PREPARING', 'READY_FOR_DELIVERY'].includes(o.status), '#f5c342'], ['Pending', (o) => o.status === 'PENDING', '#f59f0b'], ['Cancelled', (o) => o.status === 'CANCELLED' || o.status === 'FAILED', '#e3101a']];
  const dist = groups.map(([n, fn, c]) => { const v = all.filter(fn).length; return { n, v, p: all.length ? `${((v / all.length) * 100).toFixed(1)}%` : '0%', c }; });
  const sold = new Map<string, { qty: number; price: number; image: string }>();
  valid.forEach((o) => o.items.forEach((i) => { const x = sold.get(i.name) ?? { qty: 0, price: i.unitPrice, image: i.image }; x.qty += i.quantity; sold.set(i.name, x); }));
  const top = [...sold.entries()].sort((a, b) => b[1].qty - a[1].qty).slice(0, 5);
  const recent = all.slice(0, 5);
  const money = (v: number) => (metric === 'orders' ? String(v) : npr(v));

  return (
    <div>
      <PageHeader title="Reports & Analytics" subtitle="Get insights into your business performance and make better decisions." badge={<DataBadge live={live} loading={loading} />} actions={<><PeriodSelect value={period} onChange={setPeriod} className="w-[170px]" /><PrimaryAction icon={Download} onClick={() => exportSales(all, period)}>Export Report</PrimaryAction></>} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={ChartColumn} tone="green" label="Total Revenue" value={npr(revenue)} note={`${periodName(period).toLowerCase()}, excl. cancelled`} />
        <StatCard icon={ShoppingCart} tone="blue" label="Total Orders" value={String(all.length)} note={periodName(period).toLowerCase()} />
        <StatCard icon={Users} tone="amber" label="Customers" value={String(customers)} note="who ordered" />
        <StatCard icon={Box} tone="purple" label="Avg. Order Value" value={npr(valid.length ? Math.round(revenue / valid.length) : 0)} filled={false} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.75fr)_360px]">
        <Card className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex gap-3"><ChartColumn className="size-6 text-[#0a8a5b]" /><span><b className="block text-[17px] font-bold text-navy">Sales Overview</b><span className="text-[13px] text-slate">{metric === 'orders' ? 'Orders per day' : 'Revenue per day'} · {periodName(period)}</span></span></div>
            <FilterSelect label="Chart metric" value={metric} onChange={setMetric} options={[['revenue', 'Revenue'], ['orders', 'Orders']]} className="w-[118px]" />
          </div>
          <div className="mt-4 h-[210px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ left: 4, right: 8, top: 10 }}>
                <defs><linearGradient id="rep" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0a8a5b" stopOpacity={0.28} /><stop offset="100%" stopColor="#0a8a5b" stopOpacity={0.03} /></linearGradient></defs>
                <CartesianGrid vertical={false} stroke="#eef1f4" />
                <XAxis dataKey="d" interval="preserveStartEnd" minTickGap={28} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#6b7385' }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#6b7385' }} tickFormatter={(v: number) => (metric === 'orders' ? String(v) : v ? `NPR ${v >= 1000 ? `${Math.round(v / 1000)}K` : v}` : '0')} width={74} />
                <Tooltip formatter={(v) => money(Number(v))} contentStyle={{ background: '#13213a', border: 0, borderRadius: 6, color: '#fff' }} itemStyle={{ color: '#fff' }} />
                <Area type="linear" dataKey="v" name={metric === 'orders' ? 'Orders' : 'Revenue'} stroke="#0a8a5b" strokeWidth={2} fill="url(#rep)" dot={trend.length <= 31 ? { r: 3, fill: '#0a8a5b', strokeWidth: 0 } : false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="flex items-center gap-3 text-[17px] font-bold text-navy"><Hexagon className="size-6 text-[#0a8a5b]" /> Order Status Distribution</h2>
          <div className="mt-4 flex items-center gap-3">
            <div className="relative size-[150px] shrink-0">
              <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={dist.filter((d) => d.v)} dataKey="v" innerRadius={50} outerRadius={72} startAngle={90} endAngle={-270} stroke="none">{dist.filter((d) => d.v).map((d) => <Cell key={d.n} fill={d.c} />)}</Pie></PieChart></ResponsiveContainer>
              <span className="absolute inset-0 grid place-content-center text-center"><b className="text-[22px] font-extrabold text-navy">{all.length}</b><span className="text-[12.5px] text-slate">Total Orders</span></span>
            </div>
            <ul className="min-w-0 flex-1 space-y-3 text-[12px]">
              {dist.map((d) => <li key={d.n} className="flex items-center gap-2 whitespace-nowrap"><span className="size-3 rounded-full" style={{ background: d.c }} /><span className="flex-1 text-navy">{d.n}</span><span className="text-slate">{d.v} ({d.p})</span></li>)}
            </ul>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex gap-3"><Trophy className="size-6 text-[#0a8a5b]" /><span><b className="block text-[17px] font-bold text-navy">Top Products</b><span className="text-[13px] text-slate">Most units sold · {periodName(period)}</span></span></div>
            <Link to="/admin/products" className="text-[13.5px] font-medium text-[#2f73d9]">View All</Link>
          </div>
          <ul className="mt-3 space-y-2">
            {top.map(([name, x]) => (
              <li key={name} className="flex items-center gap-3">
                {x.image ? <img src={x.image} alt="" className="size-11 object-contain" /> : <span className="size-11 rounded bg-[#f1f4f7]" />}
                <span className="flex-1 leading-tight"><span className="block text-[14px] text-navy">{name}</span><span className="text-[13px] text-slate">{x.qty} sold</span></span>
                <span className="text-[14px] text-navy">{npr(x.price)}</span>
              </li>
            ))}
            {!top.length && <li className="py-6 text-center text-[13px] text-slate">No sales in this period yet.</li>}
          </ul>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <div className="flex items-start justify-between px-5 py-4">
            <div className="flex gap-3"><Clock className="size-7 text-[#0a8a5b]" /><span><b className="block text-[17px] font-bold text-navy">Recent Orders</b><span className="text-[13px] text-slate">Latest orders from your store</span></span></div>
            <Link to="/admin/orders" className="text-[14px] font-medium text-[#2f73d9]">View All</Link>
          </div>
          <Table head={['#', 'Order ID', 'Customer', 'Amount', 'Status', 'Date & Time', 'Actions']}>
            {recent.map((o, i) => {
              const st = o.status === 'PENDING' ? 'Pending' : statusLabel(o.status);
              const open = () => void navigate({ to: '/admin/orders', search: { id: o.id } });
              return (
                <Tr key={o.id} onClick={open}>
                  <Td>{i + 1}</Td>
                  <Td>{o.number}</Td>
                  <Td><span className="flex items-center gap-3 whitespace-nowrap"><Avatar name={o.customer.name} />{o.customer.name}</span></Td>
                  <Td className="whitespace-nowrap">{npr(o.total)}</Td>
                  <Td>{statusTone[st] ? <Badge tone={statusTone[st]!}>{st}</Badge> : <Status value={st} />}</Td>
                  <Td className="whitespace-nowrap text-slate">{fmtDate(o.createdAt)}, {fmtTime(o.createdAt)}</Td>
                  <Td><IconBtn icon={Eye} label="View order" onClick={open} /></Td>
                </Tr>
              );
            })}
          </Table>
          {!recent.length && <p className="px-5 py-10 text-center text-[14px] text-slate">{loading ? 'Loading orders…' : 'No orders in this period yet.'}</p>}
        </Card>
        <Card className="p-5">
          <div className="flex gap-3"><FileText className="size-7 text-[#0a8a5b]" /><span><b className="block text-[17px] font-bold text-navy">Generate Report</b><span className="text-[13px] text-slate">Download detailed reports</span></span></div>
          <div className="mt-4 space-y-3.5">
            <Field label="Report Type"><FilterSelect label="Report type" value={reportType} onChange={setReportType} options={[['sales', 'Sales Report (every order)'], ['products', 'Product Sales'], ['customers', 'Customer Summary']]} className="w-full" /></Field>
            <Field label="Date Range"><PeriodSelect value={reportPeriod} onChange={setReportPeriod} className="w-full" /></Field>
            <Field label="Format"><span className="flex h-10 items-center rounded-lg border border-line bg-page px-3 text-[13px] text-slate">CSV (opens in Excel)</span></Field>
          </div>
          <button onClick={() => reports[reportType]!(everything.filter((o) => inPeriod(o.createdAt, reportPeriod)), reportPeriod)} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#077a52] text-[15px] font-semibold text-white hover:bg-[#066a47]"><Download className="size-5" /> Generate Report</button>
        </Card>
      </div>
    </div>
  );
}
