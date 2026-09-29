import { createFileRoute } from '@tanstack/react-router';
import { ArrowUpRight, ChevronDown, ChevronRight, CircleX, Clock, CreditCard, Download, Ellipsis, Eye, HandCoins, RotateCcw, Settings, Wallet } from 'lucide-react';
import { useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { Avatar, Badge, Card, Checkbox, DateRange, FilterBar, FiltersButton, IconBtn, PageHeader, Pagination, Panel, PanelTitle, SearchBox, SelectBox, StatCard, Table, Tabs, Td, Tr, WithPanel } from '@/components/delight/admin-ui';
import { npr, people } from '@/components/delight/admin-data';
import { asset } from '@/lib/assets';

export const Route = createFileRoute('/admin/payments')({
  head: () => ({ meta: [{ title: 'Payments — Delight Admin' }, { name: 'description', content: 'Track payments, transactions and settlements.' }, { property: 'og:title', content: 'Payments — Delight Admin' }, { property: 'og:description', content: 'Payment management.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: Page,
});

const methodIcon: Record<string, string> = { eSewa: 'pay-esewa', Khalti: 'pay-khalti', 'Card (Visa)': 'pay-visa', 'Card (Mastercard)': 'pay-mc', 'Cash on Delivery': 'pay-cod', 'Connect IPS': 'pay-ips' };
const rows = [
  ['TXN001248', '#10251', people.sujan, 1250, 'eSewa', 'Success', '27 Sep 2026', '10:24 AM'],
  ['TXN001247', '#10250', people.aarati, 680, 'Khalti', 'Success', '26 Sep 2026', '04:15 PM'],
  ['TXN001246', '#10249', people.bikash, 2450, 'Card (Visa)', 'Pending', '25 Sep 2026', '01:20 PM'],
  ['TXN001245', '#10248', people.sangita, 450, 'Cash on Delivery', 'Success', '24 Sep 2026', '11:05 AM'],
  ['TXN001244', '#10247', people.ramesh, 3200, 'eSewa', 'Failed', '24 Sep 2026', '09:40 AM'],
  ['TXN001243', '#10246', people.sita, 890, 'Khalti', 'Success', '23 Sep 2026', '06:12 PM'],
  ['TXN001242', '#10245', people.kiran, 4320, 'Card (Mastercard)', 'Success', '22 Sep 2026', '03:18 PM'],
  ['TXN001241', '#10244', people.prabin, 620, 'Connect IPS', 'Pending', '21 Sep 2026', '01:00 PM'],
  ['TXN001240', '#10243', people.anjali, 350, 'eSewa', 'Success', '20 Sep 2026', '12:45 PM'],
  ['TXN001239', '#10242', people.dipesh, 1980, 'Khalti', 'Success', '19 Sep 2026', '10:30 AM'],
] as const;
const revenue = [18, 10, 30, 42, 36, 50, 38, 58, 45, 72, 55, 80, 62, 85, 70, 100, 95, 110, 104, 128, 118, 140, 125, 160].map((v, i) => ({ i, v: v * 1000, d: ['Sep 21', '', '', '', '', 'Sep 28', '', '', '', '', 'Oct 05', '', '', '', '', 'Oct 12', '', '', '', '', 'Oct 19', '', '', ''][i] }));
const methods = [['pay-esewa', 'eSewa', 42, '#22b14c'], ['pay-khalti', 'Khalti', 28, '#8b5cf6'], ['pay-visa', 'Card (Visa/Mastercard)', 18, '#2f80ed'], ['pay-cod', 'Cash on Delivery', 8, '#f5a623'], ['pay-ips', 'Connect IPS', 4, '#e3101a']] as const;

function Page() {
  const [tab, setTab] = useState(0);
  return (
    <div>
      <PageHeader title="Payments" subtitle="Track and manage all payments, transactions and settlements in one place." />
      <WithPanel
        main={
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard icon={Wallet} tone="green" label="Total Payments" value="NPR 865,420" delta="+18%" filled={false} />
              <StatCard icon={CreditCard} tone="blue" label="Successful Payments" value="1,186" delta="+22%" filled={false} />
              <StatCard icon={Clock} tone="amber" label="Pending Payments" value="24" delta="-20%" dir="down" filled={false} />
              <StatCard icon={CircleX} tone="red" label="Failed Payments" value="18" delta="+5%" dir="down" />
            </div>
            <Card className="mt-4">
              <Tabs items={['All Transactions (1,228)', 'Successful (1,186)', 'Pending (24)', 'Failed (18)', 'Refunded (12)']} active={tab} onChange={setTab} />
              <FilterBar>
                <SearchBox placeholder="Search by order ID, customer name or transaction ID..." className="w-[284px]" />
                <SelectBox label="All Payment Methods" className="w-[136px]" />
                <SelectBox label="All Status" className="w-[112px]" />
                <DateRange />
                <FiltersButton />
              </FilterBar>
              <Table head={[<Checkbox key="c" />, '#', 'Transaction ID', 'Order ID', 'Customer', 'Amount', 'Payment Method', 'Status', 'Date & Time', 'Actions']}>
                {rows.map(([txn, order, who, amt, method, st, date, time], i) => (
                  <Tr key={txn}>
                    <Td><Checkbox /></Td>
                    <Td>{i + 1}</Td>
                    <Td>{txn}</Td>
                    <Td>{order}</Td>
                    <Td><span className="flex items-center gap-2.5 whitespace-nowrap"><Avatar src={who.avatar} name={who.name} size="size-8" />{who.name}</span></Td>
                    <Td className="whitespace-nowrap">{npr(amt)}</Td>
                    <Td><span className="flex items-center gap-2 whitespace-nowrap text-[12.5px]"><img src={asset(methodIcon[method]!)} alt="" className="h-5 w-6 object-contain" />{method}</span></Td>
                    <Td><Badge tone={st === 'Success' ? 'green' : st === 'Pending' ? 'amber' : 'red'}>{st}</Badge></Td>
                    <Td className="whitespace-nowrap leading-tight text-slate">{date}<br />{time}</Td>
                    <Td><span className="flex gap-2"><IconBtn icon={Eye} label="View" /><IconBtn icon={Ellipsis} label="More" /></span></Td>
                  </Tr>
                ))}
              </Table>
              <Pagination text="Showing 1-10 of 1,228 transactions" pages={[1, 2, 3, 4, 5, '…', 123]} />
            </Card>
          </>
        }
        panel={
          <div className="space-y-4">
            <Panel>
              <div className="flex items-center justify-between gap-2"><h2 className="whitespace-nowrap text-[17px] font-bold text-navy">Revenue Overview</h2><button className="flex h-9 items-center gap-2 whitespace-nowrap rounded-lg border border-line px-3 text-[13px] text-navy">Last 30 Days <ChevronDown className="size-4" /></button></div>
              <p className="mt-2 text-[26px] font-extrabold text-navy">NPR 865,420</p>
              <p className="flex items-center gap-1 text-[14px] font-semibold text-[#0a8a5b]"><ArrowUpRight className="size-4" /> 18% <span className="font-normal text-navy">vs previous period</span></p>
              <div className="mt-2 h-[140px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenue} margin={{ left: -22, right: 4, top: 8 }}>
                    <defs><linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0a8a5b" stopOpacity={0.25} /><stop offset="100%" stopColor="#0a8a5b" stopOpacity={0.02} /></linearGradient></defs>
                    <CartesianGrid vertical={false} stroke="#eef1f4" />
                    <XAxis dataKey="d" tickLine={false} axisLine={false} interval={0} tick={{ fontSize: 11, fill: '#6b7385' }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#6b7385' }} ticks={[0, 50000, 100000, 150000]} tickFormatter={(v: number) => (v ? `${v / 1000}K` : '0')} />
                    <Area type="monotone" dataKey="v" stroke="#0a8a5b" strokeWidth={2} fill="url(#rev)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Panel>
            <Panel>
              <PanelTitle>Payment Methods</PanelTitle>
              <ul className="space-y-3.5">
                {methods.map(([icon, name, pct, color]) => (
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
              {([[HandCoins, 'Settle Payments', 'Manage settlements with payment partners'], [RotateCcw, 'Refund Management', 'Process customer refunds'], [Settings, 'Payment Settings', 'Configure payment methods'], [Download, 'Download Reports', 'Export payment reports (CSV, PDF)']] as const).map(([Icon, a, b]) => (
                <button key={a} className="mb-2.5 flex w-full items-center gap-3 rounded-lg border border-line px-4 py-3 text-left last:mb-0">
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
