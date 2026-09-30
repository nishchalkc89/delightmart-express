import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { CalendarDays, Crown, Download, Eye, Mail, MapPin, Phone, ShoppingCart, Star, UserPlus, Users, Wallet } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Avatar, Card, DataBadge, downloadCsv, FilterBar, FilterSelect, IconBtn, PageHeader, Pagination, Panel, PrimaryAction, SearchBox, StatCard, Status, Table, Td, Tr, usePaged, WithPanel } from '@/components/delight/admin-ui';
import { npr } from '@/components/delight/admin-data';
import { fetchAdminCustomers, fmtDate, useAdminData, type AdminCustomer } from '@/services/admin';

export const Route = createFileRoute('/admin/customers')({
  head: () => ({ meta: [{ title: 'Customers — Delight Admin' }, { name: 'description', content: 'Manage customers and order history.' }, { property: 'og:title', content: 'Customers — Delight Admin' }, { property: 'og:description', content: 'Customer management.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: Page,
});

const statusText = (s: string) => (s === 'active' ? 'Active' : s === 'inactive' ? 'Inactive' : s);

function Page() {
  const { rows, live, loading } = useAdminData<AdminCustomer>(fetchAdminCustomers);
  const [selId, setSelId] = useState<string | null>(null);
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [segment, setSegment] = useState('all');
  const [sort, setSort] = useState('newest');
  const monthAgo = Date.now() - 30 * 86_400_000;

  const filtered = useMemo(() => rows
    .filter((c) => `${c.name} ${c.phone} ${c.email} ${c.id}`.toLowerCase().includes(query.toLowerCase()))
    .filter((c) => segment === 'all' || (segment === 'new' ? new Date(c.joined).getTime() > monthAgo : segment === 'repeat' ? c.orders > 1 : segment === 'buyers' ? c.orders > 0 : segment === 'none' ? c.orders === 0 : c.status === 'inactive'))
    .sort((a, b) => (sort === 'spent' ? b.spent - a.spent : sort === 'orders' ? b.orders - a.orders : sort === 'name' ? a.name.localeCompare(b.name) : sort === 'recent' ? (b.lastOrder ?? '').localeCompare(a.lastOrder ?? '') : b.joined.localeCompare(a.joined))),
  [rows, query, segment, sort, monthAgo]);
  const pg = usePaged(filtered, 20);
  const c = rows.find((x) => x.id === selId) ?? filtered[0] ?? rows[0];
  const exportCsv = () => downloadCsv('customers.csv', [['Name', 'Phone', 'Email', 'Orders', 'Total spent (NPR)', 'Last order', 'Joined', 'Status'], ...filtered.map((x) => [x.name, x.phone, x.email, x.orders, x.spent, x.lastOrder ? fmtDate(x.lastOrder) : '', fmtDate(x.joined), statusText(x.status)])]);
  const shortId = (id: string) => (`#${id.slice(0, 6).toUpperCase()}`);

  return (
    <div>
      <PageHeader title="Customers" subtitle="Manage your customers, view their order history and build better relationships." badge={<DataBadge live={live} loading={loading} />} actions={<PrimaryAction icon={Download} onClick={exportCsv}>Export Customers</PrimaryAction>} />
      <WithPanel
        main={
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard icon={Users} tone="green" label="Total Customers" value={String(rows.length)} />
              <StatCard icon={UserPlus} tone="purple" label="New Customers" value={String(rows.filter((x) => new Date(x.joined).getTime() > monthAgo).length)} />
              <StatCard icon={ShoppingCart} tone="green" label="Active Customers" value={String(rows.filter((x) => x.orders > 0).length)} />
              <StatCard icon={Crown} tone="amber" label="Repeat Customers" value={String(rows.filter((x) => x.orders > 1).length)} />
            </div>
            <Card className="mt-4">
              <FilterBar>
                <SearchBox placeholder="Search by name, phone, email or customer ID..." value={query} onChange={setQuery} className="w-[284px]" />
                <FilterSelect label="Customer type" value={segment} onChange={(v) => { setSegment(v); pg.reset(); }} options={[['all', 'All Customers'], ['new', 'New (30 days)'], ['buyers', 'Has ordered'], ['repeat', 'Repeat customers'], ['none', 'No orders yet'], ['inactive', 'Inactive']]} className="w-[170px]" />
                <FilterSelect label="Sort" value={sort} onChange={setSort} options={[['newest', 'Sort: Newest'], ['recent', 'Sort: Last order'], ['spent', 'Sort: Top spenders'], ['orders', 'Sort: Most orders'], ['name', 'Sort: Name (A-Z)']]} className="w-[176px]" />
              </FilterBar>
              <Table head={['#', 'Customer', 'Contact', 'Location', 'Total Orders', 'Total Spent', 'Last Order', 'Status', 'Actions']}>
                {pg.shown.map((x) => (
                  <Tr key={x.id} active={x.id === c?.id} onClick={() => setSelId(x.id)}>
                    <Td className="whitespace-nowrap">{shortId(x.id)}</Td>
                    <Td><span className="flex items-center gap-2.5 whitespace-nowrap"><Avatar src={x.avatar ?? undefined} name={x.name} />{x.name}</span></Td>
                    <Td className="leading-tight">{x.phone || '—'}<br /><span className="text-[12.5px] text-slate">{x.email}</span></Td>
                    <Td><span className="flex items-center gap-1 text-slate"><MapPin className="size-3.5 text-navy" />Tulsipur</span></Td>
                    <Td>{x.orders}</Td>
                    <Td className="whitespace-nowrap">{npr(x.spent)}</Td>
                    <Td className="whitespace-nowrap text-slate">{x.lastOrder ? fmtDate(x.lastOrder) : '—'}</Td>
                    <Td><Status value={statusText(x.status)} /></Td>
                    <Td><span className="flex gap-2"><IconBtn icon={Eye} label="View" onClick={() => setSelId(x.id)} /><IconBtn icon={ShoppingCart} label="View orders" onClick={() => void navigate({ to: '/admin/orders', search: { q: x.name } })} /></span></Td>
                  </Tr>
                ))}
              </Table>
              {!filtered.length && <p className="px-5 py-10 text-center text-[14px] text-slate">{loading ? 'Loading customers…' : rows.length ? 'No customers match your filters.' : 'No customers yet. They appear here when they create an account.'}</p>}
              <Pagination text={`Showing ${pg.from}-${pg.to} of ${pg.total} customers`} current={pg.page} pageCount={pg.pageCount} onPage={pg.setPage} />
            </Card>
          </>
        }
        panel={c && (
          <Panel onClose={() => setSelId(null)} title={
            <div className="flex items-center gap-3">
              <Avatar src={c.avatar ?? undefined} name={c.name} size="size-[62px]" />
              <div><p className="flex flex-wrap items-center gap-2"><b className="text-[17px] font-bold text-navy">{c.name}</b><Status value={statusText(c.status)} /></p><p className="text-[13px] text-slate"><b className="font-medium text-navy">{shortId(c.id)}</b> &nbsp;Customer since {new Date(c.joined).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</p></div>
            </div>
          }>
            <div className="-mx-5 mt-4 border-b border-line" />
            <dl className="mt-4 space-y-2.5 text-[13.5px]">
              {([[Phone, 'Phone', c.phone || '—'], [Mail, 'Email', c.email || '—'], [MapPin, 'Location', 'Tulsipur, Dang'], [CalendarDays, 'Join Date', fmtDate(c.joined)], [ShoppingCart, 'Total Orders', String(c.orders)], [ShoppingCart, 'Total Spent', npr(c.spent)]] as const).map(([Icon, k, v]) => (
                <div key={k} className="grid grid-cols-[132px_1fr] items-center"><dt className="flex items-center gap-2.5 text-slate"><Icon className="size-4 text-navy" />{k}</dt><dd className="truncate text-navy">{v}</dd></div>
              ))}
            </dl>
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              {([[ShoppingCart, String(c.orders), 'Total Orders', 'bg-[#e3f6ec] text-[#0a8a5b]'], [Wallet, npr(c.spent), 'Total Spent', 'bg-[#e4f0fd] text-[#2f73d9]'], [CalendarDays, c.lastOrder ? fmtDate(c.lastOrder) : '—', 'Last Order', 'bg-[#e4f0fd] text-[#2f73d9]'], [Star, npr(c.orders ? Math.round(c.spent / c.orders) : 0), 'Average Order', 'bg-[#fdf1dc] text-[#f59f0b]']] as const).map(([Icon, v, k, cls]) => (
                <div key={k} className="flex items-center gap-2 rounded-lg border border-line p-2.5">
                  <span className={`grid size-8 shrink-0 place-items-center rounded-full ${cls}`}><Icon className="size-4 fill-current" /></span>
                  <span className="min-w-0"><b className="block whitespace-nowrap text-[14px] font-bold text-navy">{v}</b><span className="text-[12px] text-slate">{k}</span></span>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <a href={c.email ? `mailto:${c.email}` : undefined} aria-disabled={!c.email} className="aria-disabled:pointer-events-none aria-disabled:opacity-50 flex h-11 items-center justify-center gap-2 rounded-lg border border-line text-[14px] font-medium text-navy"><Mail className="size-4" /> Send Message</a>
              <a href={c.phone ? `tel:${c.phone}` : undefined} aria-disabled={!c.phone} className="aria-disabled:pointer-events-none aria-disabled:opacity-50 flex h-11 items-center justify-center gap-2 rounded-lg bg-[#077a52] text-[14px] font-semibold text-white"><Phone className="size-4" /> Call Customer</a>
            </div>
            <button type="button" onClick={() => void navigate({ to: '/admin/orders', search: { q: c.name } })} className="mt-2.5 flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-line text-[14px] font-medium text-navy hover:bg-page"><ShoppingCart className="size-4" /> View this customer’s orders</button>
          </Panel>
        )}
      />
    </div>
  );
}
