import { createFileRoute, Link } from '@tanstack/react-router';
import { Box, ChevronRight, CircleCheck, CircleX, ExternalLink, Eye, MapPin, Phone, Plus, Settings, Truck, UsersRound } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Avatar, Badge, Card, DataBadge, Field, FilterBar, FilterSelect, IconBtn, inPeriod, PageHeader, Pagination, Panel, PanelTitle, PeriodSelect, PrimaryAction, SearchBox, StatCard, Table, Tabs, Td, Tr, usePaged, WithPanel, type BadgeTone } from '@/components/delight/admin-ui';
import { Select } from '@/components/delight/admin-forms';
import { fmtDate, useAdminData } from '@/services/admin';
import { assignDelivery, fetchDeliveries, fetchUsersWithRoles, type DeliveryRow, type StaffRow } from '@/services/admin-actions';
import { asset } from '@/lib/assets';
import { STORE } from '@/lib/store-info';

export const Route = createFileRoute('/admin/delivery')({
  head: () => ({ meta: [{ title: 'Delivery Management — Delight Admin' }, { name: 'description', content: 'Manage deliveries and delivery staff.' }, { property: 'og:title', content: 'Delivery Management — Delight Admin' }, { property: 'og:description', content: 'Delivery operations.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: Page,
});

type Status = 'PENDING' | 'READY' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'FAILED';
const labels: Record<Status, string> = { PENDING: 'Processing', READY: 'Ready', OUT_FOR_DELIVERY: 'Out for Delivery', DELIVERED: 'Delivered', FAILED: 'Failed' };
const tone: Record<string, BadgeTone> = { Delivered: 'green', 'Out for Delivery': 'blue', Processing: 'amber', Ready: 'teal', Failed: 'red', Cancelled: 'red' };

/** Delivery status shown for an order: explicit assignment first, otherwise derived from the order status. */
function statusOf(r: DeliveryRow): string {
  if (r.status) return labels[r.status];
  if (r.orderStatus === 'DELIVERED') return 'Delivered';
  if (r.orderStatus === 'OUT_FOR_DELIVERY') return 'Out for Delivery';
  if (r.orderStatus === 'CANCELLED') return 'Cancelled';
  if (r.orderStatus === 'FAILED') return 'Failed';
  return 'Processing';
}

function Page() {
  const { rows, setRows, live, loading } = useAdminData<DeliveryRow>(fetchDeliveries);
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [tab, setTab] = useState(0);
  const [query, setQuery] = useState('');
  const [statusF, setStatusF] = useState('all');
  const [partnerF, setPartnerF] = useState('all');
  const [period, setPeriod] = useState('all');
  const [tracking, setTracking] = useState('');
  const [selId, setSelId] = useState<string | null>(null);
  const [assignee, setAssignee] = useState('');
  const [nextStatus, setNextStatus] = useState<Status>('OUT_FOR_DELIVERY');
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (live) void fetchUsersWithRoles().then((u) => setStaff(u.filter((x) => x.roles.includes('DELIVERY_STAFF')))).catch(() => setStaff([])); }, [live]);
  const staffName = (id: string | null) => (staff.find((s) => s.id === id)?.name ?? (id ? 'Staff' : 'Not assigned'));

  const tabs: Array<[string, (r: DeliveryRow) => boolean]> = [
    ['All Deliveries', () => true], ['Out for Delivery', (r) => statusOf(r) === 'Out for Delivery'], ['Delivered', (r) => statusOf(r) === 'Delivered'], ['Failed', (r) => statusOf(r) === 'Failed'], ['Delivery Partners', () => false],
  ];
  const shown = useMemo(() => rows.filter((r) => tabs[tab]![1](r) && `${r.orderNumber} ${r.customer} ${r.phone} ${r.address}`.toLowerCase().includes(query.toLowerCase())
    && (statusF === 'all' || statusOf(r) === statusF)
    && (partnerF === 'all' || (partnerF === 'none' ? !r.staffId : r.staffId === partnerF))
    && inPeriod(r.createdAt, period)), [rows, tab, query, statusF, partnerF, period]); // eslint-disable-line react-hooks/exhaustive-deps
  const pg = usePaged(shown, 20);
  const n = (i: number) => (i === 4 ? (staff.length) : rows.filter(tabs[i]![1]).length);
  const sel = rows.find((r) => r.orderId === selId);

  function select(r: DeliveryRow) {
    setSelId(r.orderId);
    setAssignee(r.staffId ?? '');
    setNextStatus(r.status && r.status !== 'PENDING' ? r.status : 'OUT_FOR_DELIVERY');
  }
  async function save() {
    if (!sel) return;
    setSaving(true);
    try {
      await assignDelivery(sel.orderId, assignee || null, nextStatus);
      setRows((list) => list.map((r) => (r.orderId === sel.orderId ? { ...r, staffId: assignee || null, status: nextStatus } : r)));
      toast.success(`Order ${sel.orderNumber}: ${labels[nextStatus]}`);
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not update the delivery'); } finally { setSaving(false); }
  }

  const partners = staff.map((s) => { const mine = rows.filter((r) => r.staffId === s.id); const done = mine.filter((r) => statusOf(r) === 'Delivered').length; return [s, s.name, mine.length, mine.length ? `${Math.round((done / mine.length) * 100)}%` : '—'] as const; });

  return (
    <div>
      <PageHeader title="Delivery Management" subtitle="Manage your delivery partners, track deliveries in real-time and ensure on-time delivery." badge={<DataBadge live={live} loading={loading} />} actions={<PrimaryAction icon={Plus} onClick={() => { const next = rows.find((r) => !r.staffId && statusOf(r) === 'Processing'); if (next) select(next); else toast.info('Every open order already has a delivery assigned'); }}>Assign Delivery</PrimaryAction>} />
      <WithPanel
        main={
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard icon={Truck} tone="green" label="Total Deliveries" value={String(rows.length)} />
              <StatCard icon={Box} tone="blue" label="Out for Delivery" value={String(n(1))} />
              <StatCard icon={CircleCheck} tone="amber" label="Delivered" value={String(n(2))} />
              <StatCard icon={CircleX} tone="red" label="Failed / Returned" value={String(n(3))} dir="down" />
            </div>
            <Card className="mt-4">
              <Tabs items={tabs.map(([t], i) => `${t} (${n(i)})`)} active={tab} onChange={setTab} />
              {tab === 4 ? (
                <div className="p-5">
                  {partners.length ? partners.map(([p, name, count, rate]) => (
                    <div key={name} className="flex items-center gap-3 border-b border-line py-3 last:border-0">
                      <Avatar src={'avatar' in p ? (p.avatar ?? undefined) : undefined} name={name} />
                      <span className="flex-1"><b className="block text-[14px] font-medium text-navy">{name}</b><span className="text-[12.5px] text-slate">{count} deliveries</span></span>
                      <span className="text-[14px] font-semibold text-[#0a8a5b]">{rate} on-time</span>
                    </div>
                  )) : <p className="py-8 text-center text-[14px] text-slate">No delivery staff yet. Give someone the Delivery Staff role in <Link to="/admin/users" className="font-medium text-[#077a52]">Users &amp; Roles</Link>.</p>}
                </div>
              ) : (
                <>
                  <FilterBar>
                    <SearchBox placeholder="Search by order ID, customer name or tracking ID..." value={query} onChange={setQuery} className="w-[292px]" />
                    <FilterSelect label="Delivery status" value={statusF} onChange={(v) => { setStatusF(v); pg.reset(); }} options={[['all', 'All Status'], ...['Processing', 'Ready', 'Out for Delivery', 'Delivered', 'Failed', 'Cancelled'].map((x): [string, string] => [x, x])]} className="w-[150px]" />
                    <FilterSelect label="Delivery partner" value={partnerF} onChange={(v) => { setPartnerF(v); pg.reset(); }} options={[['all', 'All Delivery Partners'], ['none', 'Not assigned'], ...staff.map((s): [string, string] => [s.id, s.name])]} className="w-[180px]" />
                    <PeriodSelect value={period} onChange={(v) => { setPeriod(v); pg.reset(); }} />
                  </FilterBar>
                  <Table head={['#', 'Order ID', 'Customer', 'Location', 'Delivery Partner', 'Status', 'Estimated Delivery', 'Actions']}>
                    {pg.shown.map((r, i) => {
                      const st = statusOf(r);
                      return (
                        <Tr key={r.orderId} active={r.orderId === selId} onClick={() => select(r)}>
                          <Td>{pg.from + i}</Td>
                          <Td className="whitespace-nowrap">{r.orderNumber}</Td>
                          <Td><span className="flex items-center gap-2.5 whitespace-nowrap"><Avatar name={r.customer} size="size-8" />{r.customer}</span></Td>
                          <Td className="max-w-[140px] truncate text-slate">{r.address}</Td>
                          <Td className="whitespace-nowrap">{staffName(r.staffId)}</Td>
                          <Td><Badge tone={tone[st] ?? 'gray'}>{st}</Badge></Td>
                          <Td className="whitespace-nowrap text-slate">{r.estimated ? fmtDate(r.estimated) : '—'}</Td>
                          <Td><span className="flex gap-2"><IconBtn icon={Eye} label="Manage delivery" onClick={() => select(r)} /><IconBtn icon={MapPin} label="Open map" onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(`${r.address}, Nepal`)}`, '_blank')} />{r.phone && <IconBtn icon={Phone} label="Call customer" onClick={() => { window.location.href = `tel:${r.phone}`; }} />}</span></Td>
                        </Tr>
                      );
                    })}
                  </Table>
                  {!shown.length && <p className="px-5 py-10 text-center text-[14px] text-slate">No deliveries in this view.</p>}
                  <Pagination text={`Showing ${pg.from}-${pg.to} of ${pg.total} deliveries`} current={pg.page} pageCount={pg.pageCount} onPage={pg.setPage} />
                </>
              )}
            </Card>
          </>
        }
        panel={
          <div className="space-y-4">
            <Panel>
              <PanelTitle>Delivery Tracking</PanelTitle>
              <form onSubmit={(e) => { e.preventDefault(); const q = tracking.trim().toLowerCase().replace('#', ''); const hit = rows.find((r) => r.orderNumber.toLowerCase().replace('#', '').includes(q)); if (q && hit) select(hit); else toast.error('No order found with that ID'); }} className="flex gap-2">
                <input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="Enter tracking ID or order ID" className="h-10 min-w-0 flex-1 rounded-lg border border-line px-3 text-[13.5px] outline-none focus:border-[#077a52]" />
                <button className="rounded-lg bg-[#077a52] px-4 text-[14px] font-semibold text-white">Track</button>
              </form>
              {sel && (
                <div className="mt-4 space-y-3 border-t border-line pt-4">
                  <p className="text-[14px] text-navy"><b>Order {sel.orderNumber}</b> · {sel.customer}<br /><span className="text-[13px] text-slate">{sel.address}{sel.phone ? ` · ${sel.phone}` : ''}</span></p>
                  <Field label="Delivery Staff">
                    <Select value={assignee} onChange={setAssignee}>
                      <option value="">Not assigned</option>
                      {(staff.map((s) => [s.id, s.name] as const)).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                    </Select>
                  </Field>
                  <Field label="Delivery Status"><Select value={nextStatus} onChange={(v) => setNextStatus(v as Status)}>{(Object.keys(labels) as Status[]).map((k) => <option key={k} value={k}>{labels[k]}</option>)}</Select></Field>
                  <button onClick={() => void save()} disabled={saving} className="h-10 w-full rounded-lg bg-[#077a52] text-[14px] font-semibold text-white disabled:opacity-60">{saving ? 'Saving…' : 'Save Delivery'}</button>
                </div>
              )}
            </Panel>
            <Panel>
              <div className="mb-3 flex items-center justify-between"><h2 className="text-[17px] font-bold text-navy">Delivery Area Map</h2><a href={STORE.mapsUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[13px] font-medium text-[#077a52]">Open in Maps <ExternalLink className="size-3.5" /></a></div>
              <a href={STORE.mapsUrl} target="_blank" rel="noreferrer" aria-label="Open the store location in Google Maps"><img src={asset('delivery-map')} alt="Delivery area map around Tulsipur" className="w-full rounded-lg" /></a>
              <div className="mb-2 mt-5 flex items-center justify-between"><h3 className="text-[15px] font-bold text-navy">Delivery Partner Performance</h3><button onClick={() => setTab(4)} className="text-[13px] font-medium text-[#2f73d9]">View All</button></div>
              <ul className="space-y-2.5">
                {partners.slice(0, 4).map(([p, name, count, rate]) => (
                  <li key={name} className="flex items-center gap-3">
                    <Avatar src={'avatar' in p ? (p.avatar ?? undefined) : undefined} name={name} />
                    <span className="flex-1 leading-tight"><span className="block text-[14px] text-navy">{name}</span><span className="text-[12px] text-slate">{count} deliveries</span></span>
                    <span className="text-right leading-tight"><b className="block text-[14px] font-bold text-[#0a8a5b]">{rate}</b><span className="text-[12px] text-[#0a8a5b]">On-time</span></span>
                  </li>
                ))}
                {!partners.length && <li className="text-[13px] text-slate">No delivery staff yet.</li>}
              </ul>
            </Panel>
            <Panel>
              <PanelTitle>Quick Actions</PanelTitle>
              <Link to="/admin/users" className="mb-2.5 flex h-12 w-full items-center gap-3 rounded-lg border border-line px-4 text-[14px] text-navy"><UsersRound className="size-5" />Manage Delivery Partners<ChevronRight className="ml-auto size-4 text-slate" /></Link>
              <Link to="/admin/settings" className="flex h-12 w-full items-center gap-3 rounded-lg border border-line px-4 text-[14px] text-navy"><Settings className="size-5" />Delivery Settings<ChevronRight className="ml-auto size-4 text-slate" /></Link>
            </Panel>
          </div>
        }
      />
    </div>
  );
}
