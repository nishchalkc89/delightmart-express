import { createFileRoute } from '@tanstack/react-router';
import { ChevronDown, CircleCheck, Clock, Download, Ellipsis, MapPin, Plus, Printer, ShoppingCart, Truck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Avatar, Badge, Card, Checkbox, DataBadge, DateRange, FilterBar, FiltersButton, PageHeader, Pagination, Panel, PrimaryAction, SearchBox, SelectBox, StatCard, Table, Tabs, Td, Tr, WithPanel, type BadgeTone } from '@/components/delight/admin-ui';
import { adminProducts as ap, npr, people } from '@/components/delight/admin-data';
import { fetchAdminOrders, fmtDate, fmtTime, ORDER_STATUSES, statusLabel, updateOrderStatus, useAdminData, type AdminOrder, type OrderStatusDb } from '@/services/admin';

export const Route = createFileRoute('/admin/orders')({
  head: () => ({ meta: [{ title: 'Orders — Delight Admin' }, { name: 'description', content: 'Manage and track customer orders.' }, { property: 'og:title', content: 'Orders — Delight Admin' }, { property: 'og:description', content: 'Order management.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: Page,
});

const tone: Record<OrderStatusDb, BadgeTone> = { PENDING: 'blue', CONFIRMED: 'teal', PREPARING: 'amber', READY_FOR_DELIVERY: 'orange', OUT_FOR_DELIVERY: 'purple', DELIVERED: 'green', CANCELLED: 'red', FAILED: 'red' };
// The approved design calls newly placed (PENDING) orders "New".
const label = (s: OrderStatusDb) => (s === 'PENDING' ? 'New' : statusLabel(s));

const demoItems = [[ap[0]!, 2, 600], [ap[3]!, 1, 150], [ap[1]!, 1, 85]] as const;
const demo: AdminOrder[] = ([
  ['10251', people.sujan, 1250, 'eSewa', 'PENDING', '2026-09-27T10:24:00'],
  ['10250', people.aarati, 2430, 'eSewa', 'PREPARING', '2026-09-27T09:18:00'],
  ['10249', people.bikash, 680, 'COD', 'OUT_FOR_DELIVERY', '2026-09-27T08:45:00'],
  ['10248', people.sangita, 1890, 'Khalti', 'DELIVERED', '2026-09-26T19:30:00'],
  ['10247', people.ramesh, 450, 'eSewa', 'CANCELLED', '2026-09-26T18:12:00'],
  ['10246', people.sita, 3120, 'eSewa', 'DELIVERED', '2026-09-26T16:20:00'],
  ['10245', people.kiran, 950, 'COD', 'PREPARING', '2026-09-26T15:11:00'],
  ['10244', people.prabin, 1430, 'Khalti', 'DELIVERED', '2026-09-26T13:55:00'],
] as const).map(([n, who, total, pay, status, at]) => ({
  id: n, number: `#${n}`, status, total, subtotal: 1435, discount: 185, deliveryFee: 0, paymentMethod: pay, createdAt: at,
  instructions: 'Deliver to: Ward No. 5, Tulsipur, Dang, Lumbini Province, Nepal.',
  customer: { name: who.name, phone: who.phone, email: who.email },
  items: demoItems.map(([p, q, price]) => ({ name: p.short, quantity: q, unitPrice: price, lineTotal: q * price, image: p.img })),
}));
const avatarFor = (name: string) => Object.values(people).find((p) => p.name === name)?.avatar;
const addressOf = (o: AdminOrder) => /Deliver to: (.*?)\. Recipient:/.exec(o.instructions)?.[1] ?? /Deliver to: (.*?)\.$/.exec(o.instructions)?.[1] ?? 'Tulsipur, Dang';

const tabs: Array<[string, (o: AdminOrder) => boolean]> = [
  ['All Orders', () => true],
  ['New', (o) => o.status === 'PENDING'],
  ['Preparing', (o) => o.status === 'CONFIRMED' || o.status === 'PREPARING' || o.status === 'READY_FOR_DELIVERY'],
  ['Out for Delivery', (o) => o.status === 'OUT_FOR_DELIVERY'],
  ['Delivered', (o) => o.status === 'DELIVERED'],
  ['Cancelled', (o) => o.status === 'CANCELLED' || o.status === 'FAILED'],
];

function exportCsv(rows: AdminOrder[]) {
  const lines = [['Order', 'Customer', 'Phone', 'Items', 'Total', 'Payment', 'Status', 'Date'], ...rows.map((o) => [o.number, o.customer.name, o.customer.phone, String(o.items.length), String(o.total), o.paymentMethod, label(o.status), new Date(o.createdAt).toISOString()])];
  const url = URL.createObjectURL(new Blob(['﻿', lines.map((r) => r.map((c) => `"${c.replaceAll('"', '""')}"`).join(',')).join('\r\n')], { type: 'text/csv' }));
  const a = document.createElement('a'); a.href = url; a.download = 'delight-orders.csv'; a.click(); URL.revokeObjectURL(url);
}

function Page() {
  const { rows, setRows, live, loading } = useAdminData(fetchAdminOrders, demo);
  const [tab, setTab] = useState(0);
  const [query, setQuery] = useState('');
  const [selId, setSelId] = useState<string | null>(null);
  const [nextStatus, setNextStatus] = useState<OrderStatusDb | ''>('');
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => rows.filter((o) => tabs[tab]![1](o) && `${o.number} ${o.customer.name} ${o.customer.phone}`.toLowerCase().includes(query.toLowerCase())), [rows, tab, query]);
  const o = rows.find((x) => x.id === selId) ?? filtered[0] ?? rows[0];
  const count = (i: number) => rows.filter(tabs[i]![1]).length;
  const today = new Date().toDateString();

  async function saveStatus() {
    if (!o || !nextStatus || nextStatus === o.status) return;
    if (!live) { toast.info('Sample data — sign in with a staff account to update real orders.'); return; }
    setSaving(true);
    try {
      await updateOrderStatus(o.id, nextStatus);
      setRows((list) => list.map((x) => (x.id === o.id ? { ...x, status: nextStatus } : x)));
      toast.success(`Order ${o.number} marked ${label(nextStatus)}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not update the order');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader title="Orders" subtitle="Manage and track all customer orders in one place." badge={<DataBadge live={live} loading={loading} />} actions={<PrimaryAction icon={Plus}>Create Order</PrimaryAction>} />
      <WithPanel
        main={
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard icon={ShoppingCart} tone="green" label="Total Orders" value={live ? rows.length.toLocaleString() : '1,248'} delta={live ? undefined : '+12%'} note="vs last week" />
              <StatCard icon={Clock} tone="amber" label="Pending Orders" value={live ? String(count(1)) : '32'} delta={live ? undefined : '-5%'} dir="down" note="vs last week" filled={false} />
              <StatCard icon={Truck} tone="red" label="Out for Delivery" value={live ? String(count(3)) : '18'} delta={live ? undefined : '+20%'} note="vs last week" />
              <StatCard icon={CircleCheck} tone="green" label="Delivered Today" value={live ? String(rows.filter((x) => x.status === 'DELIVERED' && new Date(x.createdAt).toDateString() === today).length) : '96'} delta={live ? undefined : '+18%'} note="vs last week" />
            </div>
            <Card className="mt-4">
              <div className="flex items-center justify-between pr-4">
                <div className="min-w-0 flex-1"><Tabs items={tabs.map(([t], i) => `${t} (${live ? count(i) : ['1,248', '32', '26', '18', '1,140', '32'][i]})`)} active={tab} onChange={setTab} /></div>
                <button onClick={() => exportCsv(filtered)} className="ml-3 flex h-[40px] items-center gap-2 rounded-lg border border-line px-4 text-[14px] font-semibold text-navy"><Download className="size-4" /> Export</button>
              </div>
              <FilterBar>
                <SearchBox placeholder="Search by order ID, customer name or phone..." value={query} onChange={setQuery} className="w-[254px]" />
                <SelectBox label="All Status" className="w-[118px]" />
                <SelectBox label="All Payment Methods" className="w-[150px]" />
                <DateRange label="21 Sep 2026 - 27 Sep 2026" />
                <FiltersButton />
              </FilterBar>
              <Table head={[<Checkbox key="c" />, 'Order ID', 'Customer', 'Items', 'Amount', 'Payment', 'Status', 'Order Date', 'Action']}>
                {filtered.map((x) => (
                  <Tr key={x.id} active={x.id === o?.id} onClick={() => { setSelId(x.id); setNextStatus(''); }}>
                    <Td><Checkbox /></Td>
                    <Td className="whitespace-nowrap">{x.number}</Td>
                    <Td><span className="flex items-center gap-3"><Avatar src={avatarFor(x.customer.name)} name={x.customer.name} /><span className="leading-tight"><span className="block">{x.customer.name}</span><span className="text-[12.5px] text-slate">{x.customer.phone}</span></span></span></Td>
                    <Td><span className="flex items-center gap-2 whitespace-nowrap"><span className="flex">{x.items.slice(0, 3).map((it, k) => it.image ? <img key={k} src={it.image} alt="" className="size-6 object-contain" /> : null)}</span><span className="text-slate">{x.items.reduce((s, it) => s + it.quantity, 0)} items</span></span></Td>
                    <Td className="whitespace-nowrap">{npr(x.total)}</Td>
                    <Td><Badge tone={x.paymentMethod === 'COD' ? 'gray' : 'green'}>{x.paymentMethod === 'COD' ? 'COD' : 'Paid'}</Badge></Td>
                    <Td><Badge tone={tone[x.status]}>{label(x.status)}</Badge></Td>
                    <Td className="whitespace-nowrap leading-tight">{fmtDate(x.createdAt)}<br /><span className="text-slate">{fmtTime(x.createdAt)}</span></Td>
                    <Td><Ellipsis className="size-5 text-navy" /></Td>
                  </Tr>
                ))}
              </Table>
              {!filtered.length && <p className="px-5 py-10 text-center text-[14px] text-slate">No orders match this view.</p>}
              <Pagination text={`Showing 1-${filtered.length} of ${live ? filtered.length : '1,248'} orders`} pages={live ? [1] : [1, 2, 3, 4, 5, '…', 156]} perPage="8 per page" />
            </Card>
          </>
        }
        panel={o && (
          <Panel title={<div><h2 className="flex items-center gap-2 text-[19px] font-bold text-navy">Order {o.number} <Badge tone={tone[o.status]}>{label(o.status)}</Badge></h2><p className="mt-1 text-[13px] text-slate">Placed on {fmtDate(o.createdAt)}, {fmtTime(o.createdAt)}</p></div>} onClose={() => setSelId(null)}>
            <h3 className="mt-4 text-[15px] font-bold text-navy">Customer Details</h3>
            <div className="mt-2 flex items-center gap-3">
              <Avatar src={avatarFor(o.customer.name)} name={o.customer.name} size="size-11" />
              <span className="min-w-0 flex-1 text-[13px] leading-5"><b className="block text-[14px] font-medium text-navy">{o.customer.name}</b><span className="block text-slate">{o.customer.phone}</span><span className="block truncate text-slate">{o.customer.email}</span></span>
              {o.customer.phone && <a href={`tel:${o.customer.phone}`} className="rounded-md border border-[#0a8a5b] px-2.5 py-1.5 text-[13px] font-medium text-[#0a8a5b]">Call</a>}
            </div>
            <h3 className="mt-5 text-[15px] font-bold text-navy">Delivery Address</h3>
            <div className="mt-2 flex items-start gap-2 text-[13.5px] leading-5 text-navy">
              <MapPin className="mt-0.5 size-4 shrink-0" />
              <span className="flex-1">{addressOf(o)}</span>
              <a target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/${encodeURIComponent(`${addressOf(o)}, Nepal`)}`} className="rounded-md bg-[#f1f4f7] px-2.5 py-1.5 text-[12.5px] text-navy">View on Map</a>
            </div>
            <h3 className="mt-5 text-[15px] font-bold text-navy">Order Items ({o.items.length})</h3>
            <ul className="mt-2 space-y-2.5">
              {o.items.map((it) => (
                <li key={it.name} className="flex items-center gap-3">
                  {it.image ? <img src={it.image} alt="" className="size-11 object-contain" /> : <span className="size-11 rounded bg-[#f1f4f7]" />}
                  <span className="flex-1 text-[13px] leading-5"><span className="block text-navy">{it.name}</span><span className="text-slate">{it.quantity} × {npr(it.unitPrice)}</span></span>
                  <span className="text-[13.5px] text-navy">{npr(it.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-1.5 border-t border-line pt-3 text-[13.5px]">
              <p className="flex justify-between text-slate"><span>Subtotal</span><span className="text-navy">{npr(o.subtotal)}</span></p>
              <p className="flex justify-between text-slate"><span>Delivery Charge</span><span className="text-navy">{npr(o.deliveryFee)}</span></p>
              <p className="flex justify-between text-slate"><span>Discount</span><span className="text-[#e3101a]">- {npr(o.discount)}</span></p>
              <p className="flex justify-between pt-2 text-[16px] font-bold text-navy"><span>Total Amount</span><span className="text-[18px]">{npr(o.total)}</span></p>
            </div>
            <div className="mt-4 flex items-center gap-2"><b className="text-[15px] font-bold text-navy">Payment Method</b><Badge tone={o.paymentMethod === 'COD' ? 'gray' : 'green'}>{o.paymentMethod === 'COD' ? 'Due on delivery' : 'Paid'}</Badge></div>
            <p className="mt-1 text-[13.5px] text-slate">{o.paymentMethod === 'COD' ? 'Cash on Delivery' : o.paymentMethod}</p>
            <h3 className="mt-4 text-[15px] font-bold text-navy">Update Order Status</h3>
            <div className="mt-2 flex gap-2">
              <span className="relative flex-1">
                <select aria-label="New status" value={nextStatus || o.status} onChange={(e) => setNextStatus(e.target.value as OrderStatusDb)} className="h-10 w-full appearance-none rounded-lg border border-line bg-white px-3 text-[13.5px] text-navy outline-none">
                  {ORDER_STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-3 size-4 text-slate" />
              </span>
              <button onClick={saveStatus} disabled={saving} className="rounded-lg bg-[#077a52] px-6 text-[14px] font-semibold text-white disabled:opacity-60">{saving ? 'Saving…' : 'Update'}</button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button onClick={() => window.print()} className="flex h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-line text-[13px] font-medium text-navy"><Printer className="size-4" /> Print Invoice</button>
              <button onClick={() => { setNextStatus('OUT_FOR_DELIVERY'); toast.info('Status set to Out for Delivery — press Update to save.'); }} className="flex h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-[#0a8a5b] text-[13px] font-medium text-[#0a8a5b]"><Truck className="size-4 fill-[#0a8a5b]" /> Send to Delivery</button>
            </div>
          </Panel>
        )}
      />
    </div>
  );
}
