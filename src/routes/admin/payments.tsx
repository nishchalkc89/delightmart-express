import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ArrowDownRight, ArrowUpRight, ChevronRight, CircleX, Clock, CreditCard, Download, Eye, RotateCcw, Settings, Wallet } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { Avatar, Badge, Card, DataBadge, FilterBar, FilterSelect, IconBtn, inPeriod, PageHeader, Pagination, Panel, PanelTitle, PeriodSelect, SearchBox, StatCard, Table, Tabs, Td, Tr, usePaged, WithPanel } from '@/components/delight/admin-ui';
import { npr } from '@/components/delight/admin-data';
import { asset } from '@/lib/assets';
import { fmtDate, fmtTime, useAdminData } from '@/services/admin';
import { fetchPayments, type PaymentRow } from '@/services/admin-actions';

export const Route = createFileRoute('/admin/payments')({
  head: () => ({ meta: [{ title: 'Payments — Delight Admin' }, { name: 'description', content: 'Track payments, transactions and settlements.' }, { property: 'og:title', content: 'Payments — Delight Admin' }, { property: 'og:description', content: 'Payment management.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: Page,
});

const methodIcon: Record<string, string> = { COD: 'pay-cod', ESEWA: 'pay-esewa', KHALTI: 'pay-khalti', CARD: 'pay-visa',  eSewa: 'pay-esewa', Khalti: 'pay-khalti', 'Card (Visa)': 'pay-visa', 'Card (Mastercard)': 'pay-mc', 'Cash on Delivery': 'pay-cod', 'Connect IPS': 'pay-ips' };
const providerName: Record<string, string> = { COD: 'Cash on Delivery', ESEWA: 'eSewa', KHALTI: 'Khalti', CARD: 'Card' };
const statusText = (s: string) => (s === 'PAID' ? 'Success' : s === 'PENDING' ? 'Pending' : s === 'FAILED' ? 'Failed' : s === 'REFUNDED' ? 'Refunded' : s);

function Page() {
  const { rows: list, live, loading } = useAdminData<PaymentRow>(fetchPayments);
  const [tab, setTab] = useState(0);
  const [query, setQuery] = useState('');
  const [method, setMethod] = useState('all');
  const [period, setPeriod] = useState('all');
  const [days, setDays] = useState(30);
  const navigate = useNavigate();
  const filters = [() => true, (p: PaymentRow) => p.status === 'PAID', (p: PaymentRow) => p.status === 'PENDING', (p: PaymentRow) => p.status === 'FAILED', (p: PaymentRow) => p.status === 'REFUNDED' || p.status === 'PARTIAL_REFUND'];
  const shown = list.filter((p) => filters[tab]!(p) && `${p.orderNumber} ${p.customer} ${p.txn ?? ''} ${p.id}`.toLowerCase().includes(query.toLowerCase())
    && (method === 'all' || p.provider === method) && inPeriod(p.createdAt, period));
  const pg = usePaged(shown, 20);
  // Paid revenue per day for the chart, plus the same-length period before it for the change %.
  const chart = useMemo(() => {
    const dayMs = 86_400_000;
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const first = start.getTime() - (days - 1) * dayMs;
    const buckets = Array.from({ length: days }, (_, i) => ({ i, v: 0, d: new Date(first + i * dayMs).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) }));
    let prev = 0;
    for (const p of list) {
      if (p.status !== 'PAID') continue;
      const t = new Date(p.createdAt).getTime();
      const k = Math.floor((t - first) / dayMs);
      if (k >= 0 && k < days) buckets[k]!.v += p.amount;
      else if (k < 0 && k >= -days) prev += p.amount;
    }
    const total = buckets.reduce((s, b) => s + b.v, 0);
    return { buckets, total, change: prev ? Math.round(((total - prev) / prev) * 100) : null };
  }, [list, days]);
  const count = (i: number) => list.filter(filters[i]!).length;
  const paidTotal = list.filter((p) => p.status === 'PAID').reduce((s, p) => s + p.amount, 0);
  const byProvider = Object.entries(list.reduce<Record<string, number>>((acc, p) => { acc[p.provider] = (acc[p.provider] ?? 0) + 1; return acc; }, {}));
  const liveMethods = byProvider.map(([prov, c]) => [methodIcon[prov] ?? 'pay-cod', providerName[prov] ?? prov, Math.round((c / Math.max(1, list.length)) * 100), prov === 'COD' ? '#f5a623' : prov === 'ESEWA' ? '#22b14c' : prov === 'KHALTI' ? '#8b5cf6' : '#2f80ed'] as const);
  const when = (p: PaymentRow) => ([fmtDate(p.createdAt), fmtTime(p.createdAt)]);
  function exportCsv() {
    const lines = [['Transaction', 'Order', 'Customer', 'Amount', 'Method', 'Status', 'Date'], ...shown.map((p) => [p.txn ?? p.id, p.orderNumber, p.customer, String(p.amount), providerName[p.provider] ?? p.provider, statusText(p.status), p.createdAt])];
    const url = URL.createObjectURL(new Blob(['\ufeff', lines.map((r) => r.map((c) => `"${c.replaceAll('"', '""')}"`).join(',')).join('\r\n')], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = 'delight-payments.csv'; a.click(); URL.revokeObjectURL(url);
  }
  return (
    <div>
      <PageHeader title="Payments" subtitle="Track and manage all payments, transactions and settlements in one place." badge={<DataBadge live={live} loading={loading} />} />
      <WithPanel
        main={
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard icon={Wallet} tone="green" label="Total Payments" value={npr(paidTotal)} note={'collected'} filled={false} />
              <StatCard icon={CreditCard} tone="blue" label="Successful Payments" value={String(count(1))} filled={false} />
              <StatCard icon={Clock} tone="amber" label="Pending Payments" value={String(count(2))} dir="down" filled={false} />
              <StatCard icon={CircleX} tone="red" label="Failed Payments" value={String(count(3))} dir="down" />
            </div>
            <Card className="mt-4">
              <Tabs items={['All Transactions', 'Successful', 'Pending', 'Failed', 'Refunded'].map((t, i) => `${t} (${count(i)})`)} active={tab} onChange={(i) => { setTab(i); pg.reset(); }} />
              <FilterBar>
                <SearchBox placeholder="Search by order ID, customer name or transaction ID..." value={query} onChange={setQuery} className="w-[284px]" />
                <FilterSelect label="Payment method" value={method} onChange={(v) => { setMethod(v); pg.reset(); }} options={[['all', 'All Payment Methods'], ...Object.entries(providerName)]} className="w-[180px]" />
                <PeriodSelect value={period} onChange={(v) => { setPeriod(v); pg.reset(); }} />
              </FilterBar>
              <Table head={['#', 'Transaction ID', 'Order ID', 'Customer', 'Amount', 'Payment Method', 'Status', 'Date & Time', 'Actions']}>
                {pg.shown.map((p, i) => {
                  const st = statusText(p.status);
                  const method = providerName[p.provider] ?? p.provider;
                  const [date, time] = when(p);
                  return (
                  <Tr key={p.id}>
                    <Td>{pg.from + i}</Td>
                    <Td className="whitespace-nowrap">{p.txn ?? `TXN-${p.id.slice(0, 6).toUpperCase()}`}</Td>
                    <Td className="whitespace-nowrap">{p.orderNumber}</Td>
                    <Td><span className="flex items-center gap-2.5 whitespace-nowrap"><Avatar name={p.customer} size="size-8" />{p.customer}</span></Td>
                    <Td className="whitespace-nowrap">{npr(p.amount)}</Td>
                    <Td><span className="flex items-center gap-2 whitespace-nowrap text-[12.5px]"><img src={asset(methodIcon[p.provider] ?? 'pay-cod')} alt="" className="h-5 w-6 object-contain" />{method}</span></Td>
                    <Td><Badge tone={st === 'Success' ? 'green' : st === 'Pending' ? 'amber' : 'red'}>{st}</Badge></Td>
                    <Td className="whitespace-nowrap leading-tight text-slate">{date}<br />{time}</Td>
                    <Td><span className="flex gap-2"><IconBtn icon={Eye} label="View order" onClick={() => void navigate({ to: '/admin/orders', search: { q: p.orderNumber } })} /></span></Td>
                  </Tr>
                  );
                })}
              </Table>
              {!shown.length && <p className="px-5 py-10 text-center text-[14px] text-slate">{list.length ? 'No payments match these filters.' : 'No payments yet.'}</p>}
              <Pagination text={`Showing ${pg.from}-${pg.to} of ${pg.total} transactions`} current={pg.page} pageCount={pg.pageCount} onPage={pg.setPage} />
            </Card>
          </>
        }
        panel={
          <div className="space-y-4">
            <Panel>
              <div className="flex items-center justify-between gap-2"><h2 className="whitespace-nowrap text-[17px] font-bold text-navy">Revenue Overview</h2><FilterSelect label="Chart period" value={String(days)} onChange={(v) => setDays(Number(v))} options={[['7', 'Last 7 Days'], ['30', 'Last 30 Days'], ['90', 'Last 90 Days']]} className="w-[140px]" /></div>
              <p className="mt-2 text-[26px] font-extrabold text-navy">{npr(chart.total)}</p>
              {chart.change === null
                ? <p className="text-[13px] text-slate">Paid in the last {days} days</p>
                : <p className={`flex items-center gap-1 text-[14px] font-semibold ${chart.change >= 0 ? 'text-[#0a8a5b]' : 'text-[#e3101a]'}`}>{chart.change >= 0 ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />} {Math.abs(chart.change)}% <span className="font-normal text-navy">vs previous {days} days</span></p>}
              <div className="mt-2 h-[140px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chart.buckets} margin={{ left: -22, right: 4, top: 8 }}>
                    <defs><linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0a8a5b" stopOpacity={0.25} /><stop offset="100%" stopColor="#0a8a5b" stopOpacity={0.02} /></linearGradient></defs>
                    <CartesianGrid vertical={false} stroke="#eef1f4" />
                    <XAxis dataKey="d" tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} tick={{ fontSize: 11, fill: '#6b7385' }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#6b7385' }} tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}K` : String(v))} />
                    <Area type="monotone" dataKey="v" stroke="#0a8a5b" strokeWidth={2} fill="url(#rev)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Panel>
            <Panel>
              <PanelTitle>Payment Methods</PanelTitle>
              <ul className="space-y-3.5">
                {liveMethods.map(([icon, name, pct, color]) => (
                  <li key={name} className="flex items-center gap-3">
                    <img src={asset(icon)} alt="" className="h-6 w-7 object-contain" />
                    <span className="w-[96px] text-[13px] leading-tight text-navy">{name}</span>
                    <span className="h-1.5 flex-1 rounded-full bg-[#eef1f4]"><span className="block h-full rounded-full" style={{ width: `${pct * 1.6}%`, background: color }} /></span>
                    <span className="w-9 text-right text-[13px] text-navy">{pct}%</span>
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel>
              <PanelTitle>Quick Actions</PanelTitle>
              {([[Clock, 'Pending Payments', 'Cash on delivery not yet collected', () => setTab(2)], [RotateCcw, 'Refunds', 'Payments that were refunded', () => setTab(4)], [Settings, 'Payment Settings', 'Delivery fee, free delivery and store details', () => void navigate({ to: '/admin/settings' })], [Download, 'Download Report', 'Export the transactions shown as CSV', exportCsv]] as const).map(([Icon, a, b, go]) => (
                <button key={a} onClick={go} className="mb-2.5 flex w-full items-center gap-3 rounded-lg border border-line px-4 py-3 text-left last:mb-0 hover:bg-page">
                  <Icon className="size-5 shrink-0 text-navy" />
                  <span className="min-w-0 flex-1"><b className="block text-[14px] font-medium text-navy">{a}</b><span className="text-[11.5px] text-slate">{b}</span></span>
                  <ChevronRight className="size-4 text-slate" />
                </button>
              ))}
            </Panel>
          </div>
        }
      />
    </div>
  );
}
