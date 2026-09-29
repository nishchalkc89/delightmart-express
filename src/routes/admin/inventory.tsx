import { createFileRoute } from '@tanstack/react-router';
import { CircleCheck, CircleX, Download, Ellipsis, ExternalLink, Minus, Package, Pencil, Plus, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge, Card, Checkbox, DataBadge, FilterBar, FiltersButton, IconBtn, OutlineAction, PageHeader, Pagination, Panel, PrimaryAction, SearchBox, SelectBox, StatCard, Table, Tabs, Td, Tr, WithPanel } from '@/components/delight/admin-ui';
import { demoAdminProducts } from '@/components/delight/admin-data';
import { fetchAdminProducts, fmtDate, setStock, useAdminData, type AdminProduct } from '@/services/admin';

export const Route = createFileRoute('/admin/inventory')({
  head: () => ({ meta: [{ title: 'Inventory — Delight Admin' }, { name: 'description', content: 'Track stock levels and low stock alerts.' }, { property: 'og:title', content: 'Inventory — Delight Admin' }, { property: 'og:description', content: 'Stock management.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: Page,
});

const history = [
  ['Stock Updated', '21 Sep 2026, 10:24 AM', '8', 'red'],
  ['Sold (Order #10251)', '20 Sep 2026, 04:12 PM', '-2', 'red'],
  ['Stock Added', '18 Sep 2026, 11:06 AM', '+10', 'green'],
  ['Sold (Order #10240)', '17 Sep 2026, 02:30 PM', '-5', 'red'],
] as const;

function Page() {
  const [tab, setTab] = useState(0);
  const [selId, setSelId] = useState<string | null>(null);
  const [qty, setQty] = useState(8);
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const { rows: all, setRows, live, loading } = useAdminData<AdminProduct>(fetchAdminProducts, demoAdminProducts);
  const isLow = (x: AdminProduct) => x.stock > 0 && x.stock < x.threshold;
  const rows = all
    .filter((x) => tab === 0 || (tab === 1 ? isLow(x) : x.stock <= 0))
    .filter((x) => `${x.name} ${x.sku}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => (live ? a.stock - b.stock : 0));
  const p = all.find((x) => x.id === selId) ?? rows[0] ?? all[0]!;
  const lowCount = all.filter(isLow).length;
  const outCount = all.filter((x) => x.stock <= 0).length;
  const label = (x: AdminProduct) => ('short' in x ? String((x as { short: string }).short) : x.name);
  const cat = (x: AdminProduct) => ('invCategory' in x ? String((x as { invCategory: string }).invCategory) : x.category);
  const when = (x: AdminProduct) => (live ? fmtDate(x.updatedAt) : x.updatedAt);

  async function updateStock() {
    if (!live) { toast.info('Sample data — sign in with a staff account to change real stock.'); return; }
    setSaving(true);
    try {
      await setStock(p.id, p.stock, qty);
      setRows((list) => list.map((x) => (x.id === p.id ? { ...x, stock: qty, updatedAt: new Date().toISOString() } : x)));
      toast.success(`Stock for ${p.name} set to ${qty}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not update stock');
    } finally {
      setSaving(false);
    }
  }

  function exportCsv() {
    const lines = [['Product', 'SKU', 'Category', 'Stock', 'Threshold'], ...all.map((x) => [x.name, x.sku, x.category, String(x.stock), String(x.threshold)])];
    const url = URL.createObjectURL(new Blob(['\ufeff', lines.map((r) => r.map((c) => `"${c.replaceAll('"', '""')}"`).join(',')).join('\r\n')], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = 'delight-inventory.csv'; a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader title="Inventory" subtitle="Track stock levels, manage inventory and get low stock alerts." badge={<DataBadge live={live} loading={loading} />} actions={<><OutlineAction icon={Download} onClick={exportCsv}>Export</OutlineAction><PrimaryAction icon={Plus} onClick={() => void updateStock()}>Update Stock</PrimaryAction></>} />
      <WithPanel
        main={
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard icon={Package} tone="green" label="Total Products" value={live ? String(all.length) : '1,248'} delta={live ? undefined : '+12%'} filled={false} />
              <StatCard icon={CircleCheck} tone="green" label="In Stock" value={live ? String(all.length - outCount) : '1,082'} delta={live ? undefined : '+8%'} />
              <StatCard icon={TriangleAlert} tone="amber" label="Low Stock" value={live ? String(lowCount) : '98'} delta={live ? undefined : '-15%'} dir="down" />
              <StatCard icon={CircleX} tone="red" label="Out of Stock" value={live ? String(outCount) : '68'} delta={live ? undefined : '-22%'} dir="down" />
            </div>
            <Card className="mt-4">
              <Tabs items={live ? [`All Products (${all.length})`, `Low Stock (${lowCount})`, `Out of Stock (${outCount})`] : ['All Products (1,248)', 'Low Stock (98)', 'Out of Stock (68)']} active={tab} onChange={setTab} />
              <FilterBar>
                <SearchBox placeholder="Search by product name or SKU..." value={query} onChange={setQuery} className="w-[228px]" />
                <SelectBox label="All Categories" className="w-[150px]" />
                <SelectBox label="All Status" className="w-[150px]" />
                <SelectBox label="Sort by: Stock (Low to High)" className="w-[198px]" />
                <FiltersButton />
              </FilterBar>
              <Table head={[<Checkbox key="c" />, 'Product', 'SKU', 'Category', 'Current Stock', 'Threshold', 'Status', 'Last Updated', 'Actions']}>
                {rows.map((x) => {
                  const low = isLow(x);
                  return (
                    <Tr key={x.id} active={x.id === p.id} onClick={() => { setSelId(x.id); setQty(x.stock); }}>
                      <Td><Checkbox /></Td>
                      <Td><span className="flex items-center gap-2.5">{x.image && <img src={x.image} alt="" className="size-8 shrink-0 object-contain" />}<span className="leading-tight">{label(x)}</span></span></Td>
                      <Td className="text-slate">{x.sku}</Td>
                      <Td className="text-slate">{cat(x)}</Td>
                      <Td className={x.stock <= 0 || low ? 'text-[#e3101a]' : ''}>{x.stock}</Td>
                      <Td>{x.threshold}</Td>
                      <Td>{x.stock <= 0 ? <Badge tone="red">Out of Stock</Badge> : low ? <Badge tone="amber">Low Stock</Badge> : <Badge tone="green">In Stock</Badge>}</Td>
                      <Td className="whitespace-nowrap text-slate">{when(x)}</Td>
                      <Td><span className="flex gap-2"><IconBtn icon={Pencil} label="Edit" /><IconBtn icon={Ellipsis} label="More" /></span></Td>
                    </Tr>
                  );
                })}
              </Table>
              <Pagination text={`Showing 1-${rows.length} of ${live ? all.length : '1,248'} products`} pages={live ? [1] : undefined} />
            </Card>
          </>
        }
        panel={
          <Panel title="Product Details" onClose={() => undefined}>
            <div className="flex gap-4">
              {p.image ? <img src={p.image} alt="" className="size-[72px] object-contain" /> : <span className="size-[72px] rounded bg-[#f1f4f7]" />}
              <div><b className="block text-[15px] font-semibold text-navy">{label(p)}</b><span className="text-[13px] text-slate">{p.sku}</span><Badge tone={p.active ? 'green' : 'red'} className="mt-2 !flex w-fit items-center gap-1"><CircleCheck className="size-3.5" />{p.active ? 'Active' : 'Inactive'}</Badge></div>
            </div>
            <div className="-mx-5 mt-4 flex gap-5 whitespace-nowrap border-b border-line px-5 text-[13.5px]">
              {['Stock Info', 'Product Info', 'Sales History'].map((t, i) => <span key={t} className={`relative pb-2.5 ${i === 0 ? 'font-semibold text-[#077a52]' : 'text-slate'}`}>{t}{i === 0 && <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-full bg-[#077a52]" />}</span>)}
            </div>
            <p className="mt-4 text-[14px] font-medium text-navy">Current Stock</p>
            <div className="mt-2 flex items-center gap-3">
              <span className={`flex h-10 flex-1 items-center rounded-lg px-4 text-[16px] ${p.stock < p.threshold ? 'bg-[#fde7e7] text-[#e3101a]' : 'bg-[#e3f6ec] text-[#0a8a5b]'}`}>{p.stock}</span>
              {p.stock < p.threshold && <Badge tone="amber" className="!px-3 !py-1.5">Low Stock</Badge>}
            </div>
            <p className="mt-4 text-[14px] font-medium text-navy">Threshold Level</p>
            <span className="mt-2 flex h-10 items-center rounded-lg border border-line px-4 text-[15px]">{p.threshold}</span>
            <p className="mt-1 text-[12px] text-slate">Get notified when stock is below this level</p>
            <p className="mt-4 text-[14px] font-medium text-navy">Update Stock</p>
            <div className="mt-2 flex gap-3">
              <div className="flex h-10 items-center rounded-lg border border-line">
                <button aria-label="Decrease" onClick={() => setQty(Math.max(0, qty - 1))} className="grid h-full w-9 place-items-center"><Minus className="size-4" /></button>
                <span className="w-12 border-x border-line text-center text-[15px] leading-10">{qty}</span>
                <button aria-label="Increase" onClick={() => setQty(qty + 1)} className="grid h-full w-9 place-items-center"><Plus className="size-4" /></button>
              </div>
              <button onClick={() => void updateStock()} disabled={saving} className="flex-1 rounded-lg bg-[#077a52] text-[15px] font-semibold text-white disabled:opacity-60">{saving ? 'Saving…' : 'Update'}</button>
            </div>
            <h3 className="mt-5 text-[15px] font-bold text-navy">Stock History</h3>
            <ul className="mt-2 divide-y divide-line">
              {history.map(([t, d, v, c]) => (
                <li key={t} className="flex items-start gap-3 py-2.5">
                  <span className={`mt-1.5 size-2.5 rounded-full ${c === 'green' ? 'bg-[#0a8a5b]' : 'bg-[#ef4444]'}`} />
                  <span className="flex-1 text-[13px] leading-5"><span className="block text-navy">{t}</span><span className="text-slate">{d}</span></span>
                  <span className={`text-[14px] ${c === 'green' ? 'text-[#0a8a5b]' : 'text-[#e3101a]'}`}>{v}</span>
                </li>
              ))}
            </ul>
            <button className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-[#9dc9f5] text-[14px] font-medium text-[#2f73d9]">View Full History <ExternalLink className="size-4" /></button>
          </Panel>
        }
      />
    </div>
  );
}
