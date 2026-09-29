import { createFileRoute } from '@tanstack/react-router';
import { CalendarDays, Crown, Ellipsis, Eye, Mail, MapPin, Phone, ShoppingCart, Star, UserPlus, Users, Wallet } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Avatar, Card, Checkbox, DataBadge, FilterBar, FiltersButton, IconBtn, PageHeader, Pagination, Panel, PrimaryAction, SearchBox, SelectBox, StatCard, Status, Table, Td, Tr, WithPanel } from '@/components/delight/admin-ui';
import { npr, people } from '@/components/delight/admin-data';
import { fetchAdminCustomers, fmtDate, useAdminData, type AdminCustomer } from '@/services/admin';
import { asset } from '@/lib/assets';

export const Route = createFileRoute('/admin/customers')({
  head: () => ({ meta: [{ title: 'Customers — Delight Admin' }, { name: 'description', content: 'Manage customers and order history.' }, { property: 'og:title', content: 'Customers — Delight Admin' }, { property: 'og:description', content: 'Customer management.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: Page,
});

const demo: AdminCustomer[] = ([
  ['10251', people.sujan, 12, 12450, '2026-09-27', 'Active'],
  ['10250', people.aarati, 8, 8230, '2026-09-26', 'Active'],
  ['10249', people.bikash, 15, 18650, '2026-09-25', 'Active'],
  ['10248', people.sangita, 5, 4320, '2026-09-24', 'Active'],
  ['10247', people.ramesh, 20, 25400, '2026-09-24', 'VIP'],
  ['10246', people.sita, 3, 2150, '2026-09-23', 'Active'],
  ['10245', people.kiran, 7, 6780, '2026-09-22', 'Active'],
  ['10244', people.prabin, 9, 9550, '2026-09-21', 'Active'],
  ['10243', people.anjali, 4, 3890, '2026-09-20', 'Active'],
  ['10242', people.dipesh, 6, 5240, '2026-09-19', 'Inactive'],
] as const).map(([id, who, orders, spent, last, status]) => ({ id, name: who.name, phone: who.phone, email: who.email, avatar: id === '10251' ? asset('av-sujan-lg') : who.avatar, orders, spent, lastOrder: last, joined: '2025-08-12', status }));

const statusText = (s: string) => (s === 'active' ? 'Active' : s === 'inactive' ? 'Inactive' : s);

function Page() {
  const { rows, live, loading } = useAdminData<AdminCustomer>(fetchAdminCustomers, demo);
  const [selId, setSelId] = useState<string | null>(null);
  const [tab, setTab] = useState(0);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => rows.filter((c) => `${c.name} ${c.phone} ${c.email} ${c.id}`.toLowerCase().includes(query.toLowerCase())), [rows, query]);
  const c = rows.find((x) => x.id === selId) ?? filtered[0] ?? rows[0]!;
  const monthAgo = Date.now() - 30 * 86_400_000;
  const shortId = (id: string) => (live ? `#${id.slice(0, 6).toUpperCase()}` : `#${id}`);

  return (
    <div>
      <PageHeader title="Customers" subtitle="Manage your customers, view their order history and build better relationships." badge={<DataBadge live={live} loading={loading} />} actions={<PrimaryAction icon={UserPlus}>Add Customer</PrimaryAction>} />
      <WithPanel
        main={
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard icon={Users} tone="green" label="Total Customers" value={live ? String(rows.length) : '1,248'} delta={live ? undefined : '+12%'} />
              <StatCard icon={UserPlus} tone="purple" label="New Customers" value={live ? String(rows.filter((x) => new Date(x.joined).getTime() > monthAgo).length) : '86'} delta={live ? undefined : '+18%'} />
              <StatCard icon={ShoppingCart} tone="green" label="Active Customers" value={live ? String(rows.filter((x) => x.orders > 0).length) : '1,012'} delta={live ? undefined : '+10%'} />
              <StatCard icon={Crown} tone="amber" label="Repeat Customers" value={live ? String(rows.filter((x) => x.orders > 1).length) : '320'} delta={live ? undefined : '+22%'} />
            </div>
            <Card className="mt-4">
              <FilterBar>
                <SearchBox placeholder="Search by name, phone, email or customer ID..." value={query} onChange={setQuery} className="w-[284px]" />
                <SelectBox label="All Customers" className="w-[136px]" />
                <SelectBox label="All Locations" className="w-[144px]" />
                <SelectBox label="Sort by: Newest" className="w-[152px]" />
                <FiltersButton />
              </FilterBar>
              <Table head={[<Checkbox key="c" />, '#', 'Customer', 'Contact', 'Location', 'Total Orders', 'Total Spent', 'Last Order', 'Status', 'Actions']}>
                {filtered.map((x) => (
                  <Tr key={x.id} active={x.id === c.id} onClick={() => setSelId(x.id)}>
                    <Td><Checkbox /></Td>
                    <Td className="whitespace-nowrap">{shortId(x.id)}</Td>
                    <Td><span className="flex items-center gap-2.5 whitespace-nowrap"><Avatar src={x.avatar ?? undefined} name={x.name} />{x.name}</span></Td>
                    <Td className="leading-tight">{x.phone || '—'}<br /><span className="text-[12.5px] text-slate">{x.email}</span></Td>
                    <Td><span className="flex items-center gap-1 text-slate"><MapPin className="size-3.5 text-navy" />Tulsipur</span></Td>
                    <Td>{x.orders}</Td>
                    <Td className="whitespace-nowrap">{npr(x.spent)}</Td>
                    <Td className="whitespace-nowrap text-slate">{x.lastOrder ? fmtDate(x.lastOrder) : '—'}</Td>
                    <Td><Status value={statusText(x.status)} /></Td>
                    <Td><span className="flex gap-2"><IconBtn icon={Eye} label="View" onClick={() => setSelId(x.id)} /><IconBtn icon={Ellipsis} label="More" /></span></Td>
                  </Tr>
                ))}
              </Table>
              {!filtered.length && <p className="px-5 py-10 text-center text-[14px] text-slate">No customers match your search.</p>}
              <Pagination text={`Showing 1-${filtered.length} of ${live ? rows.length : '1,248'} customers`} pages={live ? [1] : undefined} />
            </Card>
          </>
        }
        panel={
          <Panel onClose={() => setSelId(null)} title={
            <div className="flex items-center gap-3">
              <Avatar src={c.avatar ?? undefined} name={c.name} size="size-[62px]" />
              <div><p className="flex flex-wrap items-center gap-2"><b className="text-[17px] font-bold text-navy">{c.name}</b><Status value={statusText(c.status)} /></p><p className="text-[13px] text-slate"><b className="font-medium text-navy">{shortId(c.id)}</b> &nbsp;Customer since {new Date(c.joined).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</p></div>
            </div>
          }>
            <div className="-mx-5 mt-4 flex justify-between border-b border-line px-5 text-[13.5px]">
              {['Overview', 'Orders', 'Addresses', 'Notes'].map((t, i) => <button key={t} onClick={() => setTab(i)} className={`relative pb-2.5 ${i === tab ? 'font-semibold text-[#077a52]' : 'text-slate'}`}>{t}{i === tab && <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-full bg-[#077a52]" />}</button>)}
            </div>
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
              <a href={c.email ? `mailto:${c.email}` : undefined} className="flex h-11 items-center justify-center gap-2 rounded-lg border border-line text-[14px] font-medium text-navy"><Mail className="size-4" /> Send Message</a>
              <a href={c.phone ? `tel:${c.phone}` : undefined} className="flex h-11 items-center justify-center gap-2 rounded-lg bg-[#077a52] text-[14px] font-semibold text-white"><Phone className="size-4" /> Call Customer</a>
            </div>
          </Panel>
        }
      />
    </div>
  );
}
