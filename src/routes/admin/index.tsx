import { createFileRoute, Link } from '@tanstack/react-router';
import { CalendarDays, ChartColumn, ChevronDown, ChevronRight, CircleDot, Coins, LayoutGrid, Package, ShoppingCart, Tag, TriangleAlert, Truck, Users, FileText, Box } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Avatar, Badge, Card, DataBadge, StatCard, Status, Table, Td, Tr } from '@/components/delight/admin-ui';
import { fetchAdminOrders, fetchAdminProducts, statusLabel, useAdminData, type AdminOrder, type AdminProduct } from '@/services/admin';
import { adminProducts, npr, people } from '@/components/delight/admin-data';

export const Route = createFileRoute('/admin/')({
  head: () => ({ meta: [{ title: 'Dashboard — Delight Admin' }, { name: 'description', content: 'Delight Shopping Mart operations dashboard.' }, { property: 'og:title', content: 'Delight Admin Dashboard' }, { property: 'og:description', content: 'Store operations overview.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: Page,
});

const sales = [['21 Sep', 12000], ['22 Sep', 45000], ['23 Sep', 60000], ['24 Sep', 102000], ['25 Sep', 76000], ['26 Sep', 98000], ['27 Sep', 124000], ['', 170000]].map(([d, v]) => ({ d, v }));
const status = [
  { n: 'Delivered', v: 72, count: 892, p: '72%', c: '#0a8a5b' },
  { n: 'Out for Delivery', v: 14, count: 18, p: '14%', c: '#f5b40b' },
  { n: 'Preparing', v: 10, count: 32, p: '10%', c: '#4a9ff5' },
  { n: 'Cancelled', v: 4, count: 16, p: '4%', c: '#ef4444' },
];
const recent = [
  ['#10251', people.sujan, '3 items', 1250, 'Paid', 'New'],
  ['#10250', people.aarati, '5 items', 2430, 'Paid', 'Preparing'],
  ['#10249', people.bikash, '2 items', 680, 'COD', 'Out for Delivery'],
  ['#10248', people.sangita, '4 items', 1890, 'Paid', 'Delivered'],
  ['#10247', people.ramesh, '1 item', 450, 'Paid', 'Cancelled'],
] as const;
const lowStock = [[adminProducts[0]!, 8], [adminProducts[1]!, 12], [adminProducts[2]!, 5], [adminProducts[4]!, 6], [adminProducts[7]!, 9]] as const;
const topSelling = [[adminProducts[1]!, 'Maggi Noodles 70g', 450], [adminProducts[0]!, 'Daawat Basmati Rice 5kg', 320], [adminProducts[3]!, 'Coca-Cola 1.5L', 280], [adminProducts[2]!, 'Nivea Body Lotion 400ml', 260], [adminProducts[4]!, 'Surf Excel 1kg', 240]] as const;

function Page() {
  const orders = useAdminData<AdminOrder>(fetchAdminOrders, []);
  const stock = useAdminData<AdminProduct>(fetchAdminProducts, []);
  const live = orders.live || stock.live;
  const o = orders.rows;
  const weekAgo = Date.now() - 7 * 86_400_000;
  const week = o.filter((x) => new Date(x.createdAt).getTime() > weekAgo);
  const liveRecent = o.slice(0, 5).map((x) => [x.number, { name: x.customer.name, avatar: Object.values(people).find((p) => p.name === x.customer.name)?.avatar ?? '' }, `${x.items.reduce((s, i) => s + i.quantity, 0)} items`, x.total, x.paymentMethod === 'COD' ? 'COD' : 'Paid', x.status === 'PENDING' ? 'New' : statusLabel(x.status)] as const);
  const liveLow = stock.rows.filter((p) => p.stock < p.threshold).sort((a, b) => a.stock - b.stock).slice(0, 5);
  const val = (liveValue: string, demo: string) => (live ? liveValue : demo);
  return (
    <div>
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-[36px] font-extrabold leading-tight tracking-tight text-navy">Welcome Back, Nishchal!<DataBadge live={live} loading={orders.loading} /></h1>
          <p className="text-[18px] text-slate">Here's what's happening at Delight Shopping Mart.</p>
        </div>
        <button className="mt-2 flex h-[44px] items-center gap-3 rounded-lg border border-line bg-white px-4 text-[15px] text-navy"><CalendarDays className="size-5" /> 21 Sep 2026 – 27 Sep 2026 <ChevronDown className="size-4 text-slate" /></button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard icon={ShoppingCart} tone="green" label="Total Orders" value={val(String(week.length), '1,248')} delta={live ? undefined : '+12%'} note={live ? 'last 7 days' : 'vs last week'} />
        <StatCard icon={Coins} tone="blue" label="Total Sales" value={val(npr(week.filter((x) => x.status !== 'CANCELLED').reduce((s, x) => s + x.total, 0)), 'NPR 524,380')} delta={live ? undefined : '+18%'} note={live ? 'last 7 days' : 'vs last week'} />
        <StatCard icon={Box} tone="amber" label="Pending Orders" value={val(String(o.filter((x) => x.status === 'PENDING').length), '32')} delta={live ? undefined : '-5%'} dir="down" note={live ? 'awaiting confirmation' : 'vs last week'} />
        <StatCard icon={Truck} tone="red" label="Out for Delivery" value={val(String(o.filter((x) => x.status === 'OUT_FOR_DELIVERY').length), '18')} delta={live ? undefined : '+20%'} note={live ? 'right now' : 'vs last week'} />
        <StatCard icon={Users} tone="purple" label="New Customers" value={val(String(new Set(week.map((x) => x.customer.name)).size), '86')} delta={live ? undefined : '+14%'} note={live ? 'ordered this week' : 'vs last week'} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.62fr)_minmax(0,1fr)_325px]">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2.5 text-[19px] font-bold text-navy"><ChartColumn className="size-6" /> Sales Overview</h2>
            <button className="flex h-9 items-center gap-2 rounded-lg border border-line px-3 text-[13.5px] text-navy">This Week <ChevronDown className="size-4" /></button>
          </div>
          <div className="mt-3 h-[190px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sales} margin={{ left: -8, right: 12, top: 8 }}>
                <defs><linearGradient id="dash" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0a8a5b" stopOpacity={0.28} /><stop offset="100%" stopColor="#0a8a5b" stopOpacity={0.02} /></linearGradient></defs>
                <CartesianGrid vertical={false} stroke="#eef1f4" />
                <XAxis dataKey="d" tickLine={false} axisLine={false} tick={{ fontSize: 13, fill: '#6b7385' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 13, fill: '#6b7385' }} tickFormatter={(v: number) => (v ? `${v / 1000}K` : '0')} ticks={[0, 50000, 100000, 150000, 200000]} domain={[0, 200000]} />
                <Tooltip formatter={(v) => npr(Number(v))} />
                <Area type="linear" dataKey="v" stroke="#0a8a5b" strokeWidth={2.5} fill="url(#dash)" dot={{ r: 4, fill: '#0a8a5b', strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="flex items-center gap-2.5 text-[19px] font-bold text-navy"><CircleDot className="size-6" /> Order Status</h2>
          <div className="mt-3 flex items-center gap-2">
            <div className="relative size-[170px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart><Pie data={status} dataKey="v" innerRadius={58} outerRadius={80} startAngle={90} endAngle={-270} stroke="none">{status.map((s) => <Cell key={s.n} fill={s.c} />)}</Pie></PieChart>
              </ResponsiveContainer>
              <span className="absolute inset-0 grid place-content-center text-center"><b className="text-[24px] font-extrabold text-navy">1,248</b><span className="text-[13px] text-slate">Total Orders</span></span>
            </div>
            <ul className="space-y-2 text-[13px]">
              {status.map((s) => <li key={s.n} className="flex gap-2"><span className="mt-1 size-3 shrink-0 rounded-full" style={{ background: s.c }} /><span className="leading-tight text-navy">{s.n}<br /><span className="text-slate">{s.count} ({s.p})</span></span></li>)}
            </ul>
          </div>
        </Card>

        <Card className="p-5 xl:row-span-1">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2.5 text-[17px] font-bold text-navy"><TriangleAlert className="size-6 fill-[#e3101a] text-white" /> Low Stock Products</h2>
            <Link to="/admin/inventory" className="text-[14px] font-medium text-[#0a8a5b]">View All</Link>
          </div>
          <ul className="mt-2 divide-y divide-line">
            {(stock.live ? liveLow.map((p) => [{ sku: p.id, img: p.image, short: p.name }, p.stock] as const) : lowStock).map(([p, left]) => (
              <li key={p.sku} className="flex items-center gap-3 py-2">
                {p.img ? <img src={p.img} alt="" className="size-10 object-contain" /> : <span className="size-10 rounded bg-[#f1f4f7]" />}
                <span className="flex-1 text-[14px] text-navy">{p.short}</span>
                <span className="text-[14px] font-medium text-[#e3101a]">{left} left</span>
              </li>
            ))}
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
                {(orders.live ? liveRecent : recent).map(([id, who, items, amount, pay, st]) => (
                  <Tr key={id}>
                    <Td>{id}</Td>
                    <Td><span className="flex items-center gap-3"><Avatar src={who.avatar} name={who.name} size="size-8" />{who.name}</span></Td>
                    <Td>{items}</Td>
                    <Td>{npr(amount)}</Td>
                    <Td><Badge tone={pay === 'Paid' ? 'green' : 'gray'}>{pay}</Badge></Td>
                    <Td><Status value={st} /></Td>
                    <Td><Link to="/admin/orders" className="rounded-md border border-line px-3 py-1 text-[13px] font-medium text-[#0a8a5b]">View</Link></Td>
                  </Tr>
                ))}
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
            <h2 className="flex items-center gap-2.5 text-[17px] font-bold text-navy"><ChartColumn className="size-6" /> Top Selling Products</h2>
            <Link to="/admin/reports" className="text-[14px] font-medium text-[#0a8a5b]">View All</Link>
          </div>
          <ul className="mt-2 divide-y divide-line">
            {topSelling.map(([p, name, sold], i) => (
              <li key={name} className="flex items-center gap-3 py-2.5">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#eef1f4] text-[14px] font-semibold text-navy">{i + 1}</span>
                <img src={p.img} alt="" className="size-11 object-contain" />
                <span className="leading-tight"><span className="block text-[14px] text-navy">{name}</span><span className="text-[13px] text-slate">{sold} sold</span></span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
