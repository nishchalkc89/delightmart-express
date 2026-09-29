import { createFileRoute } from '@tanstack/react-router';
import { CalendarDays, ChartColumn, ChevronDown, Clock, Download, Eye, FileText, Hexagon, ShoppingCart, Trophy, Users, Box } from 'lucide-react';
import { toast } from 'sonner';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Avatar, Card, Field, IconBtn, PageHeader, PrimaryAction, SelectBox, StatCard, Status, Table, Td, Tr, type BadgeTone, Badge } from '@/components/delight/admin-ui';
import { npr, people } from '@/components/delight/admin-data';
import { asset } from '@/lib/assets';

export const Route = createFileRoute('/admin/reports')({
  head: () => ({ meta: [{ title: 'Reports & Analytics — Delight Admin' }, { name: 'description', content: 'Business performance insights.' }, { property: 'og:title', content: 'Reports & Analytics — Delight Admin' }, { property: 'og:description', content: 'Sales and order analytics.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: Page,
});

const trend = [10, 22, 30, 28, 40, 52, 48, 44, 60, 55, 52, 70, 90, 110, 125, 150, 165, 158, 170, 180, 168, 185, 172, 200].map((v, i) => ({ v: v * 820, d: ['Sep 21', '', '', '', '', '', 'Sep 28', '', '', '', '', '', 'Oct 05', '', '', '', '', '', 'Oct 12', '', '', '', '', 'Oct 19'][i] }));
const dist = [
  { n: 'Delivered', v: 258, p: '20.7%', c: '#0a8a5b' },
  { n: 'Out for Delivery', v: 72, p: '5.8%', c: '#2f80ed' },
  { n: 'Processing', v: 186, p: '14.9%', c: '#f5c342' },
  { n: 'Pending', v: 624, p: '50.0%', c: '#f59f0b' },
  { n: 'Cancelled', v: 108, p: '8.6%', c: '#e3101a' },
];
const top = [['top-rice', 'Daawat Basmati Rice 5kg', 342, 850], ['top-surf', 'Surf Excel 1kg', 298, 320], ['top-colgate', 'Colgate Toothpaste 100g', 276, 80], ['top-sunsilk', 'Sunsilk Shampoo 180ml', 198, 250], ['top-maggi', 'Maggi Noodles 70g', 185, 60]] as const;
const recent = [['#10251', people.sujan, 1250, 'Delivered', '27 Sep 2026, 10:24 AM'], ['#10250', people.aarati, 680, 'Out for Delivery', '26 Sep 2026, 04:15 PM'], ['#10249', people.bikash, 2450, 'Processing', '25 Sep 2026, 01:20 PM'], ['#10248', people.sangita, 450, 'Delivered', '24 Sep 2026, 11:05 AM'], ['#10247', people.ramesh, 3200, 'Pending', '24 Sep 2026, 09:40 AM']] as const;
const statusTone: Record<string, BadgeTone> = { Delivered: 'green', 'Out for Delivery': 'blue', Processing: 'amber', Pending: 'red' };

function Page() {
  return (
    <div>
      <PageHeader title="Reports & Analytics" subtitle="Get insights into your business performance and make better decisions." actions={<><button className="flex h-[44px] items-center gap-3 rounded-lg border border-line bg-white px-4 text-[15px] text-navy"><CalendarDays className="size-5" /> 21 Sep 2026 - 21 Oct 2026 <ChevronDown className="ml-4 size-4 text-slate" /></button><PrimaryAction icon={Download} onClick={() => toast.success('Report exported')}>Export Report</PrimaryAction></>} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={ChartColumn} tone="green" label="Total Revenue" value="NPR 865,420" delta="+18%" />
        <StatCard icon={ShoppingCart} tone="blue" label="Total Orders" value="1,248" delta="+12%" />
        <StatCard icon={Users} tone="amber" label="New Customers" value="346" delta="+25%" />
        <StatCard icon={Box} tone="purple" label="Avg. Order Value" value="NPR 693" delta="+6%" filled={false} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.75fr)_360px]">
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex gap-3"><ChartColumn className="size-6 text-[#0a8a5b]" /><span><b className="block text-[17px] font-bold text-navy">Sales Overview</b><span className="text-[13px] text-slate">Total revenue for the selected period</span></span></div>
            <SelectBox label="Revenue" className="w-[108px]" />
          </div>
          <div className="mt-4 h-[210px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ left: 4, right: 8, top: 10 }}>
                <defs><linearGradient id="rep" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0a8a5b" stopOpacity={0.28} /><stop offset="100%" stopColor="#0a8a5b" stopOpacity={0.03} /></linearGradient></defs>
                <CartesianGrid vertical={false} stroke="#eef1f4" />
                <XAxis dataKey="d" interval={0} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#6b7385' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#6b7385' }} ticks={[0, 50000, 100000, 150000, 200000]} tickFormatter={(v: number) => (v ? `NPR ${v / 1000}K` : '0')} width={74} />
                <Tooltip formatter={(v) => npr(Number(v))} contentStyle={{ background: '#13213a', border: 0, borderRadius: 6, color: '#fff' }} itemStyle={{ color: '#fff' }} />
                <Area type="linear" dataKey="v" stroke="#0a8a5b" strokeWidth={2} fill="url(#rep)" dot={{ r: 3, fill: '#0a8a5b', strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="flex items-center gap-3 text-[17px] font-bold text-navy"><Hexagon className="size-6 text-[#0a8a5b]" /> Order Status Distribution</h2>
          <div className="mt-4 flex items-center gap-3">
            <div className="relative size-[150px] shrink-0">
              <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={dist} dataKey="v" innerRadius={50} outerRadius={72} startAngle={90} endAngle={-270} stroke="none">{dist.map((d) => <Cell key={d.n} fill={d.c} />)}</Pie></PieChart></ResponsiveContainer>
              <span className="absolute inset-0 grid place-content-center text-center"><b className="text-[22px] font-extrabold text-navy">1,248</b><span className="text-[12.5px] text-slate">Total Orders</span></span>
            </div>
            <ul className="min-w-0 flex-1 space-y-3 text-[12px]">
              {dist.map((d) => <li key={d.n} className="flex items-center gap-2 whitespace-nowrap"><span className="size-3 rounded-full" style={{ background: d.c }} /><span className="flex-1 text-navy">{d.n}</span><span className="text-slate">{d.v} ({d.p})</span></li>)}
            </ul>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex gap-3"><Trophy className="size-6 text-[#0a8a5b]" /><span><b className="block text-[17px] font-bold text-navy">Top Products</b><span className="text-[13px] text-slate">Best performing products</span></span></div>
            <button className="text-[13.5px] font-medium text-[#2f73d9]">View All</button>
          </div>
          <ul className="mt-3 space-y-2">
            {top.map(([img, name, sold, price]) => (
              <li key={name} className="flex items-center gap-3">
                <img src={asset(img)} alt="" className="size-11 object-contain" />
                <span className="flex-1 leading-tight"><span className="block text-[14px] text-navy">{name}</span><span className="text-[13px] text-slate">{sold} sold</span></span>
                <span className="text-[14px] text-navy">{npr(price)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <div className="flex items-start justify-between px-5 py-4">
            <div className="flex gap-3"><Clock className="size-7 text-[#0a8a5b]" /><span><b className="block text-[17px] font-bold text-navy">Recent Orders</b><span className="text-[13px] text-slate">Latest orders from your store</span></span></div>
            <button className="text-[14px] font-medium text-[#2f73d9]">View All</button>
          </div>
          <Table head={['#', 'Order ID', 'Customer', 'Amount', 'Status', 'Date & Time', 'Actions']}>
            {recent.map(([id, who, amt, st, dt], i) => (
              <Tr key={id}>
                <Td>{i + 1}</Td>
                <Td>{id}</Td>
                <Td><span className="flex items-center gap-3 whitespace-nowrap"><Avatar src={who.avatar} name={who.name} />{who.name}</span></Td>
                <Td className="whitespace-nowrap">{npr(amt)}</Td>
                <Td>{statusTone[st] ? <Badge tone={statusTone[st]!}>{st}</Badge> : <Status value={st} />}</Td>
                <Td className="whitespace-nowrap text-slate">{dt}</Td>
                <Td><IconBtn icon={Eye} label="View order" /></Td>
              </Tr>
            ))}
          </Table>
        </Card>
        <Card className="p-5">
          <div className="flex gap-3"><FileText className="size-7 text-[#0a8a5b]" /><span><b className="block text-[17px] font-bold text-navy">Generate Report</b><span className="text-[13px] text-slate">Download detailed reports</span></span></div>
          <div className="mt-4 space-y-3.5">
            <Field label="Report Type"><SelectBox label="Sales Report" className="w-full" /></Field>
            <Field label="Date Range"><span className="flex h-10 items-center gap-2.5 rounded-lg border border-line px-3 text-[14px] text-navy"><CalendarDays className="size-4" /> 21 Sep 2026 - 21 Oct 2026</span></Field>
            <Field label="Format"><SelectBox label="PDF" className="w-full" /></Field>
          </div>
          <button onClick={() => toast.success('Report generated')} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#077a52] text-[15px] font-semibold text-white"><Download className="size-5" /> Generate Report</button>
        </Card>
      </div>
    </div>
  );
}
