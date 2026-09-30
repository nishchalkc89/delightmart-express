import { createFileRoute } from '@tanstack/react-router';
import { ChevronDown, CircleCheck, Clock, Download, MapPin, Printer, RefreshCw, ShoppingCart, Truck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Avatar, Badge, Card, DataBadge, FilterBar, FilterSelect, PageHeader, Pagination, Panel, PeriodSelect, PrimaryAction, SearchBox, StatCard, Table, Tabs, Td, Tr, WithPanel, inPeriod, usePaged, type BadgeTone } from '@/components/delight/admin-ui';
import { npr } from '@/components/delight/admin-data';
import { fetchAdminOrders, fmtDate, fmtTime, ORDER_STATUSES, statusLabel, updateOrderStatus, useAdminData, type AdminOrder, type OrderStatusDb } from '@/services/admin';
import { STORE } from '@/lib/store-info';
import type { Branch } from '@/lib/branch';
import { useAdminScope } from '@/services/admin-scope';

export const Route = createFileRoute('/admin/orders')({
  // ?id= opens one order (dashboard "View"); ?q= pre-fills the search (admin header search).
  validateSearch: (s: Record<string, unknown>): { id?: string | undefined; q?: string | undefined } => ({ id: typeof s['id'] === 'string' ? s['id'] : undefined, q: typeof s['q'] === 'string' ? s['q'] : undefined }),
  head: () => ({ meta: [{ title: 'Orders — Delight Admin' }, { name: 'description', content: 'Manage and track customer orders.' }, { property: 'og:title', content: 'Orders — Delight Admin' }, { property: 'og:description', content: 'Order management.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: Page,
});

const tone: Record<OrderStatusDb, BadgeTone> = { PENDING: 'blue', CONFIRMED: 'teal', PREPARING: 'amber', READY_FOR_DELIVERY: 'orange', OUT_FOR_DELIVERY: 'purple', DELIVERED: 'green', CANCELLED: 'red', FAILED: 'red' };
// The approved design calls newly placed (PENDING) orders "New".
const label = (s: OrderStatusDb) => (s === 'PENDING' ? 'New' : statusLabel(s));
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

const esc = (t: string) => t.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!);

/** Opens a clean, printable invoice for one order. */
function printInvoice(o: AdminOrder, store?: Branch) {
  const w = window.open('', '_blank', 'width=720,height=900');
  if (!w) { toast.error('Allow pop-ups to print the invoice'); return; }
  const rows = o.items.map((i) => `<tr><td>${esc(i.name)}</td><td class="r">${i.quantity}</td><td class="r">${npr(i.unitPrice)}</td><td class="r">${npr(i.lineTotal)}</td></tr>`).join('');
  w.document.write(`<!doctype html><html><head><title>Invoice ${esc(o.number)}</title><style>
    body{font-family:Arial,sans-serif;color:#13213a;margin:32px}h1{margin:0;font-size:22px}table{width:100%;border-collapse:collapse;margin-top:18px}
    th,td{padding:8px;border-bottom:1px solid #e8ecf0;text-align:left;font-size:14px}.r{text-align:right}.muted{color:#6b7385;font-size:13px}.tot td{font-weight:bold;font-size:16px}
  </style></head><body>
    <h1>${esc(STORE.name)}${store ? ` – ${esc(store.city)}` : ''}</h1><p class="muted">${esc(store?.address ?? 'Tulsipur, Dang')} · ${esc(store?.phone ?? STORE.phone)} · ${esc(store?.email ?? STORE.email)}</p>
    <h2 style="font-size:18px;margin-top:24px">Invoice ${esc(o.number)}</h2>
    <p class="muted">Date: ${fmtDate(o.createdAt)} ${fmtTime(o.createdAt)}<br>Customer: ${esc(o.customer.name)} ${esc(o.customer.phone)}<br>Deliver to: ${esc(addressOf(o))}<br>Payment: ${o.paymentMethod === 'COD' ? 'Cash on Delivery' : esc(o.paymentMethod)}</p>
    <table><thead><tr><th>Item</th><th class="r">Qty</th><th class="r">Price</th><th class="r">Amount</th></tr></thead><tbody>${rows}
    <tr><td colspan="3" class="r">Subtotal</td><td class="r">${npr(o.subtotal)}</td></tr>
    ${o.discount ? `<tr><td colspan="3" class="r">Discount</td><td class="r">- ${npr(o.discount)}</td></tr>` : ''}
    <tr><td colspan="3" class="r">Delivery</td><td class="r">${o.deliveryFee ? npr(o.deliveryFee) : 'FREE'}</td></tr>
    <tr class="tot"><td colspan="3" class="r">Total</td><td class="r">${npr(o.total)}</td></tr></tbody></table>
    <p class="muted" style="margin-top:28px">Thank you for shopping with Delight!</p>
    <script>window.onload=function(){window.print()}</script></body></html>`);
  w.document.close();
}

function Page() {
  const search = Route.useSearch();
  const { rows, setRows, live, loading, reload } = useAdminData(fetchAdminOrders);
  const { scope, allowed, branches } = useAdminScope();
  const showStore = scope === 'all' && allowed.length > 1;
  const storeOf = (id: string) => branches.find((b) => b.id === id);
  const [tab, setTab] = useState(0);
  const [query, setQuery] = useState(search.q ?? '');
  const [payment, setPayment] = useState('all');
  const [period, setPeriod] = useState('all');
  const [selId, setSelId] = useState<string | null>(search.id ?? null);
  const [nextStatus, setNextStatus] = useState<OrderStatusDb | ''>('');
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (search.id) setSelId(search.id); if (search.q !== undefined) setQuery(search.q); }, [search.id, search.q]);

  const filtered = useMemo(() => rows.filter((o) => tabs[tab]![1](o)
    && (payment === 'all' || (payment === 'COD' ? o.paymentMethod === 'COD' : o.paymentMethod !== 'COD'))
    && inPeriod(o.createdAt, period)
    && `${o.number} ${o.customer.name} ${o.customer.phone}`.toLowerCase().includes(query.toLowerCase().trim())), [rows, tab, query, payment, period]);
  const pg = usePaged(filtered, 20);
  const o = rows.find((x) => x.id === selId) ?? filtered[0];
  const count = (i: number) => rows.filter(tabs[i]![1]).length;
  const today = new Date().toDateString();

  async function saveStatus() {
    if (!o || !nextStatus || nextStatus === o.status) return;
    setSaving(true);
    try {
      await updateOrderStatus(o.id, nextStatus);
      setRows((list) => list.map((x) => (x.id === o.id ? { ...x, status: nextStatus } : x)));
      toast.success(`Order ${o.number} marked ${label(nextStatus)}`);
      setNextStatus('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not update the order');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader title="Orders" subtitle="Manage and track all customer orders in one place." badge={<DataBadge live={live} loading={loading} />} actions={<PrimaryAction icon={RefreshCw} onClick={() => { void reload(); toast.success('Orders refreshed'); }}>Refresh</PrimaryAction>} />
      <WithPanel
        main={
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard icon={ShoppingCart} tone="green" label="Total Orders" value={rows.length.toLocaleString()} note="all time" />
              <StatCard icon={Clock} tone="amber" label="New Orders" value={String(count(1))} note="waiting to be confirmed" filled={false} />
              <StatCard icon={Truck} tone="red" label="Out for Delivery" value={String(count(3))} note="right now" />
              <StatCard icon={CircleCheck} tone="green" label="Orders Today" value={String(rows.filter((x) => new Date(x.createdAt).toDateString() === today).length)} note="placed today" />
            </div>
            <Card className="mt-4">
              <div className="flex items-center justify-between pr-4">
                <div className="min-w-0 flex-1"><Tabs items={tabs.map(([t], i) => `${t} (${count(i)})`)} active={tab} onChange={(i) => { setTab(i); pg.reset(); }} /></div>
                <button onClick={() => exportCsv(filtered)} className="ml-3 flex h-[40px] items-center gap-2 rounded-lg border border-line px-4 text-[14px] font-semibold text-navy"><Download className="size-4" /> Export</button>
              </div>
              <FilterBar>
                <SearchBox placeholder="Search by order ID, customer name or phone..." value={query} onChange={(v) => { setQuery(v); pg.reset(); }} className="w-[280px]" />
                <FilterSelect label="Payment" value={payment} onChange={(v) => { setPayment(v); pg.reset(); }} options={[['all', 'All Payments'], ['COD', 'Cash on Delivery'], ['online', 'Online']]} className="w-[170px]" />
                <PeriodSelect value={period} onChange={(v) => { setPeriod(v); pg.reset(); }} />
              </FilterBar>
              <Table head={['Order ID', ...(showStore ? ['Store'] : []), 'Customer', 'Items', 'Amount', 'Payment', 'Status', 'Order Date', 'Action']}>
                {pg.shown.map((x) => (
                  <Tr key={x.id} active={x.id === o?.id} onClick={() => { setSelId(x.id); setNextStatus(''); }}>
                    <Td className="whitespace-nowrap">{x.number}</Td>
                    {showStore && <Td><Badge tone={x.branch === 'ghorahi' ? 'purple' : 'blue'}>{storeOf(x.branch)?.city ?? x.branch}</Badge></Td>}
                    <Td><span className="flex items-center gap-3"><Avatar name={x.customer.name} /><span className="leading-tight"><span className="block">{x.customer.name}</span><span className="text-[12.5px] text-slate">{x.customer.phone}</span></span></span></Td>
                    <Td><span className="whitespace-nowrap text-slate">{x.items.reduce((s, it) => s + it.quantity, 0)} items</span></Td>
                    <Td className="whitespace-nowrap">{npr(x.total)}</Td>
                    <Td><Badge tone={x.paymentMethod === 'COD' ? 'gray' : 'green'}>{x.paymentMethod === 'COD' ? 'COD' : 'Paid'}</Badge></Td>
                    <Td><Badge tone={tone[x.status]}>{label(x.status)}</Badge></Td>
                    <Td className="whitespace-nowrap leading-tight">{fmtDate(x.createdAt)}<br /><span className="text-slate">{fmtTime(x.createdAt)}</span></Td>
                    <Td><button onClick={(e) => { e.stopPropagation(); setSelId(x.id); setNextStatus(''); }} className="rounded-md border border-line px-3 py-1 text-[13px] font-medium text-[#0a8a5b]">View</button></Td>
                  </Tr>
                ))}
              </Table>
              {!loading && !filtered.length && <p className="px-5 py-10 text-center text-[14px] text-slate">{rows.length ? 'No orders match these filters.' : 'No orders yet. New orders appear here as soon as customers place them.'}</p>}
              <Pagination text={`Showing ${pg.from}-${pg.to} of ${pg.total} orders`} current={pg.page} pageCount={pg.pageCount} onPage={pg.setPage} />
            </Card>
          </>
        }
        panel={o ? (
          <Panel title={<div><h2 className="flex items-center gap-2 text-[19px] font-bold text-navy">Order {o.number} <Badge tone={tone[o.status]}>{label(o.status)}</Badge></h2><p className="mt-1 text-[13px] text-slate">Placed on {fmtDate(o.createdAt)}, {fmtTime(o.createdAt)}</p></div>} onClose={() => setSelId(null)}>
            <h3 className="mt-4 text-[15px] font-bold text-navy">Customer Details</h3>
            <div className="mt-2 flex items-center gap-3">
              <Avatar name={o.customer.name} size="size-11" />
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
              <p className="flex justify-between text-slate"><span>Delivery Charge</span><span className="text-navy">{o.deliveryFee ? npr(o.deliveryFee) : 'FREE'}</span></p>
              {o.discount > 0 && <p className="flex justify-between text-slate"><span>Discount</span><span className="text-[#e3101a]">- {npr(o.discount)}</span></p>}
              <p className="flex justify-between pt-2 text-[16px] font-bold text-navy"><span>Total Amount</span><span className="text-[18px]">{npr(o.total)}</span></p>
            </div>
            <div className="mt-4 flex items-center gap-2"><b className="text-[15px] font-bold text-navy">Payment Method</b><Badge tone={o.paymentMethod === 'COD' ? 'gray' : 'green'}>{o.paymentMethod === 'COD' ? (o.status === 'DELIVERED' ? 'Collected' : 'Due on delivery') : 'Paid'}</Badge></div>
            <p className="mt-1 text-[13.5px] text-slate">{o.paymentMethod === 'COD' ? 'Cash on Delivery' : o.paymentMethod}</p>
            {o.instructions.includes('. ') && <p className="mt-2 rounded-lg bg-page px-3 py-2 text-[12.5px] text-slate">{o.instructions.split('. ').slice(3).join('. ') || 'No delivery instructions'}</p>}
            <h3 className="mt-4 text-[15px] font-bold text-navy">Update Order Status</h3>
            <div className="mt-2 flex gap-2">
              <span className="relative flex-1">
                <select aria-label="New status" value={nextStatus || o.status} onChange={(e) => setNextStatus(e.target.value as OrderStatusDb)} className="h-10 w-full appearance-none rounded-lg border border-line bg-white px-3 text-[13.5px] text-navy outline-none">
                  {ORDER_STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-3 size-4 text-slate" />
              </span>
              <button onClick={() => void saveStatus()} disabled={saving || !nextStatus || nextStatus === o.status} className="rounded-lg bg-[#077a52] px-6 text-[14px] font-semibold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Update'}</button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button onClick={() => printInvoice(o, storeOf(o.branch))} className="flex h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-line text-[13px] font-medium text-navy"><Printer className="size-4" /> Print Invoice</button>
              <button onClick={() => { setNextStatus('OUT_FOR_DELIVERY'); toast.info('Status set to Out for Delivery — press Update to save.'); }} className="flex h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-[#0a8a5b] text-[13px] font-medium text-[#0a8a5b]"><Truck className="size-4 fill-[#0a8a5b]" /> Send to Delivery</button>
            </div>
          </Panel>
        ) : (
          <Panel title="Order details"><p className="text-[14px] text-slate">Select an order to see its details.</p></Panel>
        )}
      />
    </div>
  );
}
